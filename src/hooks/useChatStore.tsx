import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

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

async function streamChat(
  messages: ChatMessage[],
  onDelta: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  const url = `${SUPABASE_URL}/functions/v1/chat`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Erro ao conectar. Tente novamente.');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Stream não disponível.');

  const decoder = new TextDecoder();
  let buffer = '';

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

    if (!hasBackend) {
      // Fallback mock
      try {
        const response = await getMockResponse();
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      // Create empty assistant message for streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const allMessages = [...messages, userMsg];

      await streamChat(
        allMessages,
        (token) => {
          // First token: switch from loading to streaming
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
        },
        () => {
          setIsStreaming(false);
        },
        (errorMsg) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: errorMsg };
            }
            return updated;
          });
        },
      );
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
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
