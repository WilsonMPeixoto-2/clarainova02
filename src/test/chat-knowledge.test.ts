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

  it("guarantees migration guide and substitution decree coverage for transition coexistence questions", () => {
    const decision = prepareKnowledgeDecision(
      "Durante a transição, o servidor pode continuar usando o Processo.rio ao mesmo tempo que o SEI.Rio?",
      [
        {
          document_name: "Decreto Rio nº 57.250 de 19 de novembro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.35,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.019,
          content:
            "[Fonte: Decreto Rio nº 57.250 de 19 de novembro de 2025 | Página: 1]\n\nO SEI.Rio passa a ser o sistema corporativo de gestão de processos e documentos administrativos no âmbito do Poder Executivo municipal.",
        },
        {
          document_name: "Decreto Rio nº 57.250 de 19 de novembro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.35,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.0185,
          content:
            "[Fonte: Decreto Rio nº 57.250 de 19 de novembro de 2025 | Página: 4]\n\nOs novos processos devem ser iniciados no SEI.Rio conforme cronograma definido para a implantação do sistema.",
        },
        {
          document_name: "Decreto Rio nº 57.250 de 19 de novembro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.35,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.018,
          content:
            "[Fonte: Decreto Rio nº 57.250 de 19 de novembro de 2025 | Página: 11]\n\nO período de transição terá marcos definidos para abertura, instrução e encerramento do uso operacional do Processo.rio.",
        },
        {
          document_name: "Guia de migracao – SEI.Rio",
          document_kind: "guia",
          document_authority_level: "official",
          document_search_weight: 1.12,
          document_topic_scope: "sei_rio_guia",
          similarity: 0.0175,
          content:
            "[Fonte: Guia de migracao – SEI.Rio | Página: 1]\n\nDurante a migração, os processos que ainda não foram migrados podem continuar recebendo instrução no Processo.rio até o marco final do período de transição.",
        },
        {
          document_name: "Guia do usuário interno – SEI.Rio",
          document_kind: "guia",
          document_authority_level: "official",
          document_search_weight: 1.12,
          document_topic_scope: "sei_rio_guia",
          similarity: 0.017,
          content:
            "[Fonte: Guia do usuário interno – SEI.Rio | Página: 3]\n\nO acesso ao SEI.Rio exige login por matrícula e navegação pelos menus de processo, documento e assinatura.",
        },
        {
          document_name: "Decreto Rio nº 57.250 de 19 de novembro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.35,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.0165,
          content:
            "[Fonte: Decreto Rio nº 57.250 de 19 de novembro de 2025 | Página: 5]\n\nO credenciamento de usuário externo no SEI.Rio será feito por autocadastro com autenticação gov.br.",
        },
        {
          document_name: "Decreto Rio nº 55.615 de 1º de janeiro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.32,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.011,
          content:
            "[Fonte: Decreto Rio nº 55.615 de 1º de janeiro de 2025 | Página: 1]\n\nDispõe sobre a substituição do Sistema Eletrônico de Documentos e Processos - Processo.rio pelo Sistema Eletrônico de Informações - SEI-Rio.",
        },
      ],
    );

    const documentNames = decision.references.map((reference) => reference.documentName);

    expect(documentNames).toContain("Guia de migracao – SEI.Rio");
    expect(documentNames).toContain("Decreto Rio nº 55.615 de 1º de janeiro de 2025");
    expect(decision.references).toHaveLength(6);
  });

  it("guarantees terms coverage for external-user responsibility questions even when the term chunk ranks lower", () => {
    const decision = prepareKnowledgeDecision(
      "O credenciamento de usuário externo no SEI.Rio é pessoal e intransferível?",
      [
        {
          document_name: "Decreto Rio nº 57.250 de 19 de novembro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.35,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.019,
          content:
            "[Fonte: Decreto Rio nº 57.250 de 19 de novembro de 2025 | Página: 5]\n\nO credenciamento de usuário externo no SEI.Rio é ato pessoal e intransferível, condicionado à aceitação das regras do sistema.",
        },
        {
          document_name: "Decreto Rio nº 57.250 de 19 de novembro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.35,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.018,
          content:
            "[Fonte: Decreto Rio nº 57.250 de 19 de novembro de 2025 | Página: 4]\n\nOs usuários internos e externos devem observar os deveres de acesso, guarda de informações e proteção dos dados tratados no sistema.",
        },
        {
          document_name: "Decreto Rio nº 57.250 de 19 de novembro de 2025",
          document_kind: "norma",
          document_authority_level: "official",
          document_search_weight: 1.35,
          document_topic_scope: "sei_rio_norma",
          similarity: 0.0175,
          content:
            "[Fonte: Decreto Rio nº 57.250 de 19 de novembro de 2025 | Página: 7]\n\nO uso do sistema deve observar os níveis de acesso e as responsabilidades pela guarda das informações.",
        },
        {
          document_name: "Guia do usuario externo – SEI.Rio",
          document_kind: "guia",
          document_authority_level: "official",
          document_search_weight: 1.12,
          document_topic_scope: "sei_rio_guia",
          similarity: 0.017,
          content:
            "[Fonte: Guia do usuario externo – SEI.Rio | Página: 2]\n\nO usuário externo deve manter seus dados cadastrais atualizados para acessar corretamente o módulo de peticionamento.",
        },
        {
          document_name: "Guia do usuario externo – SEI.Rio",
          document_kind: "guia",
          document_authority_level: "official",
          document_search_weight: 1.12,
          document_topic_scope: "sei_rio_guia",
          similarity: 0.0165,
          content:
            "[Fonte: Guia do usuario externo – SEI.Rio | Página: 1]\n\nA autenticação do usuário externo é feita com conta gov.br prata ou ouro para acesso ao SEI.Rio.",
        },
        {
          document_name: "Perguntas frequentes do cidadão – SEI.Rio",
          document_kind: "faq",
          document_authority_level: "institutional",
          document_search_weight: 0.92,
          document_topic_scope: "sei_rio_faq",
          similarity: 0.016,
          content:
            "[Fonte: Perguntas frequentes do cidadão – SEI.Rio | Página: 1]\n\nO cadastro do usuário externo depende da autenticação gov.br e do preenchimento correto dos dados pessoais.",
        },
        {
          document_name: "Termo de Uso e Aviso de Privacidade do SEI.Rio",
          document_kind: "apoio",
          document_authority_level: "official",
          document_search_weight: 1.12,
          document_topic_scope: "sei_rio_termo",
          similarity: 0.0105,
          content:
            "[Fonte: Termo de Uso e Aviso de Privacidade do SEI.Rio | Página: 5]\n\nÉ de responsabilidade do usuário externo manter sigilo da senha de acesso e assinatura eletrônica, respondendo pelo uso indevido praticado a partir de seu acesso ao serviço.",
        },
      ],
    );

    const documentNames = decision.references.map((reference) => reference.documentName);

    expect(documentNames).toContain("Termo de Uso e Aviso de Privacidade do SEI.Rio");
    expect(documentNames).toContain("Decreto Rio nº 57.250 de 19 de novembro de 2025");
    expect(decision.references).toHaveLength(6);
  });
});
