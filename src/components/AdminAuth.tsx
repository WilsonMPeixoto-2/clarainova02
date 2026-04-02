import { useMemo, useState, useEffect } from "react";
import { hasSupabaseConfig, SUPABASE_UNAVAILABLE_MESSAGE, supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Fingerprint, LockKey, CircleNotch, Eye, EyeSlash, Lightning } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  formatAdminAuthErrorMessage,
  getAdminAuthorizationCheckFailedMessage,
  getAdminAuthorizationDeniedMessage,
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
  const [adminAccess, setAdminAccess] = useState<"checking" | "signed_out" | "allowed" | "forbidden" | "error">("checking");
  const [adminAccessMessage, setAdminAccessMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passkeySupported = useMemo(() => isPasskeySupported(), []);
  const googleOAuthOperational = false;

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let active = true;

    async function syncAdminSession(nextSession: Session | null) {
      if (!active) return;

      setSession(nextSession);
      setAdminAccessMessage(null);

      if (!nextSession) {
        setAdminAccess("signed_out");
        setLoading(false);
        return;
      }

      setLoading(true);
      setAdminAccess("checking");

      const { data, error } = await supabase.rpc("is_admin_user");

      if (!active) return;

      if (error) {
        console.error("Admin authorization check failed:", error);
        setAdminAccess("error");
        setAdminAccessMessage(getAdminAuthorizationCheckFailedMessage());
        setLoading(false);
        return;
      }

      if (!data) {
        setAdminAccess("forbidden");
        setAdminAccessMessage(getAdminAuthorizationDeniedMessage(nextSession.user.email));
        setLoading(false);
        return;
      }

      setAdminAccess("allowed");
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAdminSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncAdminSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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

  if (loading || adminAccess === "checking") {
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
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-2 text-center">
            <LockKey className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="text-xl">Área Administrativa</CardTitle>
            <CardDescription>
              Use uma conta administrativa já provisionada. Google e passkeys seguem visíveis apenas como rotas em habilitação neste ambiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/80 bg-background p-3 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Disponível agora</p>
                <p className="mt-1 text-sm font-medium text-foreground">Email e senha provisionados</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fluxo operacional comprovado no ambiente real e pronto para contas administrativas já habilitadas.
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Em habilitação</p>
                <p className="mt-1 text-sm font-medium text-foreground">Google OAuth e passkey</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Essas rotas seguem mapeadas na interface, mas ainda não devem ser tratadas como acesso ativo neste ambiente.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-background p-4">
              <div className="mb-4 space-y-1">
                <p className="text-sm font-medium text-foreground">Entrar com conta provisionada</p>
                <p className="text-xs text-muted-foreground">
                  Use este fluxo quando sua conta já estiver autorizada no Supabase Auth.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                <div>
                  <label htmlFor="admin-email" className="sr-only">Email</label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="email@exemplo.rio"
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
                  {submitting ? <CircleNotch className="h-4 w-4 animate-spin" /> : "Entrar com conta provisionada"}
                </Button>
              </form>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Rotas em habilitação neste ambiente</p>
                <p className="text-xs text-muted-foreground">
                  Elas seguem visíveis para orientar o desenho futuro do acesso, mas não são o caminho principal de uso agora.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleGoogleSignIn}
                disabled={!googleOAuthOperational || googleSubmitting || submitting}
              >
                {googleSubmitting ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                {googleOAuthOperational ? "Continuar com Google" : "Google OAuth em habilitação"}
              </Button>

              <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={handlePasskeyInfo}>
                <Fingerprint className="h-4 w-4" />
                {passkeySupported ? "Passkey em preparação" : "Passkey indisponível neste navegador"}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Acesso restrito a contas administrativas já provisionadas para a operação do painel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminAccess === "forbidden" || adminAccess === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-2 text-center">
            <LockKey className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="text-xl">
              {adminAccess === "forbidden" ? "Conta sem autorizacao administrativa" : "Nao consegui validar seu acesso"}
            </CardTitle>
            <CardDescription>
              {adminAccessMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
              O painel exige autenticacao e autorizacao administrativa versionada no banco. Entrar com uma conta valida, por si so, nao libera o uso desta area.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="w-full"
                onClick={() => { void supabase.auth.signOut(); }}
              >
                Sair desta conta
              </Button>
              {adminAccess === "error" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
