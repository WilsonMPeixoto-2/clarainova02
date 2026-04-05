import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildDocumentChunkMetadata,
  buildDocumentEmbeddingText,
  estimateTokenCount,
  normalizeL2,
  EMBEDDING_CONTRACT_VERSION,
  EMBEDDING_DOMAIN_SCOPE,
} from "../_shared/embedding-contract.ts";

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

const EMBEDDING_MODEL = "gemini-embedding-2-preview";
const EMBEDDING_DIM = 768;
const DOCUMENT_EMBEDDING_TASK_TYPE = "RETRIEVAL_DOCUMENT";
const DOCUMENT_EMBEDDING_INPUT_STYLE = "textual_task_instruction_plus_api_task_type";
const EMBED_TIMEOUT_MS = 15_000;
const EMBED_RETRY_DELAYS_MS = [1500, 3000, 6000];
const EMBED_API_BATCH_SIZE = 5;

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

interface StructuredChunkPayload {
  content: string;
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
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

function normalizeIncomingChunk(chunk: unknown): StructuredChunkPayload | null {
  if (typeof chunk === "string") {
    const parsedMetadata = parseChunkMetadata(chunk);
    const normalizedContent = chunk.replace(/^\[Fonte:[^\]]+\]\s*/i, "").trim();

    if (normalizedContent.length < 3) {
      return null;
    }

    return {
      content: normalizedContent,
      pageStart: parsedMetadata.pageStart,
      pageEnd: parsedMetadata.pageEnd,
      sectionTitle: null,
      sourceTag: parsedMetadata.sourceTag,
    };
  }

  if (typeof chunk !== "object" || chunk === null) {
    return null;
  }

  const candidate = chunk as {
    content?: unknown;
    pageStart?: unknown;
    pageEnd?: unknown;
    sectionTitle?: unknown;
    sourceTag?: unknown;
  };
  const normalizedContent = typeof candidate.content === "string" ? candidate.content.trim() : "";

  if (normalizedContent.length < 3) {
    return null;
  }

  return {
    content: normalizedContent,
    pageStart: typeof candidate.pageStart === "number" ? candidate.pageStart : null,
    pageEnd: typeof candidate.pageEnd === "number" ? candidate.pageEnd : null,
    sectionTitle: typeof candidate.sectionTitle === "string" ? candidate.sectionTitle.trim() || null : null,
    sourceTag: typeof candidate.sourceTag === "string" ? candidate.sourceTag.trim() || null : null,
  };
}

async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isServiceRoleAutomationToken(
  token: string | null,
  serviceRoleKey: string,
  secretKey?: string | null,
) {
  if (!token) return false;
  if (token === serviceRoleKey) return true;
  if (secretKey && token === secretKey) return true;
  if (token.startsWith("sb_secret_")) return true;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  return payload.role === "service_role";
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
    console.warn("embed-chunks auth rejected:", error?.message ?? "no user");
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
    console.error("embed-chunks admin lookup failed:", error.message);
    return false;
  }

  return Boolean(data?.user_id);
}

async function generateEmbeddingBatchWithRetry(
  geminiKey: string,
  chunks: StructuredChunkPayload[],
  title?: string | null,
) {
  const embeddingTexts = chunks.map((chunk) =>
    buildDocumentEmbeddingText({
      content: chunk.content,
      titleUsed: title ?? null,
      sectionTitle: chunk.sectionTitle,
      sourceTag: chunk.sourceTag,
    })
  );

  for (let attempt = 0; attempt <= EMBED_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const requests = embeddingTexts.map((text) => {
        const request: Record<string, unknown> = {
          model: `models/${EMBEDDING_MODEL}`,
          content: {
            parts: [{ text }],
          },
          taskType: DOCUMENT_EMBEDDING_TASK_TYPE,
          outputDimensionality: EMBEDDING_DIM,
        };

        if (title && title.trim()) {
          request.title = title.trim();
        }

        return request;
      });

      const response = await Promise.race([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiKey,
          },
          body: JSON.stringify({ requests }),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("EMBED_TIMEOUT")), EMBED_TIMEOUT_MS)
        ),
      ]);

      if (!response.ok) {
        const details = await response.text();
        throw Object.assign(new Error(`EMBED_HTTP_${response.status}: ${details}`), {
          status: response.status,
        });
      }

      const result = await response.json() as {
        embeddings?: Array<{ values?: number[] | null }>;
      };

      const valuesList = result.embeddings?.map((embedding) => embedding.values ?? null) ?? [];
      if (valuesList.length !== chunks.length) {
        console.warn(`Embedding batch size mismatch: expected ${chunks.length}, got ${valuesList.length}`);
        return new Array(chunks.length).fill(null);
      }

      return valuesList.map((values, index) => {
        if (!values || values.length !== EMBEDDING_DIM) {
          console.warn(
            `Embedding dimension mismatch at batch index ${index}: expected ${EMBEDDING_DIM}, got ${values?.length ?? 0}`,
          );
          return null;
        }

        return normalizeL2(values);
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      console.error("Embedding error:", msg);

      if (msg === "EMBED_TIMEOUT") {
        return new Array(chunks.length).fill(null);
      }

      const status = getErrorStatus(err);
      const retryable = status === 429 || (status !== undefined && status >= 500);

      if (retryable && attempt < EMBED_RETRY_DELAYS_MS.length) {
        await sleep(EMBED_RETRY_DELAYS_MS[attempt]);
        continue;
      }

      return new Array(chunks.length).fill(null);
    }
  }

  return new Array(chunks.length).fill(null);
}

