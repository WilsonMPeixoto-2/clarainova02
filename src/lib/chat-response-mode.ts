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
      description: 'Vai direto ao caminho principal, destacando a ação imediata e só o contexto indispensável.',
      selectionHint: 'Rota principal, decisão rápida e menos leitura.',
      loadingHint: 'Vou priorizar um caminho mais objetivo, com foco no que precisa ser feito agora.',
      placeholder: 'Pergunte para receber uma orientação mais objetiva...',
    };
  }

  return {
    label: 'Didático',
    shortLabel: 'Modo didático',
    description: 'Organiza a orientação em etapas, com contexto, conferências e alertas quando houver ambiguidade.',
    selectionHint: 'Passo a passo com mais contexto e checkpoints.',
    loadingHint: 'Vou organizar a orientação em etapas, com contexto e conferências para você avançar com segurança.',
    placeholder: 'Pergunte para receber um passo a passo guiado...',
  };
}
