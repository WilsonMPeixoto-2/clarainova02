import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitChatFeedback } from '@/lib/chat-feedback-api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('chat feedback api', () => {
  it('posts normalized feedback to the public feedback function', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await submitChatFeedback(
      {
        requestId: 'req-456',
        feedbackValue: 'not_helpful',
        feedbackReason: 'missing_detail',
        feedbackComment: '  faltou   explicar o passo final  ',
      },
      {
        backendConfigured: true,
        mockEnabled: false,
        runtimeMode: 'online',
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'anon-key',
      },
    );

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall?.[0]).toBe('https://example.supabase.co/functions/v1/submit-chat-feedback');
    expect(fetchCall?.[1]).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer anon-key',
        apikey: 'anon-key',
      },
    });

    expect(JSON.parse(String(fetchCall?.[1]?.body))).toEqual({
      requestId: 'req-456',
      feedbackValue: 'not_helpful',
      feedbackReason: 'missing_detail',
      feedbackComment: 'faltou explicar o passo final',
    });
  });

  it('throws a friendly error when feedback cannot be sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Falha no endpoint' }), {
          headers: { 'content-type': 'application/json' },
          status: 500,
        }),
      ),
    );

    await expect(
      submitChatFeedback(
        {
          requestId: 'req-500',
          feedbackValue: 'helpful',
        },
        {
          backendConfigured: true,
          mockEnabled: false,
          runtimeMode: 'online',
          supabaseUrl: 'https://example.supabase.co',
          supabasePublishableKey: 'anon-key',
        },
      ),
    ).rejects.toThrow('Falha no endpoint');
  });
});
