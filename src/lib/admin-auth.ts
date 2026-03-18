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
  return 'A base de passkeys já está preparada na interface, mas a ativação completa ainda depende do backend WebAuthn e da configuração final do seu Supabase próprio.';
}
