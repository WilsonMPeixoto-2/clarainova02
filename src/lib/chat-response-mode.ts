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
      description: 'Entrega a rota principal com 2 ou 3 passos práticos, mantendo só o contexto que muda sua próxima ação.',
      selectionHint: 'Síntese operacional, decisão rápida e conferências mínimas.',
      loadingHint: 'Vou priorizar a rota principal, com foco no que precisa ser feito agora e nas conferências indispensáveis.',
      placeholder: 'Pergunte para receber uma orientação mais objetiva...',
    };
  }

  return {
    label: 'Didático',
    shortLabel: 'Modo didático',
    description: 'Transforma a resposta em um guia operacional, com contexto, checkpoints e o que conferir em cada etapa.',
    selectionHint: 'Guia passo a passo, leitura orientada e mais contexto.',
    loadingHint: 'Vou organizar a orientação como um guia passo a passo, com contexto e conferências para você avançar com segurança.',
    placeholder: 'Pergunte para receber um passo a passo guiado...',
  };
}
