import { useMemo, useState, useEffect } from "react";
import { hasSupabaseConfig, SUPABASE_UNAVAILABLE_MESSAGE, supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Fingerprint, LockKey, CircleNotch, Eye, EyeSlash, Lightning } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  formatAdminAuthErrorMessage,
  getAdminAuthCallbackUrl,
  getPasskeyPreparationMessage,
  isPasskeySupported,
} from "@/lib/admin-auth";

interface Props {
  children: React.ReactNode;
}

export default function AdminAuth({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => hasSupabaseConfig);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passkeySupported = useMemo(() => isPasskeySupported(), []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lightning className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <CardTitle className="text-xl">Painel administrativo em configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              {SUPABASE_UNAVAILABLE_MESSAGE}
            </p>
            <p className="text-xs text-muted-foreground/80">
              Enquanto isso, a experiência do painel segue em revisão para que o acesso volte com mais estabilidade e clareza.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Não consegui concluir o login", {
        description: formatAdminAuthErrorMessage(
          error.message,
          "Revise seus dados e tente novamente.",
        ),
      });
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAdminAuthCallbackUrl("/admin"),
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });

    if (error) {
      toast.error("Não consegui abrir o login com Google", {
        description: formatAdminAuthErrorMessage(
          error.message,
          "Tente novamente em instantes.",
        ),
      });
      setGoogleSubmitting(false);
    }
  };

  const handlePasskeyInfo = () => {
    toast(passkeySupported ? "Passkey em breve" : "Passkey indisponível neste navegador", {
      description: getPasskeyPreparationMessage(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Confirmando seu acesso</p>
            <p className="text-xs text-muted-foreground">Estou verificando a sessão administrativa para te levar ao painel.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <LockKey className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="text-xl">Área Administrativa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button type="button" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={googleSubmitting || submitting}>
                {googleSubmitting ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Continuar com Google
              </Button>

              <Button type="button" variant="outline" className="w-full gap-2" onClick={handlePasskeyInfo}>
                <Fingerprint className="h-4 w-4" />
                {passkeySupported ? "Passkey em breve" : "Passkey indisponível aqui"}
              </Button>

              <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">Outra forma de acesso</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se o acesso principal ainda não estiver disponível para sua conta, você pode entrar com email e senha já provisionados.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                <div>
                  <label htmlFor="admin-email" className="sr-only">Email</label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="relative">
                  <label htmlFor="admin-password" className="sr-only">Senha</label>
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={submitting || googleSubmitting}>
                  {submitting ? <CircleNotch className="h-4 w-4 animate-spin" /> : "Entrar com credenciais"}
                </Button>
              </form>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Acesso restrito a contas administrativas já provisionadas.
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground/80">
              Quando o Google estiver habilitado neste ambiente, ele aparecerá como rota preferencial. Enquanto isso, use uma conta administrativa já provisionada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
