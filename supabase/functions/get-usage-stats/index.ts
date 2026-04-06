import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://clarainova02.vercel.app",
  "https://clara.sme.rio",
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.startsWith("http://localhost:")) return origin;
  return ALLOWED_ORIGINS[0];
}

function buildCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

async function requireAuthenticatedUser(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
) {
  const accessToken = getBearerToken(req);
  if (!accessToken) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) {
    console.warn("get-usage-stats auth rejected:", error?.message ?? "no user");
    return null;
  }

  return data.user;
}

async function requireAdminUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("get-usage-stats admin lookup failed:", error.message);
    return false;
  }

  return Boolean(data?.user_id);
}

type CountQueryLike = {
  eq: (column: string, value: string) => CountQueryLike;
};

type ChatHealthRow = {
  used_rag: boolean | null;
  response_status: string | null;
  latency_ms: number | null;
};

type QueryAnalyticsRow = {
  chat_metric_id: string | null;
  created_at: string;
  gap_reason: string | null;
  needs_content_gap_review: boolean | null;
  query_text: string | null;
  request_id: string | null;
  topic_label: string | null;
  user_feedback_comment: string | null;
  user_feedback_reason: string | null;
  user_feedback_value: string | null;
};

type RecentChatMetricRow = {
  created_at: string;
  id: string;
  metadata_json: Record<string, unknown> | null;
  query_text: string | null;
  request_id: string | null;
  response_status: string | null;
};

type ContentGapTopicInsight = {
  count: number;
  feedback_count: number;
  low_quality_count: number;
  no_coverage_count: number;
  topic: string;
};

type ContentGapCaseInsight = {
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
};

async function selectRecentRows<T>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  columns: string,
  monthStart: string,
  options: { limit?: number; orderByCreatedAtDesc?: boolean } = {},
): Promise<T[]> {
  let query = supabase
    .from(table)
    .select(columns)
    .gte("created_at", monthStart);

  if (options.orderByCreatedAtDesc) {
    query = query.order("created_at", { ascending: false });
  }

  if (typeof options.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.warn(`Failed to read rows for ${table}:`, error.message);
    return [];
  }

  return (data as T[] | null) ?? [];
}

