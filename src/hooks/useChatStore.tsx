import { createContext, useCallback, use, useState, type ReactNode } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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

const ChatContext = createContext<ChatState | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fallback mock for when no backend is configured
function getMockResponse(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Olá! Sou a **CLARA** — Consultora de Legislação e Apoio a Rotinas Administrativas.

Posso ajudar com:
- 📋 Procedimentos no **SEI-Rio**
- 📖 Consultas a **legislação municipal**
- 🔄 Fluxos de **tramitação** e prazos
- ✅ **Checklists** documentais

Como posso ajudar você hoje?`);
    }, 800 + Math.random() * 600);
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamTextContent(
  text: string,
  onDelta: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  try {
    const tokens = text.match(/\S+\s*/g) ?? [text];

    for (const token of tokens) {
      onDelta(token);
      await wait(10);
    }

    onDone();
  } catch {
    onError('Falha ao montar a resposta local. Tente novamente.');
  }
}

async function streamChat(
  messages: ChatMessage[],
  onDelta: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
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
      body: JSON.stringify({ messages }),
    });
  } catch (networkErr) {
    onError('Falha de conexão. Verifique sua internet e tente novamente.');
    return;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMsg = body.error || `Erro ${res.status}. Tente novamente.`;
    onError(errorMsg);
    return;
  }

  const reader = res.body?.getReader();
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
          // skip malformed chunks
        }
      }
    }
  } catch (streamErr) {
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
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const hasBackend = !!SUPABASE_URL;

    try {
      // Create empty assistant message for streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const allMessages = [...messages, userMsg];
      let localResponse: string | null = null;

      try {
        const localAnswer = await answerQuestionWithLocalKnowledge(trimmed);
        localResponse = localAnswer.response;
      } catch (localError) {
        console.warn('Local knowledge base failed, falling back to remote backend.', localError);
      }

      const handleDelta = (token: string) => {
        setIsLoading(false);
        setIsStreaming(true);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + token };
          }
          return updated;
        });
      };

      const handleDone = () => {
        setIsStreaming(false);
      };

      const handleError = (errorMsg: string) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: errorMsg };
          }
          return updated;
        });
      };

      if (localResponse) {
        await streamTextContent(localResponse, handleDelta, handleDone, handleError);
        return;
      }

      if (hasBackend) {
        await streamChat(allMessages, handleDelta, handleDone, handleError);
        return;
      }

      const mockResponse = await getMockResponse();
      setIsLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: mockResponse };
        }
        return updated;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao conectar. Tente novamente.';
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = { ...last, content: errorMsg };
        } else {
          updated.push({ role: 'assistant', content: errorMsg });
        }
        return updated;
      });
    } finally {
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
