import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { data, error } = await supabase
      .from("usage_logs")
      .select("event_type")
      .gte("created_at", monthStart);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Erro ao consultar logs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.event_type] = (counts[row.event_type] || 0) + 1;
    }

    return new Response(
      JSON.stringify({
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        chat_messages: counts["chat_message"] || 0,
        embedding_queries: counts["embedding_query"] || 0,
        pdf_extractions: counts["pdf_extraction"] || 0,
        embedding_generations: counts["embedding_generation"] || 0,
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
