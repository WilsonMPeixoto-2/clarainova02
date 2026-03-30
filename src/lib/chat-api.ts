import {
  buildMockStructuredResponse,
  buildPreviewStructuredResponse,
  renderStructuredResponseToPlainText,
  safeParseClaraStructuredEnvelope,
  tryParseClaraStructuredEnvelopeFromText,
  type ClaraStructuredResponse,
} from '@/lib/clara-response';
import {
  getChatRuntimeMode,
  isChatBackendConfigured,
  isChatMockEnabled,
  type ChatRuntimeMode,
} from '@/lib/chat-runtime';
import {
  DEFAULT_CHAT_RESPONSE_MODE,
  type ChatResponseMode,
} from '@/lib/chat-response-mode';

export interface ChatTransportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestOptions {
  responseMode?: ChatResponseMode;
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
  runtimeMode: ChatRuntimeMode;
  mockDelayMs?: number;
}

export function getDefaultChatApiConfig(): ChatApiConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const backendConfigured = isChatBackendConfigured({
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  });
  const mockEnabled = isChatMockEnabled({
    DEV: import.meta.env.DEV,
    VITE_ENABLE_CHAT_MOCK: import.meta.env.VITE_ENABLE_CHAT_MOCK,
  });

  return {
    supabaseUrl,
    supabasePublishableKey,
    backendConfigured,
    mockEnabled,
    runtimeMode: getChatRuntimeMode({
      DEV: import.meta.env.DEV,
      VITE_ENABLE_CHAT_MOCK: import.meta.env.VITE_ENABLE_CHAT_MOCK,
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
    }),
  };
}

export function getMockChatResult(
  question: string,
  responseMode: ChatResponseMode = DEFAULT_CHAT_RESPONSE_MODE,
  delayMs = 0,
): Promise<ChatRequestResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = buildMockStructuredResponse(question, responseMode);
      resolve({
        kind: 'structured',
        response,
        plainText: renderStructuredResponseToPlainText(response),
      });
    }, delayMs);
  });
}

export function getPreviewChatResult(
  question: string,
  responseMode: ChatResponseMode = DEFAULT_CHAT_RESPONSE_MODE,
  delayMs = 0,
): Promise<ChatRequestResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = buildPreviewStructuredResponse(question, responseMode);
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
  options: ChatRequestOptions = {},
): Promise<ChatRequestResult> {
  const responseMode = options.responseMode ?? DEFAULT_CHAT_RESPONSE_MODE;

  if (!config.backendConfigured) {
    const lastQuestion = [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';

    if (config.runtimeMode === 'mock') {
      return getMockChatResult(
        lastQuestion,
        responseMode,
        config.mockDelayMs ?? (650 + Math.random() * 450),
      );
    }

    return getPreviewChatResult(
      lastQuestion,
      responseMode,
      config.mockDelayMs ?? (780 + Math.random() * 520),
    );
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
      body: JSON.stringify({
        messages: messages.map((message) => ({ role: message.role, content: message.content })),
        responseMode,
      }),
    });
  } catch {
    throw new Error('Não consegui me conectar agora. Confira sua internet e tente novamente.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Não consegui concluir sua mensagem agora. Tente novamente em instantes.');
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

    throw new Error('Recebi a resposta em um formato que não consegui aproveitar. Tente novamente em instantes.');
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
    onError('A resposta não pôde continuar por aqui. Tente enviar novamente.');
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
    onError('A conexão caiu antes de eu terminar a resposta. Tente enviar novamente.');
    return;
  }

  onDone();
}
