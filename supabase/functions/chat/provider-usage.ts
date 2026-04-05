export interface ChatProviderUsage {
  promptTokenCount: number | null;
  cachedContentTokenCount: number | null;
  candidatesTokenCount: number | null;
  totalTokenCount: number | null;
  thoughtsTokenCount: number | null;
}

function readUsageField(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

export function extractProviderUsage(source: unknown): ChatProviderUsage | null {
  if (typeof source !== "object" || source === null) {
    return null;
  }

  const container = source as Record<string, unknown>;
  const usageCandidate = (
    typeof container.usageMetadata === "object" && container.usageMetadata !== null
      ? container.usageMetadata
      : typeof container.usage_metadata === "object" && container.usage_metadata !== null
        ? container.usage_metadata
        : null
  ) as Record<string, unknown> | null;

  if (!usageCandidate) {
    return null;
  }

  const usage: ChatProviderUsage = {
    promptTokenCount: readUsageField(usageCandidate, "promptTokenCount", "prompt_token_count"),
    cachedContentTokenCount: readUsageField(usageCandidate, "cachedContentTokenCount", "cached_content_token_count"),
    candidatesTokenCount: readUsageField(usageCandidate, "candidatesTokenCount", "candidates_token_count"),
    totalTokenCount: readUsageField(usageCandidate, "totalTokenCount", "total_token_count"),
    thoughtsTokenCount: readUsageField(usageCandidate, "thoughtsTokenCount", "thoughts_token_count"),
  };

  return Object.values(usage).some((value) => value != null) ? usage : null;
}

export function mergeProviderUsage(
  current: ChatProviderUsage | null,
  next: ChatProviderUsage | null,
): ChatProviderUsage | null {
  if (!current) return next;
  if (!next) return current;

  return {
    promptTokenCount: next.promptTokenCount ?? current.promptTokenCount,
    cachedContentTokenCount: next.cachedContentTokenCount ?? current.cachedContentTokenCount,
    candidatesTokenCount: next.candidatesTokenCount ?? current.candidatesTokenCount,
    totalTokenCount: next.totalTokenCount ?? current.totalTokenCount,
    thoughtsTokenCount: next.thoughtsTokenCount ?? current.thoughtsTokenCount,
  };
}

export function buildProviderUsageMetadata(usage: ChatProviderUsage | null) {
  return {
    provider_usage_available: Boolean(usage),
    provider_prompt_tokens: usage?.promptTokenCount ?? null,
    provider_cached_content_tokens: usage?.cachedContentTokenCount ?? null,
    provider_candidates_tokens: usage?.candidatesTokenCount ?? null,
    provider_total_tokens: usage?.totalTokenCount ?? null,
    provider_thoughts_tokens: usage?.thoughtsTokenCount ?? null,
    provider_cache_hit: (usage?.cachedContentTokenCount ?? 0) > 0,
  };
}
