import { describe, expect, it } from "vitest";

import {
  buildDocumentChunkMetadata,
  buildDocumentEmbeddingText,
  buildQueryEmbeddingText,
  estimateTokenCount,
  normalizeL2,
  EMBEDDING_CONTRACT_VERSION,
  EMBEDDING_DOMAIN_SCOPE,
  EMBEDDING_NORMALIZATION,
} from "../../supabase/functions/_shared/embedding-contract";

describe("embedding contract helpers", () => {
  it("normalizes vectors with L2 norm when values are non-zero", () => {
    const normalized = normalizeL2([3, 4]);
    const norm = Math.sqrt(normalized.reduce((sum, value) => sum + value * value, 0));

    expect(normalized[0]).toBeCloseTo(0.6, 5);
    expect(normalized[1]).toBeCloseTo(0.8, 5);
    expect(norm).toBeCloseTo(1, 8);
  });

  it("keeps zero vectors unchanged", () => {
    expect(normalizeL2([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("builds chunk metadata with explicit task, title and normalization", () => {
    const metadata = buildDocumentChunkMetadata({
      sourceTag: "manual-sei.pdf",
      pageStart: 47,
      pageEnd: 49,
      sectionTitle: "Assinatura",
      taskType: "RETRIEVAL_DOCUMENT",
      titleUsed: "SEI-Guia-do-usuario-Versao-final.pdf",
      inputStyle: "textual_task_instruction_plus_api_task_type",
      contractVersion: EMBEDDING_CONTRACT_VERSION,
      domainScope: EMBEDDING_DOMAIN_SCOPE,
    });

    expect(metadata).toEqual({
      source_tag: "manual-sei.pdf",
      page_start: 47,
      page_end: 49,
      section_title: "Assinatura",
      task_type: "RETRIEVAL_DOCUMENT",
      title_used: "SEI-Guia-do-usuario-Versao-final.pdf",
      input_style: "textual_task_instruction_plus_api_task_type",
      contract_version: EMBEDDING_CONTRACT_VERSION,
      domain_scope: EMBEDDING_DOMAIN_SCOPE,
      normalization: EMBEDDING_NORMALIZATION,
    });
  });

  it("builds query embedding text with domain framing", () => {
    const text = buildQueryEmbeddingText("Como incluir documento externo no processo?");

    expect(text).toContain("task: retrieval_query");
    expect(text).toContain(`domain: ${EMBEDDING_DOMAIN_SCOPE}`);
    expect(text).toContain("query: Como incluir documento externo no processo?");
  });

  it("builds document embedding text with title, section and source metadata", () => {
    const text = buildDocumentEmbeddingText({
      content: "No menu principal, selecione Incluir Documento.",
      titleUsed: "Guia do usuário interno",
      sectionTitle: "Inclusão de documentos",
      sourceTag: "manual-sei.pdf",
    });

    expect(text).toContain("task: retrieval_document");
    expect(text).toContain(`domain: ${EMBEDDING_DOMAIN_SCOPE}`);
    expect(text).toContain("title: Guia do usuário interno");
    expect(text).toContain("section: Inclusão de documentos");
    expect(text).toContain("source: manual-sei.pdf");
    expect(text).toContain("text: No menu principal, selecione Incluir Documento.");
  });

  it("estimates tokens conservatively from text length", () => {
    expect(estimateTokenCount("abcd")).toBe(1);
    expect(estimateTokenCount("abcdefgh")).toBe(2);
    expect(estimateTokenCount("a")).toBe(1);
  });
});
