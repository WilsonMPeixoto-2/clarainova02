import { KEYWORD_ONLY_QUERY_EMBEDDING_MODEL } from "./retrieval-mode.ts";

export type ChatTelemetryQualityAssessment = {
  responseStatus: "answered" | "partial" | "failed";
  ragConfidenceScore: number | null;
  isAnsweredSatisfactorily: boolean | null;
  needsContentGapReview: boolean;
  gapReason: string | null;
};

type SuccessfulResponseQualityInput = {
  retrievalMode: string;
  modelName: string;
  ragQualityScore: number | null;
  citationsCount: number;
  queryEmbeddingModel: string;
};

type FailedResponseQualityInput = {
  retrievalMode: string;
  providerUnavailable: boolean;
  queryEmbeddingModel: string;
};

const LOW_RAG_CONFIDENCE_THRESHOLD = 0.6;
const FALLBACK_CONFIDENCE_CEILING = 0.49;

function normalizeScore(value: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 1000) / 1000;
}

function buildGapSignal(input: {
  retrievalMode: string;
  ragConfidenceScore: number | null;
  citationsCount: number;
  queryEmbeddingModel: string;
}) {
  if (input.queryEmbeddingModel === KEYWORD_ONLY_QUERY_EMBEDDING_MODEL) {
    return {
      needsContentGapReview: true,
      gapReason: "corpus_sem_embedding",
    };
  }

  if (input.retrievalMode !== "model_grounded") {
    return {
      needsContentGapReview: true,
      gapReason: "sem_cobertura_documental",
    };
  }

  if (input.citationsCount <= 0) {
    return {
      needsContentGapReview: true,
      gapReason: "resposta_sem_citacoes",
    };
  }

  if (input.ragConfidenceScore !== null && input.ragConfidenceScore < LOW_RAG_CONFIDENCE_THRESHOLD) {
    return {
      needsContentGapReview: true,
      gapReason: "baixa_confianca_rag",
    };
  }

  return {
    needsContentGapReview: false,
    gapReason: null,
  };
}

export function assessSuccessfulResponseQuality(
  input: SuccessfulResponseQualityInput,
): ChatTelemetryQualityAssessment {
  const rawConfidence = normalizeScore(input.ragQualityScore);
  const providerFallback = input.modelName === "grounded_fallback";
  const ragConfidenceScore = providerFallback
    ? rawConfidence === null
      ? 0.35
      : Math.min(rawConfidence, FALLBACK_CONFIDENCE_CEILING)
    : rawConfidence;

  const gapSignal = buildGapSignal({
    retrievalMode: input.retrievalMode,
    ragConfidenceScore,
    citationsCount: input.citationsCount,
    queryEmbeddingModel: input.queryEmbeddingModel,
  });

  return {
    responseStatus: providerFallback || gapSignal.needsContentGapReview ? "partial" : "answered",
    ragConfidenceScore,
    isAnsweredSatisfactorily: null,
    needsContentGapReview: gapSignal.needsContentGapReview,
    gapReason: gapSignal.gapReason,
  };
}

export function assessFailedResponseQuality(
  input: FailedResponseQualityInput,
): ChatTelemetryQualityAssessment {
  if (input.providerUnavailable) {
    return {
      responseStatus: "failed",
      ragConfidenceScore: null,
      isAnsweredSatisfactorily: false,
      needsContentGapReview: false,
      gapReason: "falha_provedor",
    };
  }

  if (input.queryEmbeddingModel === KEYWORD_ONLY_QUERY_EMBEDDING_MODEL) {
    return {
      responseStatus: "failed",
      ragConfidenceScore: null,
      isAnsweredSatisfactorily: false,
      needsContentGapReview: true,
      gapReason: "corpus_sem_embedding",
    };
  }

  if (input.retrievalMode !== "model_grounded") {
    return {
      responseStatus: "failed",
      ragConfidenceScore: null,
      isAnsweredSatisfactorily: false,
      needsContentGapReview: true,
      gapReason: "sem_cobertura_documental",
    };
  }

  return {
    responseStatus: "failed",
    ragConfidenceScore: null,
    isAnsweredSatisfactorily: false,
    needsContentGapReview: false,
    gapReason: "falha_modelo",
  };
}
