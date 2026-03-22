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
  return 'A CLARA está sem conexão com o backend configurado. Verifique as variáveis do Supabase na Vercel antes de usar o chat em produção.';
}

export function getChatRuntimeLabel(mode: ChatRuntimeMode) {
  if (mode === 'online') return 'Base interna conectada';
  if (mode === 'mock') return 'Mock local em desenvolvimento';
  return 'Modo de preparação';
}

export function getChatRuntimeDescription(mode: ChatRuntimeMode) {
  if (mode === 'online') {
    return 'A camada conversacional está consultando a base configurada do projeto.';
  }

  if (mode === 'mock') {
    return 'As respostas estão vindo de um mock local de desenvolvimento para testes rápidos.';
  }

  return 'A interface conversacional está ativa, mas a nova integração Supabase ainda será religada na próxima etapa.';
}
