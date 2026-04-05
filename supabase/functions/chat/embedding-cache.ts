export const QUERY_EMBEDDING_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type QueryEmbeddingCacheStatus = 'hit' | 'miss' | 'store_failed';

type BuildQueryEmbeddingCacheKeyParams = {
  text: string;
  model: string;
  contractVersion: string;
  dimension: number;
};

const QUERY_EMBEDDING_CACHE_PREFIX = 'query_embedding_cache_v1';

export function normalizeQueryEmbeddingCacheText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildQueryEmbeddingCacheKey(
  params: BuildQueryEmbeddingCacheKeyParams,
): Promise<{ queryHash: string; normalizedQuery: string }> {
  const normalizedQuery = normalizeQueryEmbeddingCacheText(params.text);
  const queryHash = await sha256Hex(
    [
      QUERY_EMBEDDING_CACHE_PREFIX,
      params.model,
      params.contractVersion,
      String(params.dimension),
      normalizedQuery,
    ].join('|'),
  );

  return { queryHash, normalizedQuery };
}

export function buildQueryEmbeddingCacheExpiryIso(now = Date.now()): string {
  return new Date(now + QUERY_EMBEDDING_CACHE_TTL_MS).toISOString();
}

export function isQueryEmbeddingCacheExpired(expiresAt: string | null | undefined, now = Date.now()): boolean {
  if (!expiresAt) {
    return true;
  }

  const expiresAtMs = Date.parse(expiresAt);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= now;
}

export function parseCachedEmbedding(value: unknown, expectedDim: number): number[] | null {
  let parsed: unknown = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed) || parsed.length !== expectedDim) {
    return null;
  }

  const normalized = parsed.map((entry) => {
    if (typeof entry === 'number') return entry;
    if (typeof entry === 'string') return Number(entry);
    return Number.NaN;
  });

  return normalized.every((entry) => Number.isFinite(entry)) ? normalized : null;
}

export function formatQueryEmbeddingModelLabel(params: {
  model: string;
  contractVersion: string;
  isContextualized: boolean;
  originalCacheStatus: QueryEmbeddingCacheStatus;
  expandedCacheStatus: QueryEmbeddingCacheStatus | null;
}): string {
  const suffixes = [
    params.isContextualized ? 'followup_context_v1' : null,
    `cache_orig_${params.originalCacheStatus}`,
    params.expandedCacheStatus ? `cache_expanded_${params.expandedCacheStatus}` : null,
  ].filter((value): value is string => Boolean(value));

  return [params.model, params.contractVersion, ...suffixes].join(':');
}
