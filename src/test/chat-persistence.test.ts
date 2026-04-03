import { createElement } from 'react';
import { render, screen } from '@testing-library/react';

import { ChatProvider, useChat } from '@/hooks/useChatStore';

describe('chat persistence (localStorage)', () => {
  const STORAGE_KEY = 'clara-chat-history';
  const RESPONSE_MODE_KEY = 'clara-chat-response-mode';
  const STORAGE_VERSION = 1;

  function ChatPersistenceProbe() {
    const { messages, responseMode } = useChat();

    return createElement(
      'div',
      null,
      createElement('span', { 'data-testid': 'message-count' }, messages.length),
      createElement('span', { 'data-testid': 'response-mode' }, responseMode),
      createElement('span', { 'data-testid': 'first-message' }, messages[0]?.content ?? ''),
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty history when localStorage is empty', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persists messages to localStorage', () => {
    const messages = [
      { role: 'user' as const, content: 'Olá' },
      { role: 'assistant' as const, content: 'Olá! Como posso ajudar?', structuredResponse: null },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, messages }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.version).toBe(STORAGE_VERSION);
    expect(stored.messages).toHaveLength(2);
    expect(stored.messages[0].content).toBe('Olá');
    expect(stored.messages[1].role).toBe('assistant');
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');

    function loadSafe(): unknown[] {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    expect(loadSafe()).toEqual([]);
  });

  it('persists the selected response mode separately from the message history', () => {
    localStorage.setItem(RESPONSE_MODE_KEY, 'direto');

    expect(localStorage.getItem(RESPONSE_MODE_KEY)).toBe('direto');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('respects max persisted messages limit', () => {
    const maxMessages = 50;
    const messages = Array.from({ length: 60 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`,
    }));

    const toSave = messages.slice(-maxMessages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, messages: toSave }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.messages).toHaveLength(50);
    expect(stored.messages[0].content).toBe('Message 10');
  });

  it('accepts legacy array payloads during migration', () => {
    const legacyMessages = [
      { role: 'user' as const, content: 'Mensagem antiga' },
      { role: 'assistant' as const, content: 'Resposta antiga', structuredResponse: null },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyMessages));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(Array.isArray(stored)).toBe(true);
    expect(stored[0].content).toBe('Mensagem antiga');
  });

  it('hydrates legacy array payloads through the provider', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { role: 'user', content: 'Pergunta legado' },
        { role: 'assistant', content: 'Resposta legado', structuredResponse: null },
      ]),
    );
    localStorage.setItem(RESPONSE_MODE_KEY, 'didatico');

    render(createElement(ChatProvider, null, createElement(ChatPersistenceProbe)));

    expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    expect(screen.getByTestId('response-mode')).toHaveTextContent('didatico');
    expect(screen.getByTestId('first-message')).toHaveTextContent('Pergunta legado');
  });

  it('hydrates versioned payloads through the provider', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        messages: [
          { role: 'user', content: 'Pergunta versionada' },
          { role: 'assistant', content: 'Resposta versionada', structuredResponse: null },
        ],
      }),
    );
    localStorage.setItem(RESPONSE_MODE_KEY, 'direto');

    render(createElement(ChatProvider, null, createElement(ChatPersistenceProbe)));

    expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    expect(screen.getByTestId('response-mode')).toHaveTextContent('direto');
    expect(screen.getByTestId('first-message')).toHaveTextContent('Pergunta versionada');
  });
});
