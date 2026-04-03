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
  topic_label: string | null;
  needs_content_gap_review: boolean | null;
};

async function selectRecentRows<T>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  columns: string,
  monthStart: string,
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .gte("created_at", monthStart);

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
        "topic_label,needs_content_gap_review",
        monthStart,
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

    const groundedAnswers = chatHealthRows.filter((row) => row.used_rag).length;
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
