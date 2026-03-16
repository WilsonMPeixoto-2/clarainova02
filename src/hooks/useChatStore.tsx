import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import {
  buildMockStructuredResponse,
  renderStructuredResponseToPlainText,
  safeParseClaraStructuredEnvelope,
  tryParseClaraStructuredEnvelopeFromText,
  type ClaraStructuredResponse,
} from '@/lib/clara-response';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  structuredResponse?: ClaraStructuredResponse | null;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  pendingQuestion: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  openChat: (question?: string) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

type ChatRequestResult =
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

const ChatContext = createContext<ChatState | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replaceLastAssistantMessage(
  messages: ChatMessage[],
  nextAssistant: ChatMessage,
) {
  const updated = [...messages];
  const last = updated[updated.length - 1];
  if (last?.role === 'assistant') {
    updated[updated.length - 1] = nextAssistant;
    return updated;
  }

  updated.push(nextAssistant);
  return updated;
}

function appendAssistantToken(messages: ChatMessage[], token: string) {
  const updated = [...messages];
  const last = updated[updated.length - 1];
  if (last?.role === 'assistant') {
    updated[updated.length - 1] = {
      ...last,
      structuredResponse: null,
      content: last.content + token,
    };
    return updated;
  }

  updated.push({ role: 'assistant', content: token, structuredResponse: null });
  return updated;
}

function getMockResult(question: string): Promise<ChatRequestResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = buildMockStructuredResponse(question);
      resolve({
        kind: 'structured',
        response,
        plainText: renderStructuredResponseToPlainText(response),
      });
    }, 650 + Math.random() * 450);
  });
}

async function requestChat(messages: ChatMessage[]): Promise<ChatRequestResult> {
  const url = `${SUPABASE_URL}/functions/v1/chat`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
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

async function streamChatResponse(
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

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const openChat = useCallback((question?: string) => {
    setIsOpen(true);
    if (question) {
      setPendingQuestion(question);
    }
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setPendingQuestion(null);
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', structuredResponse: null }]);
    setIsLoading(true);
    setIsStreaming(false);

    const allMessages = [...messages, userMsg];
    const hasBackend = !!SUPABASE_URL;

    try {
      const handleStructuredResult = (response: ClaraStructuredResponse, plainText: string) => {
        setMessages((prev) =>
          replaceLastAssistantMessage(prev, {
            role: 'assistant',
            content: plainText,
            structuredResponse: response,
          }),
        );
      };

      const handlePlainTextResult = (textContent: string) => {
        setMessages((prev) =>
          replaceLastAssistantMessage(prev, {
            role: 'assistant',
            content: textContent,
            structuredResponse: null,
          }),
        );
      };

      const handleDelta = (token: string) => {
        setIsLoading(false);
        setIsStreaming(true);
        setMessages((prev) => appendAssistantToken(prev, token));
      };

      const handleDone = () => {
        setIsStreaming(false);
      };

      const handleError = (errorMsg: string) => {
        setIsStreaming(false);
        setMessages((prev) =>
          replaceLastAssistantMessage(prev, {
            role: 'assistant',
            content: errorMsg,
            structuredResponse: null,
          }),
        );
      };

      const result = hasBackend ? await requestChat(allMessages) : await getMockResult(trimmed);

      if (result.kind === 'structured') {
        setIsLoading(false);
        handleStructuredResult(result.response, result.plainText);
        return;
      }

      if (result.kind === 'text') {
        setIsLoading(false);
        handlePlainTextResult(result.text);
        return;
      }

      await streamChatResponse(result.response, handleDelta, handleDone, handleError);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao conectar. Tente novamente.';
      setMessages((prev) =>
        replaceLastAssistantMessage(prev, {
          role: 'assistant',
          content: errorMsg,
          structuredResponse: null,
        }),
      );
    } finally {
      await wait(0);
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [isLoading, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingQuestion(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{ isOpen, messages, pendingQuestion, isLoading, isStreaming, openChat, closeChat, sendMessage, clearMessages }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = use(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
