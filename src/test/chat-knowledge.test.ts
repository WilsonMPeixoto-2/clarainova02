import { describe, expect, it } from "vitest";

import { prepareKnowledgeDecision } from "../../supabase/functions/chat/knowledge";

describe("prepareKnowledgeDecision", () => {
  it("returns a knowledge-only answer when retrieval is strong", () => {
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

    expect(decision.useKnowledgeOnly).toBe(true);
    expect(decision.knowledgeOnlyResponse).toContain("base de conhecimento");
    expect(decision.sources).toContain("Manual SEI.pdf - pagina 12");
  });

  it("keeps knowledge context for model fallback when retrieval is relevant but incomplete", () => {
    const decision = prepareKnowledgeDecision("Como validar assinatura digital?", [
      {
        document_name: "Guia Pratico.pdf",
        similarity: 0.008,
        content:
          "[Fonte: Guia Pratico.pdf | Página: 22]\n\nA validacao de assinatura digital deve observar a autenticidade do certificado e o registro da assinatura no documento final.",
      },
    ]);

    expect(decision.useKnowledgeOnly).toBe(false);
    expect(decision.knowledgeContext).toContain("[Fonte Oficial: Guia Pratico.pdf]");
  });
});
