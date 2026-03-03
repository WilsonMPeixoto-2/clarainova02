import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Lightweight edge function: receives pre-extracted text chunks,
 * generates embeddings via gemini-embedding-001, and upserts to DB.
 * Idempotent via UNIQUE(document_id, chunk_index).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const request_id = crypto.randomUUID();

  try {
    const { document_id, chunks, start_index = 0 } = await req.json();

    if (!document_id || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "VALIDATION:MISSING_PARAMS", request_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (chunks.length > 10) {
      return new Response(
        JSON.stringify({ ok: false, error: "VALIDATION:MAX_10_CHUNKS", request_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out empty/trivial chunks before processing
    const validChunks = chunks.filter((c: string) => c && c.trim().length >= 3);

    if (validChunks.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "VALIDATION:EMPTY_CHUNKS", saved: 0, request_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate embeddings for all valid chunks in parallel
    const embeddingStart = Date.now();
    const embeddingPromises = validChunks.map((text: string) =>
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
          // Propagate rate-limit / server errors so caller can retry
          if (r.status === 429 || r.status >= 500) {
            throw new Error(`GEMINI_${r.status}`);
          }
          return null;
        }
        const data = await r.json();
        return data.embedding?.values || null;
      })
    );

    const embeddings = await Promise.all(embeddingPromises);
    const embedding_ms = Date.now() - embeddingStart;

    // Build rows to upsert
    const rows = validChunks.map((content: string, i: number) => ({
      document_id,
      content,
      embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : JSON.stringify(new Array(768).fill(0)),
      chunk_index: start_index + i,
    }));

    const dbStart = Date.now();
    const { error: upsertErr } = await supabase
      .from("document_chunks")
      .upsert(rows, { onConflict: "document_id,chunk_index" });
    const db_ms = Date.now() - dbStart;

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return new Response(
        JSON.stringify({ ok: false, error: "DB_UPSERT_FAILED", details: upsertErr.message, request_id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        saved: rows.length,
        failed_embeddings: embeddings.filter(e => e === null).length,
        request_id,
        embedding_ms,
        db_ms,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("embed-chunks error:", error);
    // If it's a Gemini rate-limit or server error, return 429/503 so client retries
    const msg = String(error?.message || error);
    if (msg.includes("GEMINI_429")) {
      return new Response(
        JSON.stringify({ ok: false, error: "RATE_LIMITED", request_id }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (msg.includes("GEMINI_5")) {
      return new Response(
        JSON.stringify({ ok: false, error: "UPSTREAM_ERROR", request_id }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ ok: false, error: "INTERNAL_ERROR", details: msg, request_id }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
