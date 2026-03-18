function normalizeFlag(value: string | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

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

export function getChatConfigurationErrorMessage() {
  return 'A CLARA está sem conexão com o backend configurado. Verifique as variáveis do Supabase na Vercel antes de usar o chat em produção.';
}
