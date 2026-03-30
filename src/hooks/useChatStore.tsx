import { createContext, startTransition, use, useCallback, useState, type ReactNode } from 'react';

import type { ClaraStructuredResponse } from '@/lib/clara-response';
import {
  getDefaultChatApiConfig,
  requestChat,
  streamChatResponse,
  type ChatApiConfig,
} from '@/lib/chat-api';
import {
  DEFAULT_CHAT_RESPONSE_MODE,
  isChatResponseMode,
  type ChatResponseMode,
} from '@/lib/chat-response-mode';
import {
  getChatRuntimeDescription,
  getChatRuntimeLabel,
  type ChatRuntimeMode,
} from '@/lib/chat-runtime';

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
  responseMode: ChatResponseMode;
  runtimeMode: ChatRuntimeMode;
  runtimeLabel: string;
  runtimeDescription: string;
  openChat: (question?: string) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
  setResponseMode: (mode: ChatResponseMode) => void;
}

const ChatContext = createContext<ChatState | null>(null);
const CHAT_API_CONFIG = getDefaultChatApiConfig();
const CHAT_STORAGE_KEY = 'clara-chat-history';
const CHAT_RESPONSE_MODE_STORAGE_KEY = 'clara-chat-response-mode';
const MAX_PERSISTED_MESSAGES = 50;

function loadPersistedMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_PERSISTED_MESSAGES);
  } catch {
    return [];
  }
}

function persistMessages(messages: ChatMessage[]) {
  try {
    const toSave = messages.slice(-MAX_PERSISTED_MESSAGES);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function loadPersistedResponseMode(): ChatResponseMode {
  try {
    const raw = localStorage.getItem(CHAT_RESPONSE_MODE_STORAGE_KEY);
    return isChatResponseMode(raw) ? raw : DEFAULT_CHAT_RESPONSE_MODE;
  } catch {
    return DEFAULT_CHAT_RESPONSE_MODE;
  }
}

function persistResponseMode(mode: ChatResponseMode) {
  try {
    localStorage.setItem(CHAT_RESPONSE_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage unavailable — silently ignore
  }
}

function getRuntimePresentation(config: ChatApiConfig) {
  return {
    runtimeLabel: getChatRuntimeLabel(config.runtimeMode),
    runtimeDescription: getChatRuntimeDescription(config.runtimeMode),
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
  const [messages, setMessagesRaw] = useState<ChatMessage[]>(loadPersistedMessages);
  const setMessages = useCallback(
    (update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessagesRaw((prev) => {
        const next = typeof update === 'function' ? update(prev) : update;
        persistMessages(next);
        return next;
      });
    },
    [],
  );
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [responseMode, setResponseModeRaw] = useState<ChatResponseMode>(loadPersistedResponseMode);
  const { runtimeLabel, runtimeDescription } = getRuntimePresentation(CHAT_API_CONFIG);

  const setResponseMode = useCallback((mode: ChatResponseMode) => {
    setResponseModeRaw(mode);
    persistResponseMode(mode);
  }, []);

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

      const result = await requestChat(allMessages, CHAT_API_CONFIG, { responseMode });

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
      const errorMsg = err instanceof Error
        ? err.message
        : 'Não consegui concluir sua mensagem agora. Tente novamente em instantes.';
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
  }, [isLoading, responseMode, setMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingQuestion(null);
    try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch { /* ignore */ }
  }, [setMessages]);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        messages,
        pendingQuestion,
        isLoading,
        isStreaming,
        responseMode,
        runtimeMode: CHAT_API_CONFIG.runtimeMode,
        runtimeLabel,
        runtimeDescription,
        openChat,
        closeChat,
        sendMessage,
        clearMessages,
        setResponseMode,
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
