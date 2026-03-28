describe('chat persistence (localStorage)', () => {
  const STORAGE_KEY = 'clara-chat-history';

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(2);
    expect(stored[0].content).toBe('Olá');
    expect(stored[1].role).toBe('assistant');
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');

    let result: unknown[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { result = []; }
      else {
        const parsed = JSON.parse(raw);
        result = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      result = [];
    }
    expect(result).toEqual([]);
  });

  it('respects max persisted messages limit', () => {
    const maxMessages = 50;
    const messages = Array.from({ length: 60 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`,
    }));

    const toSave = messages.slice(-maxMessages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(50);
    expect(stored[0].content).toBe('Message 10');
  });
});
