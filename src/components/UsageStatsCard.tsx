import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChatTeardropText,
  MagnifyingGlass,
  FileText,
  Pulse,
  ShieldCheck,
  WarningCircle,
  ClockCountdown,
  TrendUp,
} from "@phosphor-icons/react";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";

interface TopicInsight {
  topic: string;
  count: number;
}

interface UsageStats {
  month: string;
  chat_messages: number;
  embedding_queries: number;
  client_side_ingestions: number;
  grounded_answers: number;
  content_gap_reviews: number;
  degraded_responses: number;
  average_latency_ms: number | null;
  top_topics: TopicInsight[];
}

async function fetchUsageStats(): Promise<UsageStats> {
  const { data, error } = await supabase.functions.invoke("get-usage-stats");
  if (error) throw error;
  return data as UsageStats;
}

export default function UsageStatsCard() {
  const { data: stats, isPending: loading } = useQuery({
    queryKey: ["usage-stats"],
    queryFn: fetchUsageStats,
    enabled: hasSupabaseConfig,
  });

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

  const healthItems = stats
    ? [
        {
          label: "Respostas grounded",
          description: "Atendimentos do mês apoiados em recuperação documental.",
          value: stats.grounded_answers,
          icon: ShieldCheck,
        },
        {
          label: "Lacunas de cobertura",
          description: "Consultas que sinalizaram revisão de conteúdo no corpus.",
          value: stats.content_gap_reviews,
          icon: TrendUp,
        },
        {
          label: "Respostas degradadas",
          description: "Casos que terminaram parciais, fora de escopo ou em falha.",
          value: stats.degraded_responses,
          icon: WarningCircle,
        },
        {
          label: "Latência média",
          description: "Tempo médio de resposta registrado no backend ativo.",
          value: stats.average_latency_ms == null ? "—" : `${stats.average_latency_ms} ms`,
          icon: ClockCountdown,
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
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saúde do produto no mês</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sinais agregados de grounding, cobertura, degradação e desempenho médio do atendimento.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {healthItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border/80 bg-muted/20 p-3 text-left"
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
            </div>
            {stats.top_topics.length > 0 && (
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temas mais recorrentes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stats.top_topics.map((topic) => (
                    <span
                      key={topic.topic}
                      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-foreground"
                    >
                      <span>{topic.topic}</span>
                      <strong className="text-[hsl(var(--gold-1))]">{topic.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground">
              Use este card para leitura rápida do volume operacional e da saúde do produto. Os totais dependem da telemetria disponível no backend ativo e não substituem auditoria detalhada por evento.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