async function countRecentRows(
  supabase: ReturnType<typeof createClient>,
  table: string,
  monthStart: string,
  applyFilters?: (query: CountQueryLike) => CountQueryLike,
): Promise<number | null> {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart);

  if (applyFilters) {
    query = applyFilters(query as unknown as CountQueryLike) as typeof query;
  }

  const { count, error } = await query;

  if (error) {
    console.warn(`Failed to count rows for ${table}:`, error.message);
    return null;
  }

  return count ?? 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readMetadataNumber(metadata: Record<string, unknown> | null, key: string): number | null {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readMetadataString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function resolveGapSignalLabel(input: {
  needsContentGapReview: boolean;
  ragQualityScore: number | null;
  userFeedbackValue: string | null;
}) {
  if (input.userFeedbackValue === "not_helpful") {
    return "feedback_negativo";
  }

  if (input.needsContentGapReview) {
    return "sem_cobertura";
  }

  if (input.ragQualityScore !== null && input.ragQualityScore < 0.5) {
    return "baixa_confianca";
  }

  return "monitorar";
}

function normalizeGapReason(
  reason: string | null,
  needsContentGapReview: boolean,
  ragQualityScore: number | null,
): string | null {
  if (reason && reason.trim().length > 0) {
    return reason.trim();
  }

  if (needsContentGapReview) {
    return "sem_cobertura_documental";
  }

  if (ragQualityScore !== null && ragQualityScore < 0.5) {
    return "baixa_confianca_rag";
  }

  return null;
}

function buildContentGapInsights(
  queryAnalyticsRows: QueryAnalyticsRow[],
  recentChatMetricRows: RecentChatMetricRow[],
): {
  recentContentGaps: ContentGapCaseInsight[];
  contentGapTopics: ContentGapTopicInsight[];
} {
  const chatMetricsById = new Map<string, RecentChatMetricRow>();
  const chatMetricsByRequestId = new Map<string, RecentChatMetricRow>();

  for (const row of recentChatMetricRows) {
    chatMetricsById.set(row.id, row);
    if (row.request_id) {
      chatMetricsByRequestId.set(row.request_id, row);
    }
  }

  const recentContentGaps: ContentGapCaseInsight[] = [];
  const seenRequestKeys = new Set<string>();

  for (const row of queryAnalyticsRows) {
    const chatMetric = row.chat_metric_id
      ? chatMetricsById.get(row.chat_metric_id)
      : row.request_id
        ? chatMetricsByRequestId.get(row.request_id)
        : undefined;
    const metadata = asRecord(chatMetric?.metadata_json);
    const ragQualityScore = readMetadataNumber(metadata, "rag_quality_score");
    const needsContentGapReview = Boolean(row.needs_content_gap_review);
    const userFeedbackValue = row.user_feedback_value?.trim() || null;
    const isLowQuality = ragQualityScore !== null && ragQualityScore < 0.5;

    if (!(needsContentGapReview || userFeedbackValue === "not_helpful" || isLowQuality)) {
      continue;
    }

    const requestKey = row.request_id ?? chatMetric?.request_id ?? `analytics:${row.created_at}:${row.query_text ?? "sem_query"}`;
    seenRequestKeys.add(requestKey);

    recentContentGaps.push({
      created_at: row.created_at,
      expanded_query: readMetadataString(metadata, "expanded_query"),
      gap_reason: normalizeGapReason(row.gap_reason, needsContentGapReview, ragQualityScore),
      query_text: row.query_text?.trim() || chatMetric?.query_text?.trim() || "Pergunta sem texto preservado",
      rag_quality_score: ragQualityScore,
      request_id: row.request_id ?? chatMetric?.request_id ?? null,
      response_status: chatMetric?.response_status ?? null,
      retrieval_mode: readMetadataString(metadata, "retrieval_mode"),
      signal_label: resolveGapSignalLabel({
        needsContentGapReview,
        ragQualityScore,
        userFeedbackValue,
      }),
      topic_label: row.topic_label?.trim() || null,
      user_feedback_comment: row.user_feedback_comment?.trim() || null,
      user_feedback_reason: row.user_feedback_reason?.trim() || null,
      user_feedback_value: userFeedbackValue,
    });
  }

  for (const row of recentChatMetricRows) {
    const metadata = asRecord(row.metadata_json);
    const ragQualityScore = readMetadataNumber(metadata, "rag_quality_score");
    if (ragQualityScore === null || ragQualityScore >= 0.5) {
      continue;
    }

    const requestKey = row.request_id ?? `metric:${row.id}`;
    if (seenRequestKeys.has(requestKey)) {
      continue;
    }

    seenRequestKeys.add(requestKey);
    recentContentGaps.push({
      created_at: row.created_at,
      expanded_query: readMetadataString(metadata, "expanded_query"),
      gap_reason: "baixa_confianca_rag",
      query_text: row.query_text?.trim() || "Pergunta sem texto preservado",
      rag_quality_score: ragQualityScore,
      request_id: row.request_id,
      response_status: row.response_status,
      retrieval_mode: readMetadataString(metadata, "retrieval_mode"),
      signal_label: "baixa_confianca",
      topic_label: null,
      user_feedback_comment: null,
      user_feedback_reason: null,
      user_feedback_value: null,
    });
  }

  recentContentGaps.sort((left, right) => (
    new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  ));

  const groupedTopics = new Map<string, ContentGapTopicInsight>();
  for (const row of recentContentGaps) {
    const topic = row.topic_label?.trim() || "sem_topico_classificado";
    const entry = groupedTopics.get(topic) ?? {
      topic,
      count: 0,
      feedback_count: 0,
      low_quality_count: 0,
      no_coverage_count: 0,
    };

    entry.count += 1;
    if (row.user_feedback_value === "not_helpful") {
      entry.feedback_count += 1;
    }
    if (row.signal_label === "sem_cobertura") {
      entry.no_coverage_count += 1;
    }
    if (row.rag_quality_score !== null && row.rag_quality_score < 0.5) {
      entry.low_quality_count += 1;
    }

    groupedTopics.set(topic, entry);
  }

  const contentGapTopics = [...groupedTopics.values()]
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
    .slice(0, 6);

  return {
    recentContentGaps: recentContentGaps.slice(0, 8),
    contentGapTopics,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Credenciais Supabase não configuradas" }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const authenticatedUser = await requireAuthenticatedUser(req, supabaseUrl, supabaseAnonKey);
    if (!authenticatedUser) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const isAdminUser = await requireAdminUser(supabase, authenticatedUser.id);
    if (!isAdminUser) {
      return new Response(
        JSON.stringify({ error: "Acesso administrativo requerido" }),
        { status: 403, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      chatMessages,
      embeddingQueries,
      processedDocuments,
      chatHealthRows,
      queryAnalyticsRows,
      recentChatMetricRows,
    ] = await Promise.all([
      countRecentRows(supabase, "chat_metrics", monthStart),
      countRecentRows(supabase, "search_metrics", monthStart),
      countRecentRows(
        supabase,
        "documents",
        monthStart,
        (query) => query.eq("status", "processed"),
      ),
      selectRecentRows<ChatHealthRow>(
        supabase,
        "chat_metrics",
        "used_rag,response_status,latency_ms",
        monthStart,
      ),
      selectRecentRows<QueryAnalyticsRow>(
        supabase,
        "query_analytics",
        "chat_metric_id,created_at,gap_reason,needs_content_gap_review,query_text,request_id,topic_label,user_feedback_comment,user_feedback_reason,user_feedback_value",
        monthStart,
        { orderByCreatedAtDesc: true, limit: 200 },
      ),
      selectRecentRows<RecentChatMetricRow>(
        supabase,
        "chat_metrics",
        "created_at,id,metadata_json,query_text,request_id,response_status",
        monthStart,
        { orderByCreatedAtDesc: true, limit: 200 },
      ),
    ]);

    const usingFallback =
      chatMessages === null || embeddingQueries === null || processedDocuments === null;

    const fallbackCounts: Record<string, number> = {};

    if (usingFallback) {
      const { data, error } = await supabase
        .from("usage_logs")
        .select("event_type")
        .gte("created_at", monthStart);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Erro ao consultar métricas" }),
          { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      for (const row of data || []) {
        fallbackCounts[row.event_type] = (fallbackCounts[row.event_type] || 0) + 1;
      }
    }

    if (usingFallback && Object.keys(fallbackCounts).length === 0) {
      return new Response(
        JSON.stringify({ error: "Erro ao consultar métricas" }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const groundedAnswers = chatHealthRows.filter((row) =>
      row.used_rag && row.response_status === "answered"
    ).length;
    const degradedResponses = chatHealthRows.filter((row) =>
      ["failed", "out_of_scope", "partial"].includes(row.response_status ?? "")
    ).length;
    const latencySamples = chatHealthRows
      .map((row) => row.latency_ms)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const averageLatencyMs = latencySamples.length
      ? Math.round(latencySamples.reduce((sum, value) => sum + value, 0) / latencySamples.length)
      : null;
    const contentGapReviews = queryAnalyticsRows.filter((row) => row.needs_content_gap_review).length;

    const topicCounts = new Map<string, number>();
    for (const row of queryAnalyticsRows) {
      const topic = (row.topic_label ?? "").trim();
      if (!topic) continue;
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }

    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, count }));

    const { recentContentGaps, contentGapTopics } = buildContentGapInsights(
      queryAnalyticsRows,
      recentChatMetricRows,
    );

    return new Response(
        JSON.stringify({
          month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          chat_messages: chatMessages ?? fallbackCounts["chat_message"] ?? 0,
          embedding_queries: embeddingQueries ?? fallbackCounts["embedding_query"] ?? 0,
          client_side_ingestions: processedDocuments ?? fallbackCounts["client_side_ingestion"] ?? 0,
          grounded_answers: groundedAnswers,
          content_gap_reviews: contentGapReviews,
          degraded_responses: degradedResponses,
          average_latency_ms: averageLatencyMs,
          top_topics: topTopics,
          content_gap_topics: contentGapTopics,
          recent_content_gaps: recentContentGaps,
        }),
      { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-usage-stats error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
