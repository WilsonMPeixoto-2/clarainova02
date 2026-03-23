import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIM = 768;

function getErrorMessage(error: unknown, fallback = "Erro interno"): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const statusCandidate = "status" in error
    ? error.status
    : "httpStatusCode" in error
      ? error.httpStatusCode
      : undefined;
  return typeof statusCandidate === "number" ? statusCandidate : undefined;
}

interface ParsedChunkMetadata {
  pageStart: number | null;
  pageEnd: number | null;
  sourceTag: string | null;
}

function parseChunkMetadata(content: string): ParsedChunkMetadata {
  const sourceMatch = content.match(/^\[Fonte:\s*([^\]|]+?)(?:\s*\|\s*P[aá]gina:\s*([0-9]+)(?:\s*-\s*([0-9]+))?)?\]/i);
  const firstPage = sourceMatch?.[2] ? Number.parseInt(sourceMatch[2], 10) : Number.NaN;
  const lastPage = sourceMatch?.[3] ? Number.parseInt(sourceMatch[3], 10) : firstPage;

  return {
    sourceTag: sourceMatch?.[1]?.trim() ?? null,
    pageStart: Number.isFinite(firstPage) ? firstPage : null,
    pageEnd: Number.isFinite(lastPage) ? lastPage : Number.isFinite(firstPage) ? firstPage : null,
  };
}

async function safeLogEvent(
  supabase: ReturnType<typeof createClient>,
  payload: {
    document_id?: string | null;
    ingestion_job_id?: string | null;
    event_type: string;
    event_level?: string;
    message: string;
    details_json?: Record<string, unknown>;
  }
) {
  try {
    await supabase
      .from("document_processing_events")
      .insert({
        document_id: payload.document_id ?? null,
        ingestion_job_id: payload.ingestion_job_id ?? null,
        event_type: payload.event_type,
        event_level: payload.event_level ?? "info",
        message: payload.message,
        details_json: payload.details_json ?? {},
      });
  } catch {
    // non-critical, don't block main flow
  }
}

/**
 * Edge function: receives pre-extracted text chunks,
 * generates embeddings via @google/genai SDK, and upserts to DB.
 * Idempotent via UNIQUE(document_id, chunk_index).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const request_id = crypto.randomUUID();

  try {
    const { document_id, chunks, start_index = 0, ingestion_job_id = null } = await req.json();

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

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const supabase = createClient(supabaseUrl, supabaseKey);

    await safeLogEvent(supabase, {
      document_id,
      ingestion_job_id,
      event_type: "embedding_request_received",
      message: "Lote recebido pela edge function de embeddings.",
      details_json: { start_index, requested_chunks: chunks.length, valid_chunks: validChunks.length },
    });

    // Generate embeddings
    const embeddingStart = Date.now();
    const embeddingPromises = validChunks.map(async (text: string) => {
      try {
        const result = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: text,
          config: { outputDimensionality: EMBEDDING_DIM },
        });
        return result.embeddings?.[0]?.values || null;
      } catch (err: unknown) {
        console.error(`Embedding error:`, getErrorMessage(err));
        const status = getErrorStatus(err);
        if (status === 429 || (status && status >= 500)) {
          throw new Error(`GEMINI_${status}`, { cause: err });
        }
        return null;
      }
    });

    const embeddings = await Promise.all(embeddingPromises);
    const embedding_ms = Date.now() - embeddingStart;

    // Build rows using ONLY columns that exist in document_chunks
    const rows = validChunks.map((content: string, i: number) => {
      const { pageStart, pageEnd } = parseChunkMetadata(content);
      return {
        document_id,
        content,
        embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : null,
        chunk_index: start_index + i,
        page_start: pageStart,
        page_end: pageEnd,
      };
    });

    const dbStart = Date.now();
    const { error: upsertErr } = await supabase
      .from("document_chunks")
      .upsert(rows, { onConflict: "document_id,chunk_index" });
    const db_ms = Date.now() - dbStart;

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      await safeLogEvent(supabase, {
        document_id,
        ingestion_job_id,
        event_type: "embedding_batch_failed",
        event_level: "error",
        message: "Falha ao persistir o lote de embeddings no banco.",
        details_json: { start_index, batch_size: validChunks.length, request_id, details: upsertErr.message },
      });
      return new Response(
        JSON.stringify({ ok: false, error: "DB_UPSERT_FAILED", details: upsertErr.message, request_id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await safeLogEvent(supabase, {
      document_id,
      ingestion_job_id,
      event_type: "embedding_batch_saved",
      message: "Lote de embeddings persistido com sucesso.",
      details_json: {
        start_index,
        batch_size: rows.length,
        failed_embeddings: embeddings.filter((e) => e === null).length,
        request_id,
        embedding_ms,
        db_ms,
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        saved: rows.length,
        failed_embeddings: embeddings.filter((e) => e === null).length,
        request_id,
        embedding_ms,
        db_ms,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("embed-chunks error:", error);
    const msg = getErrorMessage(error);
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
