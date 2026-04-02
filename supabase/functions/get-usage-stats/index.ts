import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdminUser } from "../_shared/admin-access.ts";

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

type CountQueryLike = {
  eq: (column: string, value: string) => CountQueryLike;
};

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

    const adminAccess = await requireAdminUser(req, supabaseUrl, supabaseAnonKey, supabaseKey);
    if (!adminAccess.ok) {
      return new Response(
        JSON.stringify({ error: adminAccess.message, code: adminAccess.code }),
        { status: adminAccess.status, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [chatMessages, embeddingQueries, processedDocuments] = await Promise.all([
      countRecentRows(supabase, "chat_metrics", monthStart),
      countRecentRows(supabase, "search_metrics", monthStart),
      countRecentRows(
        supabase,
        "documents",
        monthStart,
        (query) => query.eq("status", "processed"),
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

    return new Response(
        JSON.stringify({
          month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          chat_messages: chatMessages ?? fallbackCounts["chat_message"] ?? 0,
          embedding_queries: embeddingQueries ?? fallbackCounts["embedding_query"] ?? 0,
          client_side_ingestions: processedDocuments ?? fallbackCounts["client_side_ingestion"] ?? 0,
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
