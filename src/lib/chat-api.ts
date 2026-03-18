import {
  buildMockStructuredResponse,
  renderStructuredResponseToPlainText,
  safeParseClaraStructuredEnvelope,
  tryParseClaraStructuredEnvelopeFromText,
  type ClaraStructuredResponse,
} from '@/lib/clara-response';
import {
  getChatConfigurationErrorMessage,
  isChatBackendConfigured,
  isChatMockEnabled,
} from '@/lib/chat-runtime';

export interface ChatTransportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatRequestResult =
  | {
      kind: 'structured';
      response: ClaraStructuredResponse;
      plainText: string;
    }
  | {
      kind: 'stream';
      response: Response;
    }
  | {
      kind: 'text';
      text: string;
    };

export interface ChatApiConfig {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  backendConfigured: boolean;
  mockEnabled: boolean;
  mockDelayMs?: number;
}

export function getDefaultChatApiConfig(): ChatApiConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return {
    supabaseUrl,
    supabasePublishableKey,
    backendConfigured: isChatBackendConfigured({
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
    }),
    mockEnabled: isChatMockEnabled({
      DEV: import.meta.env.DEV,
      VITE_ENABLE_CHAT_MOCK: import.meta.env.VITE_ENABLE_CHAT_MOCK,
    }),
  };
}

export function getMockChatResult(question: string, delayMs = 0): Promise<ChatRequestResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = buildMockStructuredResponse(question);
      resolve({
        kind: 'structured',
        response,
        plainText: renderStructuredResponseToPlainText(response),
      });
    }, delayMs);
  });
}

export async function requestChat(
  messages: ChatTransportMessage[],
  config: ChatApiConfig,
): Promise<ChatRequestResult> {
  if (!config.backendConfigured) {
    if (config.mockEnabled) {
      const lastQuestion = [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
      return getMockChatResult(lastQuestion, config.mockDelayMs ?? (650 + Math.random() * 450));
    }

    throw new Error(getChatConfigurationErrorMessage());
  }

  const url = `${config.supabaseUrl}/functions/v1/chat`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabasePublishableKey}`,
        'apikey': config.supabasePublishableKey ?? '',
      },
      body: JSON.stringify({ messages: messages.map((message) => ({ role: message.role, content: message.content })) }),
    });
  } catch {
    throw new Error('Falha de conexão. Verifique sua internet e tente novamente.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}. Tente novamente.`);
  }

  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await res.json().catch(() => null);
    const structured = safeParseClaraStructuredEnvelope(body);

    if (structured) {
      return {
        kind: 'structured',
        response: structured.response,
        plainText: structured.plainText ?? renderStructuredResponseToPlainText(structured.response),
      };
    }

    if (typeof body?.answer === 'string') {
      const embedded = tryParseClaraStructuredEnvelopeFromText(body.answer);
      if (embedded) {
        return {
          kind: 'structured',
          response: embedded.response,
          plainText: embedded.plainText ?? renderStructuredResponseToPlainText(embedded.response),
        };
      }

      return { kind: 'text', text: body.answer };
    }

    if (typeof body?.response === 'string') {
      const embedded = tryParseClaraStructuredEnvelopeFromText(body.response);
      if (embedded) {
        return {
          kind: 'structured',
          response: embedded.response,
          plainText: embedded.plainText ?? renderStructuredResponseToPlainText(embedded.response),
        };
      }

      return { kind: 'text', text: body.response };
    }

    throw new Error('A CLARA respondeu em um formato inesperado.');
  }

  if (contentType.includes('text/event-stream')) {
    return { kind: 'stream', response: res };
  }

  const text = await res.text();
  const structured = tryParseClaraStructuredEnvelopeFromText(text);
  if (structured) {
    return {
      kind: 'structured',
      response: structured.response,
      plainText: structured.plainText ?? renderStructuredResponseToPlainText(structured.response),
    };
  }

  return { kind: 'text', text };
}

export async function streamChatResponse(
  response: Response,
  onDelta: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) {
    onError('Stream não disponível.');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) onDelta(token);
        } catch {
          // ignore malformed SSE chunks
        }
      }
    }
  } catch {
    onError('Conexão interrompida durante a resposta. Tente novamente.');
    return;
  }

  onDone();
}
