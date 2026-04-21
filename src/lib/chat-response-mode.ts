export const CHAT_RESPONSE_MODES = ['direto', 'didatico'] as const;

export type ChatResponseMode = (typeof CHAT_RESPONSE_MODES)[number];

export const DEFAULT_CHAT_RESPONSE_MODE: ChatResponseMode = 'didatico';

export function isChatResponseMode(value: unknown): value is ChatResponseMode {
  return typeof value === 'string' && CHAT_RESPONSE_MODES.includes(value as ChatResponseMode);
}

export function getChatResponseModePresentation(mode: ChatResponseMode) {
  if (mode === 'direto') {
    return {
      label: 'Direto',
      shortLabel: 'Modo direto',
      description: 'Entrega uma resposta rápida, com a rota principal, os alertas indispensáveis e só o contexto que muda sua próxima ação.',
      selectionHint: 'Rápido, objetivo e operacional.',
      loadingHint: 'Vou priorizar a rota principal, com foco no essencial para você agir agora e conferir só o que evita erro.',
      placeholder: 'Pergunte para receber uma orientação rápida e objetiva...',
    };
  }

  return {
    label: 'Didático',
    shortLabel: 'Modo didático',
    description: 'Transforma a resposta em um guia mais explicado, com contexto, porquês, checkpoints e fechamento para você aprender e executar com segurança.',
    selectionHint: 'Mais contexto, didática e conferência.',
    loadingHint: 'Vou organizar a orientação como um guia explicado, com contexto, checkpoints e conferências para você avançar com segurança.',
    placeholder: 'Pergunte para receber uma orientação mais guiada e explicativa...',
  };
}