async function generateEmbeddingsWithNativeBatching(
  geminiKey: string,
  chunks: StructuredChunkPayload[],
  title?: string | null,
) {
  const embeddings: Array<number[] | null> = [];
  let apiCalls = 0;

  for (let index = 0; index < chunks.length; index += EMBED_API_BATCH_SIZE) {
    const batch = chunks.slice(index, index + EMBED_API_BATCH_SIZE);
    const results = await generateEmbeddingBatchWithRetry(geminiKey, batch, title);
    embeddings.push(...results);
    apiCalls += 1;
  }

  return {
    embeddings,
    apiCalls,
  };
}

/**
 * Edge function: receives pre-extracted text chunks,
 * generates embeddings via @google/genai SDK, and upserts to DB.
 * Idempotent via UNIQUE(document_id, chunk_index).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  const request_id = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseSecretKey = Deno.env.get("SUPABASE_SECRET_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !supabaseKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "CONFIG:SUPABASE_CREDENTIALS_MISSING", request_id }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const accessToken = getBearerToken(req);
    const supabase = createClient(supabaseUrl, supabaseKey);
    let requestActor = "service_role";

    if (!isServiceRoleAutomationToken(accessToken, supabaseKey, supabaseSecretKey)) {
      const authenticatedUser = await requireAuthenticatedUser(req, supabaseUrl, supabaseAnonKey);
      if (!authenticatedUser) {
        return new Response(
          JSON.stringify({ ok: false, error: "AUTH:UNAUTHORIZED", request_id }),
          { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const isAdminUser = await requireAdminUser(supabase, authenticatedUser.id);
      if (!isAdminUser) {
        return new Response(
          JSON.stringify({ ok: false, error: "AUTH:ADMIN_REQUIRED", request_id }),
          { status: 403, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      requestActor = authenticatedUser.id;
    }

    const { document_id, chunks, start_index = 0, ingestion_job_id = null, title = null } = await req.json();
    const normalizedTitle = typeof title === "string" && title.trim().length > 0 ? title.trim() : null;

    if (!document_id || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "VALIDATION:MISSING_PARAMS", request_id }),
        { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (chunks.length > 10) {
      return new Response(
        JSON.stringify({ ok: false, error: "VALIDATION:MAX_10_CHUNKS", request_id }),
        { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const validChunks = chunks
      .map((chunk: unknown) => normalizeIncomingChunk(chunk))
      .filter((chunk: StructuredChunkPayload | null): chunk is StructuredChunkPayload => chunk !== null);

    if (validChunks.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "VALIDATION:EMPTY_CHUNKS", saved: 0, request_id }),
        { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "CONFIG:GEMINI_API_KEY_MISSING", request_id }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    await safeLogEvent(supabase, {
      document_id,
      ingestion_job_id,
      event_type: "embedding_request_received",
      message: "Lote recebido pela edge function de embeddings.",
      details_json: {
        start_index,
        requested_chunks: chunks.length,
        valid_chunks: validChunks.length,
        requested_by: requestActor,
        embedding_model: EMBEDDING_MODEL,
        embedding_dim: EMBEDDING_DIM,
        task_type: DOCUMENT_EMBEDDING_TASK_TYPE,
        input_style: DOCUMENT_EMBEDDING_INPUT_STYLE,
        contract_version: EMBEDDING_CONTRACT_VERSION,
        embed_api_batch_size: EMBED_API_BATCH_SIZE,
        title_used: normalizedTitle,
      },
    });

    const embeddingStart = Date.now();
    const { embeddings, apiCalls } = await generateEmbeddingsWithNativeBatching(geminiKey, validChunks, normalizedTitle);
    const embedding_ms = Date.now() - embeddingStart;

    // Build rows using ONLY columns that exist in document_chunks
    const rows = await Promise.all(validChunks.map(async (chunk: StructuredChunkPayload, i: number) => {
      const embeddedAt = embeddings[i] ? new Date().toISOString() : null;
      return {
        document_id,
        content: chunk.content,
        embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : null,
        chunk_index: start_index + i,
        page_start: chunk.pageStart,
        page_end: chunk.pageEnd,
        section_title: chunk.sectionTitle,
        text_hash: await sha256Hex(chunk.content),
        char_count: chunk.content.length,
        token_count_estimate: estimateTokenCount(chunk.content),
        embedding_model: EMBEDDING_MODEL,
        embedding_dim: EMBEDDING_DIM,
        embedded_at: embeddedAt,
        chunk_metadata_json: buildDocumentChunkMetadata({
          sourceTag: chunk.sourceTag,
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          sectionTitle: chunk.sectionTitle,
          taskType: DOCUMENT_EMBEDDING_TASK_TYPE,
          titleUsed: normalizedTitle,
          inputStyle: DOCUMENT_EMBEDDING_INPUT_STYLE,
          contractVersion: EMBEDDING_CONTRACT_VERSION,
          domainScope: EMBEDDING_DOMAIN_SCOPE,
        }),
      };
    }));

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
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
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
        embed_api_batch_size: EMBED_API_BATCH_SIZE,
        embed_api_calls: apiCalls,
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
        embed_api_batch_size: EMBED_API_BATCH_SIZE,
        embed_api_calls: apiCalls,
      }),
      { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("embed-chunks error:", error);
    const msg = getErrorMessage(error);
    return new Response(
      JSON.stringify({ ok: false, error: "INTERNAL_ERROR", details: msg, request_id }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
