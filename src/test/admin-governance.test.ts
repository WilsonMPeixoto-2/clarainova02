import { describe, expect, it } from "vitest";

import {
  DEFAULT_UPLOAD_GOVERNANCE_FORM,
  parseDocumentGovernanceMetadata,
  resolveUploadGovernance,
} from "@/lib/admin-governance";

describe("admin governance resolver", () => {
  it("keeps official SEI manuals in the core corpus with high priority by default", () => {
    const resolved = resolveUploadGovernance(
      "Manual SEI-Rio.pdf",
      "Manual operacional do SEI-Rio sobre tramitacao, assinatura, documento externo e encaminhamento entre unidades.",
      DEFAULT_UPLOAD_GOVERNANCE_FORM,
    );

    expect(resolved.topicScope).toBe("sei_rio_manual");
    expect(resolved.documentKind).toBe("manual");
    expect(resolved.authorityLevel).toBe("official");
    expect(resolved.corpusCategory).toBe("nucleo_oficial");
    expect(resolved.ingestionPriority).toBe("alta");
    expect(resolved.isActive).toBe(true);
  });

  it("forces internal technical material out of chat when classification stays automatic", () => {
    const resolved = resolveUploadGovernance(
      "backend-principios-clara.pdf",
      "O backend da CLARA usa Supabase, embeddings, schema JSON, telemetria e edge functions para operar o RAG.",
      DEFAULT_UPLOAD_GOVERNANCE_FORM,
    );

    expect(resolved.topicScope).toBe("clara_internal");
    expect(resolved.documentKind).toBe("internal_technical");
    expect(resolved.corpusCategory).toBe("interno_excluido");
    expect(resolved.ingestionPriority).toBe("baixa");
    expect(resolved.searchWeight).toBe(0);
    expect(resolved.isActive).toBe(false);
  });

  it("parses governance metadata from document rows", () => {
    const metadata = parseDocumentGovernanceMetadata({
      document_kind: "manual",
      authority_level: "official",
      search_weight: 1.3,
      corpus_category: "nucleo_oficial",
      ingestion_priority: "alta",
      governance_notes: "entra antes dos guias",
    });

    expect(metadata.documentKind).toBe("manual");
    expect(metadata.authorityLevel).toBe("official");
    expect(metadata.searchWeight).toBe(1.3);
    expect(metadata.corpusCategory).toBe("nucleo_oficial");
    expect(metadata.ingestionPriority).toBe("alta");
    expect(metadata.governanceNotes).toBe("entra antes dos guias");
  });
});
