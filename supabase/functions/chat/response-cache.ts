import { type ClaraStructuredResponse } from './response-schema.ts';

export const CHAT_RESPONSE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type ChatResponseCacheStatus = 'hit' | 'miss' | 'store_failed';

const CHAT_RESPONSE_CACHE_PREFIX = 'chat_response_cache_v1';

export function normalizeChatResponseCacheText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export async function buildChatResponseCacheKey(
  messages: { role: string; content: string }[],
  responseMode: string,
): Promise<{ queryHash: string; normalizedQuery: string }> {
  const historyString = messages.map(m => `${m.role}:${m.content}`).join('|||');
  const normalizedQuery = normalizeChatResponseCacheText(historyString);
  
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode([CHAT_RESPONSE_CACHE_PREFIX, responseMode, normalizedQuery].join('|')),
  );
  
  const queryHash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return { queryHash, normalizedQuery };
}

export function buildChatResponseCacheExpiryIso(now = Date.now()): string {
  return new Date(now + CHAT_RESPONSE_CACHE_TTL_MS).toISOString();
}

export function isChatResponseCacheExpired(expiresAt: string | null | undefined, now = Date.now()): boolean {
  if (!expiresAt) {
    return true;
  }

  const expiresAtMs = Date.parse(expiresAt);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= now;
}
