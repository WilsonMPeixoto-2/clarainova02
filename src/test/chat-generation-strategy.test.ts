import { describe, expect, it } from "vitest";

import {
  buildGenerationStrategy,
  GEMINI_FLASH_LITE_MODEL,
  GEMINI_PRO_MODEL,
} from "../../supabase/functions/chat/generation-strategy";

describe("chat generation strategy", () => {
  it("prioritizes flash-lite for simple direct requests", () => {
    const strategy = buildGenerationStrategy({
      intentLabel: "como_fazer",
      responseMode: "direto",
      sourceTarget: null,
      retrievalQuality: {
        chunkCount: 3,
        uniqueDocuments: 2,
        avgOverlap: 4,
        confidenceTier: "alta",
        topScore: 0.94,
        sourceCount: 2,
      },
    });

    expect(strategy.orderedModels).toEqual([
      GEMINI_FLASH_LITE_MODEL,
    ]);
    expect(strategy.thinkingLevel).toBe("low");
    expect(strategy.structuredTemperature).toBe(0.3);
    expect(strategy.streamTemperature).toBe(0.35);
  });

  it("prioritizes pro for didactic or weak-complex requests", () => {
    const strategy = buildGenerationStrategy({
      intentLabel: "conceito",
      responseMode: "didatico",
      sourceTarget: {
        label: "nota oficial",
        matches: () => true,
        versionConstraint: null,
        topicScopes: ["pen_release_note"],
        sourceNamePatterns: ["%MGI%"],
      },
      retrievalQuality: {
        chunkCount: 2,
        uniqueDocuments: 1,
        avgOverlap: 1,
        confidenceTier: "fraca",
        topScore: 0.32,
        sourceCount: 1,
      },
    });

    expect(strategy.orderedModels).toEqual([
      GEMINI_PRO_MODEL,
      GEMINI_FLASH_LITE_MODEL,
    ]);
    expect(strategy.thinkingLevel).toBe("high");
    expect(strategy.structuredTemperature).toBe(0.4);
    expect(strategy.streamTemperature).toBe(0.5);
  });
});
