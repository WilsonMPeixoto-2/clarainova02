import { describe, expect, it } from 'vitest';

import {
  buildQueryEmbeddingCacheExpiryIso,
  buildQueryEmbeddingCacheKey,
  formatQueryEmbeddingModelLabel,
  isQueryEmbeddingCacheExpired,
  normalizeQueryEmbeddingCacheText,
  parseCachedEmbedding,
} from '../../supabase/functions/chat/embedding-cache';

describe('chat embedding cache helpers', () => {
  it('normalizes repeated query text for stable cache keys', async () => {
    const normalized = normalizeQueryEmbeddingCacheText('  Como   Incluir\tDocumento EXTERNO?  ');
    expect(normalized).toBe('como incluir documento externo?');

    const first = await buildQueryEmbeddingCacheKey({
      text: 'Como incluir documento externo?',
      model: 'gemini-embedding-2-preview',
      contractVersion: 'v1',
      dimension: 768,
    });
    const second = await buildQueryEmbeddingCacheKey({
      text: '  COMO  incluir documento externo? ',
      model: 'gemini-embedding-2-preview',
      contractVersion: 'v1',
      dimension: 768,
    });

    expect(first.normalizedQuery).toBe(second.normalizedQuery);
    expect(first.queryHash).toBe(second.queryHash);
  });

  it('changes the cache hash when contract or model changes', async () => {
    const baseline = await buildQueryEmbeddingCacheKey({
      text: 'como incluir documento externo',
      model: 'gemini-embedding-2-preview',
      contractVersion: 'v1',
      dimension: 768,
    });
    const changedContract = await buildQueryEmbeddingCacheKey({
      text: 'como incluir documento externo',
      model: 'gemini-embedding-2-preview',
      contractVersion: 'v2',
      dimension: 768,
    });
    const changedModel = await buildQueryEmbeddingCacheKey({
      text: 'como incluir documento externo',
      model: 'gemini-embedding-3-preview',
      contractVersion: 'v1',
      dimension: 768,
    });

    expect(changedContract.queryHash).not.toBe(baseline.queryHash);
    expect(changedModel.queryHash).not.toBe(baseline.queryHash);
  });

  it('parses cached vector payloads safely', () => {
    expect(parseCachedEmbedding('[0.1,0.2,0.3]', 3)).toEqual([0.1, 0.2, 0.3]);
    expect(parseCachedEmbedding([0.4, 0.5, 0.6], 3)).toEqual([0.4, 0.5, 0.6]);
    expect(parseCachedEmbedding('[0.1,0.2]', 3)).toBeNull();
    expect(parseCachedEmbedding('not-json', 3)).toBeNull();
  });

  it('tracks expiry and labeling metadata for cache hits', () => {
    const expiresAt = buildQueryEmbeddingCacheExpiryIso(Date.UTC(2026, 3, 5, 12, 0, 0));

    expect(isQueryEmbeddingCacheExpired(expiresAt, Date.UTC(2026, 3, 5, 12, 0, 1))).toBe(false);
    expect(isQueryEmbeddingCacheExpired(expiresAt, Date.UTC(2026, 3, 12, 12, 0, 1))).toBe(true);
    expect(
      formatQueryEmbeddingModelLabel({
        model: 'gemini-embedding-2-preview',
        contractVersion: 'v1',
        isContextualized: true,
        originalCacheStatus: 'hit',
        expandedCacheStatus: 'miss',
      }),
    ).toBe('gemini-embedding-2-preview:v1:followup_context_v1:cache_orig_hit:cache_expanded_miss');
  });
});
