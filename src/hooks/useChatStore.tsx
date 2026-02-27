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
  openChat: (question?: string) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatState | null>(null);

const MOCK_RESPONSES: Record<string, string> = {
  default: `Olá! Sou a **CLARA** — Consultora de Legislação e Apoio a Rotinas Administrativas.

Posso ajudar com:
- 📋 Procedimentos no **SEI-Rio**
- 📖 Consultas a **legislação municipal**
- 🔄 Fluxos de **tramitação** e prazos
- ✅ **Checklists** documentais

Como posso ajudar você hoje?`,
};

function getMockResponse(_message: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_RESPONSES.default);
    }, 800 + Math.random() * 600);
  });
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      // --- ETAPA 2: substituir por chamada real à Edge Function ---
      const response = await getMockResponse(trimmed);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingQuestion(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{ isOpen, messages, pendingQuestion, isLoading, openChat, closeChat, sendMessage, clearMessages }}
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
