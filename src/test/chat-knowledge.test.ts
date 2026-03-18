import { describe, expect, it } from "vitest";

import { prepareKnowledgeDecision } from "../../supabase/functions/chat/knowledge";

describe("prepareKnowledgeDecision", () => {
  it("returns grounded context when retrieval is strong", () => {
    const decision = prepareKnowledgeDecision("Como anexar documentos no SEI?", [
      {
        document_name: "Manual SEI.pdf",
        similarity: 0.018,
        content:
          "[Fonte: Manual SEI.pdf | Página: 12]\n\nPara anexar documentos no SEI, abra o processo desejado e selecione a opcao Incluir Documento. Em seguida, escolha o tipo documental adequado e confirme o preenchimento dos campos obrigatorios.",
      },
      {
        document_name: "Manual SEI.pdf",
        similarity: 0.015,
        content:
          "[Fonte: Manual SEI.pdf | Página: 13]\n\nDepois de incluir o documento, use a funcao Assinar para concluir a etapa. O sistema exige o preenchimento correto da descricao e da classificacao antes do envio.",
      },
    ]);

    expect(decision.knowledgeContext).toContain("BASE DE CONHECIMENTO INTERNA");
    expect(decision.sources).toContain("Manual SEI.pdf - Página 12");
    expect(decision.topScore).toBeGreaterThan(0);
  });

  it("returns knowledge context for model when retrieval is relevant", () => {
    const decision = prepareKnowledgeDecision("Como validar assinatura digital?", [
      {
        document_name: "Guia Pratico.pdf",
        similarity: 0.008,
        content:
          "[Fonte: Guia Pratico.pdf | Página: 22]\n\nA validacao de assinatura digital deve observar a autenticidade do certificado e o registro da assinatura no documento final.",
      },
    ]);

    expect(decision.knowledgeContext).toContain("REFERENCIAS AUTORIZADAS");
    expect(decision.knowledgeContext).toContain("[Referencia 1: Guia Pratico.pdf - Página 22]");
  });

  it("prefers explicit section and page metadata when available", () => {
    const decision = prepareKnowledgeDecision("Como usar bloco de assinatura no SEI-Rio?", [
      {
        document_name: "Manual SEI-Rio.pdf",
        similarity: 0.019,
        page_start: 44,
        page_end: 45,
        section_title: "Bloco de assinatura",
        content:
          "Para disponibilizar um documento em bloco de assinatura, abra o processo, escolha a opcao correspondente e selecione as unidades participantes antes de concluir o envio.",
      },
    ]);

    expect(decision.sources).toContain("Manual SEI-Rio.pdf - Bloco de assinatura - Página 44-45");
    expect(decision.knowledgeContext).toContain("Manual SEI-Rio.pdf - Bloco de assinatura - Página 44-45");
  });

  it("ignores weak chunks without lexical overlap", () => {
    const decision = prepareKnowledgeDecision("Como solicitar assinatura de outra unidade?", [
      {
        document_name: "Manual SEI-Rio.pdf",
        similarity: 0.005,
        content:
          "[Fonte: Manual SEI-Rio.pdf | Página: 9]\n\nA parametrizacao inicial do sistema e realizada pela administracao central da plataforma.",
      },
    ]);

    expect(decision.relevantChunks).toHaveLength(0);
    expect(decision.sources).toHaveLength(0);
    expect(decision.knowledgeContext).toBe("");
  });

  it("includes 'sei' as a protected token in tokenization", () => {
    const decision = prepareKnowledgeDecision("Como usar o SEI?", [
      {
        document_name: "Manual SEI.pdf",
        similarity: 0.008,
        content:
          "[Fonte: Manual SEI.pdf | Página: 1]\n\nO SEI e o sistema de processos eletronicos utilizado para tramitacao e gestao documental.",
      },
    ]);

    expect(decision.relevantChunks).toHaveLength(1);
    expect(decision.sources).toContain("Manual SEI.pdf - Página 1");
  });

  it("accepts strong semantic chunks even without lexical overlap", () => {
    const decision = prepareKnowledgeDecision("Como incluir arquivo no processo?", [
      {
        document_name: "Manual SEI-Rio.pdf",
        similarity: 0.015,
        content:
          "Para anexar documentos no sistema eletronico, abra o procedimento desejado e selecione a opcao correspondente no menu lateral.",
      },
    ]);

    expect(decision.relevantChunks).toHaveLength(1);
  });

  it("rejects internal technical chunks for procedural SEI questions", () => {
    const decision = prepareKnowledgeDecision("Como incluir documento externo no SEI-Rio?", [
      {
        document_name: "backend-principios-clara.pdf",
        similarity: 0.018,
        content:
          "O backend da CLARA usa Supabase, embeddings, telemetria, schema JSON e funcoes edge para processar o RAG.",
      },
      {
        document_name: "Manual SEI-Rio.pdf",
        similarity: 0.013,
        content:
          "[Fonte: Manual SEI-Rio.pdf | Página: 21]\n\nPara incluir documento externo, abra o processo, acesse Incluir Documento, escolha Documento Externo e preencha os campos obrigatorios antes de confirmar.",
      },
    ]);

    expect(decision.relevantChunks).toHaveLength(1);
    expect(decision.sources).toEqual(["Manual SEI-Rio.pdf - Página 21"]);
    expect(decision.knowledgeContext).not.toContain("backend da CLARA");
  });

  it("builds numbered references for grounded citation use", () => {
    const decision = prepareKnowledgeDecision("Como montar um bloco de assinatura no SEI-Rio?", [
      {
        document_name: "Guia SEI-Rio.pdf",
        similarity: 0.017,
        page_start: 44,
        page_end: 45,
        section_title: "Bloco de assinatura",
        content:
          "Para incluir documentos em bloco de assinatura, abra o processo, selecione a opcao do bloco e escolha as unidades participantes.",
      },
    ]);

    expect(decision.references).toEqual([
      {
        id: 1,
        sourceLabel: "Guia SEI-Rio.pdf - Bloco de assinatura - Página 44-45",
        documentName: "Guia SEI-Rio.pdf",
        documentKind: null,
        pageLabel: "44-45",
        sectionTitle: "Bloco de assinatura",
      },
    ]);
    expect(decision.knowledgeContext).toContain("REFERENCIAS AUTORIZADAS");
    expect(decision.knowledgeContext).toContain("1. Guia SEI-Rio.pdf - Bloco de assinatura - Página 44-45");
  });

  it("prioritizes official manuals over weaker support material", () => {
    const decision = prepareKnowledgeDecision("Como incluir documento externo no SEI-Rio?", [
      {
        document_name: "Apoio rapido.pdf",
        document_kind: "apoio",
        document_authority_level: "supporting",
        document_search_weight: 0.8,
        document_topic_scope: "material_apoio",
        similarity: 0.017,
        content:
          "Material resumido sobre documento externo no sistema, sem detalhamento oficial das etapas obrigatorias.",
      },
      {
        document_name: "Manual SEI-Rio.pdf",
        document_kind: "manual",
        document_authority_level: "official",
        document_search_weight: 1.3,
        document_topic_scope: "sei_rio_manual",
        similarity: 0.015,
        content:
          "[Fonte: Manual SEI-Rio.pdf | Página: 21]\n\nPara incluir documento externo, abra o processo, acesse Incluir Documento, escolha Documento Externo e preencha os campos obrigatorios antes de confirmar.",
      },
    ]);

    expect(decision.references[0]?.documentName).toBe("Manual SEI-Rio.pdf");
    expect(decision.sources[0]).toContain("Manual SEI-Rio.pdf");
  });
});
