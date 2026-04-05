import { describe, expect, it } from "vitest";

import {
  buildProviderUsageMetadata,
  extractProviderUsage,
  mergeProviderUsage,
} from "../../supabase/functions/chat/provider-usage";

describe("chat provider usage telemetry", () => {
  it("extracts provider usage metadata from camelCase responses", () => {
    const usage = extractProviderUsage({
      usageMetadata: {
        promptTokenCount: 4200,
        cachedContentTokenCount: 1800,
        candidatesTokenCount: 620,
        totalTokenCount: 4820,
        thoughtsTokenCount: 120,
      },
    });

    expect(usage).toEqual({
      promptTokenCount: 4200,
      cachedContentTokenCount: 1800,
      candidatesTokenCount: 620,
      totalTokenCount: 4820,
      thoughtsTokenCount: 120,
    });
  });

  it("merges partial usage updates from streamed chunks", () => {
    const merged = mergeProviderUsage(
      extractProviderUsage({
        usageMetadata: {
          promptTokenCount: 4100,
          candidatesTokenCount: 500,
        },
      }),
      extractProviderUsage({
        usageMetadata: {
          cachedContentTokenCount: 1600,
          totalTokenCount: 4600,
        },
      }),
    );

    expect(merged).toEqual({
      promptTokenCount: 4100,
      cachedContentTokenCount: 1600,
      candidatesTokenCount: 500,
      totalTokenCount: 4600,
      thoughtsTokenCount: null,
    });
  });

  it("builds chat_metrics metadata fields for cache hit decisions", () => {
    expect(
      buildProviderUsageMetadata({
        promptTokenCount: 4200,
        cachedContentTokenCount: 1400,
        candidatesTokenCount: 600,
        totalTokenCount: 4800,
        thoughtsTokenCount: null,
      }),
    ).toMatchObject({
      provider_usage_available: true,
      provider_prompt_tokens: 4200,
      provider_cached_content_tokens: 1400,
      provider_candidates_tokens: 600,
      provider_total_tokens: 4800,
      provider_thoughts_tokens: null,
      provider_cache_hit: true,
    });
  });
});
