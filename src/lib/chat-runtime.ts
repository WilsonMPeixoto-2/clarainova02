function normalizeFlag(value: string | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export type ChatRuntimeMode = 'online' | 'mock' | 'preview';

export function isChatBackendConfigured(env: {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}) {
  return Boolean(env.VITE_SUPABASE_URL?.trim() && env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
}

export function isChatMockEnabled(env: {
  DEV?: boolean;
  VITE_ENABLE_CHAT_MOCK?: string;
}) {
  if (!env.DEV) {
    return false;
  }

  const flag = normalizeFlag(env.VITE_ENABLE_CHAT_MOCK);
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export function getChatRuntimeMode(env: {
  DEV?: boolean;
  VITE_ENABLE_CHAT_MOCK?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}): ChatRuntimeMode {
  if (
    isChatBackendConfigured({
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    })
  ) {
    return 'online';
  }

  if (
    isChatMockEnabled({
      DEV: env.DEV,
      VITE_ENABLE_CHAT_MOCK: env.VITE_ENABLE_CHAT_MOCK,
    })
  ) {
    return 'mock';
  }

  return 'preview';
}

export function getChatConfigurationErrorMessage() {
  return 'A CLARA ainda não está conectada ao ambiente de atendimento deste projeto. Revise a configuração antes de publicar o chat em produção.';
}

export function getChatRuntimeLabel(mode: ChatRuntimeMode) {
  if (mode === 'online') return 'Atendimento conectado';
  if (mode === 'mock') return 'Ambiente de demonstração';
  return 'Demonstração guiada';
}

export function getChatRuntimeDescription(mode: ChatRuntimeMode) {
  if (mode === 'online') {
    return 'A CLARA está consultando as orientações disponíveis para responder sua pergunta com mais segurança.';
  }

  if (mode === 'mock') {
    return 'Você está em um ambiente de demonstração da CLARA, usado para revisar a experiência do atendimento.';
  }

  return 'O chat já pode ser experimentado nesta fase. As respostas ainda são demonstrativas enquanto a base oficial é finalizada.';
}
