import { createContext, startTransition, use, useCallback, useState, type ReactNode } from 'react';

import type { ClaraStructuredResponse } from '@/lib/clara-response';
import {
  getDefaultChatApiConfig,
  requestChat,
  streamChatResponse,
  type ChatApiConfig,
} from '@/lib/chat-api';
import type { ChatRuntimeMode } from '@/lib/chat-runtime';

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
  runtimeMode: ChatRuntimeMode;
  runtimeLabel: string;
  runtimeDescription: string;
  openChat: (question?: string) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatState | null>(null);
const CHAT_API_CONFIG = getDefaultChatApiConfig();

function getRuntimePresentation(config: ChatApiConfig) {
  if (config.runtimeMode === 'online') {
    return {
      runtimeLabel: 'Base interna conectada',
      runtimeDescription: 'A CLARA está consultando a base configurada do projeto.',
    };
  }

  if (config.runtimeMode === 'mock') {
    return {
      runtimeLabel: 'Mock local em desenvolvimento',
      runtimeDescription: 'As respostas estão vindo de um mock local para testes de interface.',
    };
  }

  return {
    runtimeLabel: 'Modo de preparação',
    runtimeDescription: 'A interface conversacional está ativa enquanto a nova integração Supabase é preparada.',
  };
}

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

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { runtimeLabel, runtimeDescription } = getRuntimePresentation(CHAT_API_CONFIG);

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
    let allMessages: ChatMessage[] = [];
    setMessages((prev) => {
      allMessages = [...prev, userMsg];
      return [...allMessages, { role: 'assistant' as const, content: '', structuredResponse: null }];
    });
    setIsLoading(true);
    setIsStreaming(false);
    try {
      const handleStructuredResult = (response: ClaraStructuredResponse, plainText: string) => {
        startTransition(() => {
          setMessages((prev) =>
            replaceLastAssistantMessage(prev, {
              role: 'assistant',
              content: plainText,
              structuredResponse: response,
            }),
          );
        });
      };

      const handlePlainTextResult = (textContent: string) => {
        startTransition(() => {
          setMessages((prev) =>
            replaceLastAssistantMessage(prev, {
              role: 'assistant',
              content: textContent,
              structuredResponse: null,
            }),
          );
        });
      };

      const handleDelta = (token: string) => {
        setIsLoading(false);
        setIsStreaming(true);
        startTransition(() => {
          setMessages((prev) => appendAssistantToken(prev, token));
        });
      };

      const handleDone = () => {
        setIsStreaming(false);
      };

      const handleError = (errorMsg: string) => {
        setIsStreaming(false);
        startTransition(() => {
          setMessages((prev) =>
            replaceLastAssistantMessage(prev, {
              role: 'assistant',
              content: errorMsg,
              structuredResponse: null,
            }),
          );
        });
      };

      const result = await requestChat(allMessages, CHAT_API_CONFIG);

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
      startTransition(() => {
        setMessages((prev) =>
          replaceLastAssistantMessage(prev, {
            role: 'assistant',
            content: errorMsg,
            structuredResponse: null,
          }),
        );
      });
    } finally {
      await wait(0);
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingQuestion(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        messages,
        pendingQuestion,
        isLoading,
        isStreaming,
        runtimeMode: CHAT_API_CONFIG.runtimeMode,
        runtimeLabel,
        runtimeDescription,
        openChat,
        closeChat,
        sendMessage,
        clearMessages,
      }}
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
