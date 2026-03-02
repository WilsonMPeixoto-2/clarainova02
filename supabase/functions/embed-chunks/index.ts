import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Lightweight edge function: receives pre-extracted text chunks,
 * generates embeddings via gemini-embedding-001, and saves to DB.
 * 
 * Each call processes a small batch (≤10 chunks) so it completes in <5s.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, chunks, start_index = 0 } = await req.json();

    if (!document_id || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: "document_id and chunks[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (chunks.length > 10) {
      return new Response(
        JSON.stringify({ error: "Max 10 chunks per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate embeddings for all chunks in parallel
    const embeddingPromises = chunks.map((text: string) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text }] },
            outputDimensionality: 768,
          }),
        }
      ).then(async (r) => {
        if (!r.ok) {
          const errText = await r.text();
          console.error(`Embedding error (${r.status}):`, errText);
          return null;
        }
        const data = await r.json();
        return data.embedding?.values || null;
      })
    );

    const embeddings = await Promise.all(embeddingPromises);

    // Build rows to insert
    const rows = chunks.map((content: string, i: number) => ({
      document_id,
      content,
      embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : JSON.stringify(new Array(768).fill(0)),
      chunk_index: start_index + i,
    }));

    const { error: insertErr } = await supabase.from("document_chunks").insert(rows);
    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to save chunks", details: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        saved: rows.length,
        failed_embeddings: embeddings.filter(e => e === null).length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("embed-chunks error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
