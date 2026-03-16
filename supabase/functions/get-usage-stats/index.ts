import { createClient } from "npm:@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function countRecentRows(
  supabase: ReturnType<typeof createClient>,
  table: string,
  monthStart: string,
  applyFilters?: (query: any) => any,
): Promise<number | null> {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart);

  if (applyFilters) {
    query = applyFilters(query);
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [chatMessages, embeddingQueries, clientSideIngestions] = await Promise.all([
      countRecentRows(supabase, "chat_metrics", monthStart),
      countRecentRows(supabase, "search_metrics", monthStart),
      countRecentRows(
        supabase,
        "ingestion_jobs",
        monthStart,
        (query) => query.eq("status", "completed").eq("trigger_source", "admin_panel"),
      ),
    ]);

    const usingFallback =
      chatMessages === null || embeddingQueries === null || clientSideIngestions === null;

    const fallbackCounts: Record<string, number> = {};

    if (usingFallback) {
      const { data, error } = await supabase
        .from("usage_logs")
        .select("event_type")
        .gte("created_at", monthStart);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Erro ao consultar métricas" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const row of data || []) {
        fallbackCounts[row.event_type] = (fallbackCounts[row.event_type] || 0) + 1;
      }
    }

    if (usingFallback && Object.keys(fallbackCounts).length === 0) {
      return new Response(
        JSON.stringify({ error: "Erro ao consultar métricas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        chat_messages: chatMessages ?? fallbackCounts["chat_message"] ?? 0,
        embedding_queries: embeddingQueries ?? fallbackCounts["embedding_query"] ?? 0,
        client_side_ingestions: clientSideIngestions ?? fallbackCounts["client_side_ingestion"] ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-usage-stats error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
