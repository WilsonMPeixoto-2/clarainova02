import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChatTeardropText, MagnifyingGlass, FileText, Pulse } from "@phosphor-icons/react";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";

interface UsageStats {
  month: string;
  chat_messages: number;
  embedding_queries: number;
  client_side_ingestions: number;
}

export default function UsageStatsCard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-usage-stats");
        if (!error && data) {
          setStats(data as UsageStats);
        }
      } catch (e) {
        console.error("Failed to fetch usage stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const items = stats
    ? [
        {
          label: "Mensagens do chat",
          description: "Atendimentos registrados no mês corrente.",
          value: stats.chat_messages,
          icon: ChatTeardropText,
        },
        {
          label: "Buscas documentais",
          description: "Consultas de recuperação feitas no corpus ativo.",
          value: stats.embedding_queries,
          icon: MagnifyingGlass,
        },
        {
          label: "PDFs ingeridos",
          description: "Envios administrativos concluídos neste mês.",
          value: stats.client_side_ingestions,
          icon: FileText,
        },
      ]
    : [];

  const monthLabel = stats
    ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${stats.month}-01T00:00:00Z`),
      )
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pulse className="h-5 w-5" />
          Metricas agregadas do painel
        </CardTitle>
        <CardDescription>
          Leitura mensal do backend ativo, com sinais agregados do produto e sem identificação individual de usuários.
        </CardDescription>
        {stats && (
          <CardDescription className="capitalize">{monthLabel}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSupabaseConfig ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            As métricas voltam a aparecer assim que o Supabase ativo estiver conectado ao painel.
          </p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando métricas agregadas...</p>
        ) : !stats ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Não consegui carregar as métricas agora. O restante do painel continua utilizável.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border p-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    </div>
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground">
              Use este card para leitura rápida do volume operacional. Os totais dependem da telemetria disponível no backend ativo e não substituem auditoria detalhada por evento.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
