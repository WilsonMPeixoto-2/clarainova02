import { useMemo, useState, useEffect } from "react";
import { hasSupabaseConfig, SUPABASE_UNAVAILABLE_MESSAGE, supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, Fingerprint, Lock, Loader2, Eye, EyeOff, DatabaseZap } from "lucide-react";
import { toast } from "sonner";
import {
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
            <DatabaseZap className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <CardTitle className="text-xl">Painel em preparação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              {SUPABASE_UNAVAILABLE_MESSAGE}
            </p>
            <p className="text-xs text-muted-foreground/80">
              Nesta fase, o foco segue em interface, experiência e organização operacional antes da reconexão definitiva do backend.
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
      toast.error("Erro no login", { description: error.message });
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
      toast.error("Erro no login com Google", { description: error.message });
      setGoogleSubmitting(false);
    }
  };

  const handlePasskeyInfo = () => {
    toast(passkeySupported ? "Passkeys em preparação" : "Passkeys ainda indisponíveis neste navegador", {
      description: getPasskeyPreparationMessage(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="text-xl">Área Administrativa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button type="button" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={googleSubmitting || submitting}>
                {googleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
                Continuar com Google
              </Button>

              <Button type="button" variant="outline" className="w-full gap-2" onClick={handlePasskeyInfo}>
                <Fingerprint className="h-4 w-4" />
                {passkeySupported ? "Passkey em preparação" : "Passkey indisponível aqui"}
              </Button>

              <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">Fallback provisório</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enquanto o Supabase próprio não estiver totalmente configurado com Google e WebAuthn, o login por email e senha continua disponível.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
                <div className="relative">
                  <Input
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
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={submitting || googleSubmitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar com credenciais"}
                </Button>
              </form>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Acesso restrito a contas administrativas já provisionadas.
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground/80">
              O fluxo preferencial agora é Google; passkeys já aparecem como próxima etapa de evolução do painel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
