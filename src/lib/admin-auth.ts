export function getAdminAuthCallbackUrl(next = '/admin') {
  if (typeof window === 'undefined') {
    return next;
  }

  const target = encodeURIComponent(next);
  return `${window.location.origin}/auth/callback?next=${target}`;
}

export function isPasskeySupported() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.PublicKeyCredential && navigator.credentials);
}

export function getPasskeyPreparationMessage() {
  return 'O acesso por passkey já está previsto na experiência do painel. Assim que a configuração principal for concluída, essa opção poderá ser ativada.';
}

export function formatAdminAuthErrorMessage(
  rawMessage: string | null | undefined,
  fallback: string,
) {
  const message = rawMessage?.trim();
  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email ou senha não conferem. Revise os dados e tente novamente.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Sua conta ainda precisa ser confirmada antes do acesso.';
  }

  if (
    normalized.includes('provider is not enabled') ||
    normalized.includes('unsupported provider')
  ) {
    return 'O acesso com Google ainda não está disponível neste ambiente.';
  }

  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('failed to fetch')
  ) {
    return 'Não consegui falar com o serviço de acesso agora. Tente novamente em instantes.';
  }

  return message;
}
