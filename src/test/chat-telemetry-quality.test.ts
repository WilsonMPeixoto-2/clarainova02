import { describe, expect, it } from "vitest";

import {
  assessFailedResponseQuality,
  assessSuccessfulResponseQuality,
} from "../../supabase/functions/chat/telemetry-quality";
import { KEYWORD_ONLY_QUERY_EMBEDDING_MODEL } from "../../supabase/functions/chat/retrieval-mode";

describe("chat telemetry quality", () => {
  it("does not auto-mark grounded answers as satisfactory", () => {
    const result = assessSuccessfulResponseQuality({
      retrievalMode: "model_grounded",
      modelName: "gemini-3.1-pro-preview",
      ragQualityScore: 0.82,
      citationsCount: 3,
      queryEmbeddingModel: "gemini-embedding-2-preview@768",
    });

    expect(result.responseStatus).toBe("answered");
    expect(result.ragConfidenceScore).toBe(0.82);
    expect(result.isAnsweredSatisfactorily).toBeNull();
    expect(result.needsContentGapReview).toBe(false);
    expect(result.gapReason).toBeNull();
  });

  it("flags grounded fallback as partial and low-confidence", () => {
    const result = assessSuccessfulResponseQuality({
      retrievalMode: "model_grounded",
      modelName: "grounded_fallback",
      ragQualityScore: 0.91,
      citationsCount: 2,
      queryEmbeddingModel: "gemini-embedding-2-preview@768",
    });

    expect(result.responseStatus).toBe("partial");
    expect(result.ragConfidenceScore).toBe(0.49);
    expect(result.isAnsweredSatisfactorily).toBeNull();
    expect(result.needsContentGapReview).toBe(true);
    expect(result.gapReason).toBe("baixa_confianca_rag");
  });

  it("treats active corpus without embeddings as a content gap", () => {
    const result = assessSuccessfulResponseQuality({
      retrievalMode: "model_grounded",
      modelName: "gemini-3.1-flash-lite-preview",
      ragQualityScore: 0.74,
      citationsCount: 2,
      queryEmbeddingModel: KEYWORD_ONLY_QUERY_EMBEDDING_MODEL,
    });

    expect(result.responseStatus).toBe("partial");
    expect(result.needsContentGapReview).toBe(true);
    expect(result.gapReason).toBe("corpus_sem_embedding");
  });

  it("separates provider failure from content failure", () => {
    const result = assessFailedResponseQuality({
      retrievalMode: "model_grounded",
      providerUnavailable: true,
      queryEmbeddingModel: "gemini-embedding-2-preview@768",
    });

    expect(result.responseStatus).toBe("failed");
    expect(result.isAnsweredSatisfactorily).toBe(false);
    expect(result.needsContentGapReview).toBe(false);
    expect(result.gapReason).toBe("falha_provedor");
  });

  it("marks non-grounded failures as missing content coverage", () => {
    const result = assessFailedResponseQuality({
      retrievalMode: "model_only",
      providerUnavailable: false,
      queryEmbeddingModel: "gemini-embedding-2-preview@768",
    });

    expect(result.responseStatus).toBe("failed");
    expect(result.needsContentGapReview).toBe(true);
    expect(result.gapReason).toBe("sem_cobertura_documental");
  });
});
