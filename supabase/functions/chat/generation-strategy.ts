import type { RetrievalQualityInfo, SourceTargetRoute } from "./knowledge.ts";

export const GEMINI_FLASH_LITE_MODEL = "gemini-3.1-flash-lite-preview";
export const GEMINI_PRO_MODEL = "gemini-3.1-pro-preview";

export type GeminiModelName = typeof GEMINI_FLASH_LITE_MODEL | typeof GEMINI_PRO_MODEL;
export type GeminiThinkingLevel = "low" | "high";

export type GenerationStrategy = {
  orderedModels: GeminiModelName[];
  thinkingLevel: GeminiThinkingLevel;
  structuredTemperature: number;
  structuredTopP: number;
  streamTemperature: number;
  streamTopP: number;
};

export function buildGenerationStrategy(options: {
  intentLabel: string;
  responseMode: "direto" | "didatico";
  sourceTarget: SourceTargetRoute | null;
  retrievalQuality: RetrievalQualityInfo | null;
}): GenerationStrategy {
  const retrievalTier = options.retrievalQuality?.confidenceTier ?? "fraca";
  const didacticRequest = options.responseMode === "didatico";
  const sourcePinnedRequest = options.sourceTarget !== null;
  const conceptHeavyRequest =
    options.intentLabel === "conceito" ||
    options.intentLabel === "erro_sistema";
  const weakRetrieval = retrievalTier === "fraca";
  const moderateRetrieval = retrievalTier === "moderada";
  const complexRequest =
    didacticRequest ||
    sourcePinnedRequest ||
    conceptHeavyRequest ||
    moderateRetrieval ||
    weakRetrieval;
  const requiresProFirst =
    sourcePinnedRequest ||
    conceptHeavyRequest ||
    weakRetrieval;
  const allowsProFallback =
    didacticRequest ||
    sourcePinnedRequest ||
    conceptHeavyRequest ||
    moderateRetrieval ||
    weakRetrieval;
  const orderedModels = requiresProFirst
    ? [GEMINI_PRO_MODEL, GEMINI_FLASH_LITE_MODEL]
    : allowsProFallback
      ? [GEMINI_FLASH_LITE_MODEL, GEMINI_PRO_MODEL]
      : [GEMINI_FLASH_LITE_MODEL];

  return {
    orderedModels,
    thinkingLevel: complexRequest ? "high" : "low",
    structuredTemperature: didacticRequest ? 0.4 : 0.3,
    structuredTopP: options.responseMode === "didatico" ? 0.9 : 0.8,
    streamTemperature: didacticRequest ? 0.5 : 0.35,
    streamTopP: options.responseMode === "didatico" ? 0.95 : 0.8,
  };
}
