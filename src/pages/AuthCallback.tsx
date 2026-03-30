import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, SpinnerGap, Warning } from '@phosphor-icons/react';
import { useLocation, useNavigate } from 'react-router-dom';

import { formatAdminAuthErrorMessage } from '@/lib/admin-auth';
import { hasSupabaseConfig, SUPABASE_UNAVAILABLE_MESSAGE, supabase } from '@/integrations/supabase/client';

type CallbackStatus = 'loading' | 'success' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    return next && next.startsWith('/') ? next : '/admin';
  }, [location.search]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let cancelled = false;

    const finishAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        setStatus('error');
        setErrorMessage(
          formatAdminAuthErrorMessage(
            error.message,
            'Não consegui concluir seu acesso agora. Tente novamente a partir da área administrativa.',
          ),
        );
        return;
      }

      if (data.session) {
        setStatus('success');
        window.setTimeout(() => {
          navigate(nextPath, { replace: true });
        }, 250);
        return;
      }

      window.setTimeout(async () => {
        const retry = await supabase.auth.getSession();
        if (cancelled) return;

        if (retry.data.session) {
          setStatus('success');
          navigate(nextPath, { replace: true });
          return;
        }

        setStatus('error');
        setErrorMessage('Não consegui confirmar seu acesso por aqui. Tente novamente a partir da área administrativa.');
      }, 900);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || !session) return;
      setStatus('success');
      navigate(nextPath, { replace: true });
    });

    void finishAuth();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, nextPath]);

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Warning className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="mt-4 text-lg font-semibold text-foreground">Login administrativo indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {SUPABASE_UNAVAILABLE_MESSAGE}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {status === 'loading' && (
          <>
            <SpinnerGap className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h1 className="mt-4 text-lg font-semibold text-foreground">Quase lá</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Estou confirmando seu acesso para te levar ao painel com segurança.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 text-lg font-semibold text-foreground">Acesso confirmado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecionando você para a área administrativa.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <Warning className="mx-auto h-8 w-8 text-destructive" />
            <h1 className="mt-4 text-lg font-semibold text-foreground">Não consegui concluir seu acesso</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {errorMessage ?? 'Tente novamente a partir da área administrativa.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
