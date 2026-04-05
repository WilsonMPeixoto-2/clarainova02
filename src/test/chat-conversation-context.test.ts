import { describe, expect, it } from 'vitest';

import {
  buildContextualizedEmbeddingQuery,
  compactConversationSnippet,
  isLikelyContextualFollowUp,
} from '../../supabase/functions/chat/conversation-context';

describe('chat conversation context', () => {
  it('contextualizes anaphoric follow-ups with the previous question and CLARA summary', () => {
    const result = buildContextualizedEmbeddingQuery(
      [
        { role: 'user', content: 'Como montar um bloco de assinatura no SEI-Rio?' },
        {
          role: 'assistant',
          content: 'Resposta longa renderizada no chat.',
          contextSummary: {
            title: 'Bloco de assinatura no SEI-Rio',
            summary: 'Você pode montar o bloco dentro do processo e selecionar as unidades participantes antes de liberar a assinatura.',
          },
        },
        { role: 'user', content: 'E se for para outra unidade?' },
      ],
      'E se for para outra unidade?',
    );

    expect(result.isContextualized).toBe(true);
    expect(result.queryText).toContain('pergunta_atual: E se for para outra unidade?');
    expect(result.queryText).toContain('pergunta_anterior: Como montar um bloco de assinatura no SEI-Rio?');
    expect(result.queryText).toContain('contexto_clara: Bloco de assinatura no SEI-Rio:');
  });

  it('keeps standalone procedural questions untouched', () => {
    const result = buildContextualizedEmbeddingQuery(
      [
        {
          role: 'assistant',
          content: 'Resumo anterior.',
          contextSummary: {
            title: 'Bloco de assinatura no SEI-Rio',
            summary: 'Resumo anterior da resposta.',
          },
        },
        { role: 'user', content: 'Como incluir documento externo no SEI-Rio?' },
      ],
      'Como incluir documento externo no SEI-Rio?',
    );

    expect(result.isContextualized).toBe(false);
    expect(result.queryText).toBe('Como incluir documento externo no SEI-Rio?');
  });

  it('uses the structured summary in conversation snippets for expansion', () => {
    const snippet = compactConversationSnippet([
      { role: 'user', content: 'Como montar um bloco de assinatura?' },
      {
        role: 'assistant',
        content: 'Texto completo muito mais longo do que o resumo exibido.',
        contextSummary: {
          title: 'Bloco de assinatura',
          summary: 'Monte o bloco no processo e inclua as unidades participantes.',
        },
      },
      { role: 'user', content: 'E depois?' },
    ]);

    expect(snippet).toContain('- CLARA: Bloco de assinatura: Monte o bloco no processo');
    expect(snippet).not.toContain('Texto completo muito mais longo');
  });

  it('detects short anaphoric follow-ups but not explicit domain questions', () => {
    expect(isLikelyContextualFollowUp('E nesse caso?')).toBe(true);
    expect(isLikelyContextualFollowUp('Como encaminhar processo para outra unidade?')).toBe(false);
  });
});
