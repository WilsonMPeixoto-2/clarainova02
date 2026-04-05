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

interface ContentGapTopicInsight {
  count: number;
  feedback_count: number;
  low_quality_count: number;
  no_coverage_count: number;
  topic: string;
}

interface ContentGapCaseInsight {
  created_at: string;
  expanded_query: string | null;
  gap_reason: string | null;
  query_text: string;
  rag_quality_score: number | null;
  request_id: string | null;
  response_status: string | null;
  retrieval_mode: string | null;
  signal_label: string;
  topic_label: string | null;
  user_feedback_comment: string | null;
  user_feedback_reason: string | null;
  user_feedback_value: string | null;
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
  content_gap_topics: ContentGapTopicInsight[];
  recent_content_gaps: ContentGapCaseInsight[];
}

async function fetchUsageStats(): Promise<UsageStats> {
  const { data, error } = await supabase.functions.invoke("get-usage-stats");
  if (error) throw error;
  return data as UsageStats;
}

const GAP_REASON_LABELS: Record<string, string> = {
  baixa_confianca_rag: "Baixa confiança do RAG",
  falha_modelo: "Falha do modelo",
  sem_cobertura_documental: "Sem cobertura documental",
};

const FEEDBACK_REASON_LABELS: Record<string, string> = {
  incorrect_info: "Informação errada",
  missing_detail: "Faltou detalhe",
  off_target: "Não era sobre isso",
};

const SIGNAL_LABELS: Record<string, string> = {
  baixa_confianca: "Baixa confiança",
  feedback_negativo: "Feedback negativo",
  monitorar: "Monitorar",
  sem_cobertura: "Sem cobertura",
};

function formatGapReason(reason: string | null) {
  if (!reason) return "Sem motivo classificado";
  return GAP_REASON_LABELS[reason] ?? reason.replaceAll("_", " ");
}

function formatFeedbackReason(reason: string | null) {
  if (!reason) return null;
  return FEEDBACK_REASON_LABELS[reason] ?? reason.replaceAll("_", " ");
}

function formatSignalLabel(signal: string) {
  return SIGNAL_LABELS[signal] ?? signal.replaceAll("_", " ");
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

  const formatGapTimestamp = (value: string) => new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

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
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Perguntas sem cobertura
                </p>
                <p className="text-xs text-muted-foreground">
                  Casos recentes que pedem curadoria do corpus por lacuna documental, baixa confiança do RAG ou feedback negativo.
                </p>
              </div>
              {stats.content_gap_topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {stats.content_gap_topics.map((topic) => (
                    <span
                      key={topic.topic}
                      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-foreground"
                    >
                      <span>{topic.topic === "sem_topico_classificado" ? "Sem tópico classificado" : topic.topic}</span>
                      <strong className="text-[hsl(var(--gold-1))]">{topic.count}</strong>
                    </span>
                  ))}
                </div>
              )}
              {stats.recent_content_gaps.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {stats.recent_content_gaps.map((gap) => (
                    <div
                      key={gap.request_id ?? `${gap.created_at}-${gap.query_text}`}
                      className="rounded-lg border border-border/80 bg-background/70 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {gap.topic_label ?? "Sem tópico classificado"} • {formatGapTimestamp(gap.created_at)}
                          </p>
                          <p className="text-sm font-medium text-foreground">{gap.query_text}</p>
                        </div>
                        <span className="rounded-full border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground">
                          {formatSignalLabel(gap.signal_label)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border/80 bg-muted/20 px-2.5 py-1">
                          {formatGapReason(gap.gap_reason)}
                        </span>
                        {gap.rag_quality_score !== null && (
                          <span className="rounded-full border border-border/80 bg-muted/20 px-2.5 py-1">
                            Score RAG {gap.rag_quality_score.toFixed(2)}
                          </span>
                        )}
                        {gap.user_feedback_value === "not_helpful" && (
                          <span className="rounded-full border border-border/80 bg-muted/20 px-2.5 py-1">
                            Feedback: não útil
                          </span>
                        )}
                        {gap.user_feedback_reason && (
                          <span className="rounded-full border border-border/80 bg-muted/20 px-2.5 py-1">
                            {formatFeedbackReason(gap.user_feedback_reason)}
                          </span>
                        )}
                      </div>
                      {gap.expanded_query && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Expansão aplicada: <span className="text-foreground">{gap.expanded_query}</span>
                        </p>
                      )}
                      {gap.user_feedback_comment && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Observação do usuário: <span className="text-foreground">{gap.user_feedback_comment}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Nenhum caso recente foi sinalizado para revisão editorial neste mês.
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground">
              Use este card para leitura rápida do volume operacional e da saúde do produto. Os totais dependem da telemetria disponível no backend ativo e não substituem auditoria detalhada por evento.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
