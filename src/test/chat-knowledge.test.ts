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

    expect(decision.knowledgeContext).toContain("[Fonte Oficial: Guia Pratico.pdf");
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
});
