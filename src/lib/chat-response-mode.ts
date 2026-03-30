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
      description: 'Resposta mais objetiva, com foco no caminho principal e no que precisa ser feito agora.',
      loadingHint: 'Vou priorizar uma orientação mais curta e operacional.',
      placeholder: 'Pergunte para receber uma orientação mais objetiva...',
    };
  }

  return {
    label: 'Didático',
    shortLabel: 'Modo didático',
    description: 'Resposta guiada em etapas, com contexto e conferências para executar com mais segurança.',
    loadingHint: 'Vou organizar a resposta em etapas, com mais contexto e conferências.',
    placeholder: 'Pergunte para receber um passo a passo guiado...',
  };
}
