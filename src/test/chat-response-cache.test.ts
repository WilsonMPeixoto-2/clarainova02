import { describe, expect, it } from 'vitest';

import {
  buildChatResponseCacheExpiryIso,
  buildChatResponseCacheKey,
  CHAT_RESPONSE_CACHE_CONTRACT_VERSION,
  isChatResponseCacheExpired,
  normalizeChatResponseCacheText,
} from '../../supabase/functions/chat/response-cache';

describe('chat response cache helpers', () => {
  it('normalizes repeated conversation text for stable cache keys', async () => {
    const normalized = normalizeChatResponseCacheText('  COMO   incluir\tDocumento externo?  ');
    expect(normalized).toBe('como incluir documento externo?');

    const first = await buildChatResponseCacheKey(
      [{ role: 'user', content: 'Como incluir documento externo?' }],
      'direto',
    );
    const second = await buildChatResponseCacheKey(
      [{ role: 'user', content: '  COMO  incluir documento externo? ' }],
      'direto',
    );

    expect(first.normalizedQuery).toBe(second.normalizedQuery);
    expect(first.queryHash).toBe(second.queryHash);
  });

  it('changes the cache hash when response mode changes', async () => {
    const direto = await buildChatResponseCacheKey(
      [{ role: 'user', content: 'Como incluir documento externo?' }],
      'direto',
    );
    const didatico = await buildChatResponseCacheKey(
      [{ role: 'user', content: 'Como incluir documento externo?' }],
      'didatico',
    );

    expect(didatico.queryHash).not.toBe(direto.queryHash);
  });

  it('tracks expiry and exposes the active contract version', () => {
    const expiresAt = buildChatResponseCacheExpiryIso(Date.UTC(2026, 3, 19, 12, 0, 0));

    expect(CHAT_RESPONSE_CACHE_CONTRACT_VERSION).toBe('2026-04-20-r17-conceptual-observation-cleanup');
    expect(isChatResponseCacheExpired(expiresAt, Date.UTC(2026, 3, 19, 12, 0, 1))).toBe(false);
    expect(isChatResponseCacheExpired(expiresAt, Date.UTC(2026, 3, 20, 12, 0, 1))).toBe(true);
  });
});
