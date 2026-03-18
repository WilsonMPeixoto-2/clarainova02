import { describe, expect, it } from "vitest";

import { classifyKnowledgeDocument } from "@/lib/knowledge-document-classifier";

describe("knowledge document classifier", () => {
  it("marks CLARA technical documents as internal and non-searchable", () => {
    const result = classifyKnowledgeDocument(
      "backend-principios-clara.pdf",
      "O backend da CLARA usa Supabase, embeddings, schema JSON, telemetria e edge functions para operar o RAG.",
    );

    expect(result.topicScope).toBe("clara_internal");
    expect(result.shouldIndex).toBe(false);
    expect(result.warning).toContain("material interno");
  });

  it("keeps SEI manuals searchable", () => {
    const result = classifyKnowledgeDocument(
      "Manual SEI-Rio.pdf",
      "Este manual explica como incluir documento externo, encaminhar processo, usar bloco de assinatura e conferir a tramitacao no SEI-Rio.",
    );

    expect(result.topicScope).toBe("sei_rio_manual");
    expect(result.shouldIndex).toBe(true);
    expect(result.documentKind).toBe("manual");
    expect(result.authorityLevel).toBe("official");
    expect(result.warning).toBeNull();
  });

  it("detects FAQ material separately from manuals and guides", () => {
    const result = classifyKnowledgeDocument(
      "FAQ SEI-Rio.pdf",
      "Perguntas frequentes sobre o SEI-Rio, incluindo como incluir documento, enviar processo e usar assinatura.",
    );

    expect(result.topicScope).toBe("sei_rio_faq");
    expect(result.documentKind).toBe("faq");
    expect(result.shouldIndex).toBe(true);
  });

  it("prioritizes normative documents when procedural and normative signals coexist", () => {
    const result = classifyKnowledgeDocument(
      "Portaria sobre tramitacao no SEI-Rio.pdf",
      "Esta portaria disciplina a tramitacao de processos no SEI-Rio, incluindo envio entre unidades e assinatura.",
    );

    expect(result.topicScope).toBe("sei_rio_norma");
    expect(result.documentKind).toBe("norma");
    expect(result.searchWeight).toBeGreaterThan(1.1);
  });
});
