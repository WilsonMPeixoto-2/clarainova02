import { lazy, Suspense, useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Trash2, FileText, Loader2, CheckCircle2, XCircle, ArrowLeft, LogOut, RefreshCw, X, AlertTriangle, Brain, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  classifyKnowledgeDocument,
  KNOWLEDGE_AUTHORITY_LEVEL_LABELS,
  KNOWLEDGE_DOCUMENT_KIND_LABELS,
  KNOWLEDGE_TOPIC_SCOPE_LABELS,
  type KnowledgeAuthorityLevel,
  type KnowledgeDocumentKind,
  type KnowledgeTopicScope,
} from "@/lib/knowledge-document-classifier";
import { Link } from "react-router-dom";

type Document = Tables<"documents">;
type IngestionJobInsert = TablesInsert<"ingestion_jobs">;
type IngestionJobUpdate = TablesUpdate<"ingestion_jobs">;
type ProcessingEventInsert = TablesInsert<"document_processing_events">;
type AdminDocumentMetadata = {
  authority_level?: KnowledgeAuthorityLevel;
  document_kind?: KnowledgeDocumentKind;
  excluded_from_chat_reason?: string | null;
  tags?: string[];
};
type AdminDocument = Document & {
  file_name?: string | null;
  is_active?: boolean | null;
  metadata_json?: AdminDocumentMetadata | null;
  topic_scope?: KnowledgeTopicScope | null;
};

const UsageStatsCard = lazy(() => import("@/components/UsageStatsCard"));

type IngestionStatus = "idle" | "extracting" | "vectorizing" | "verifying" | "done" | "partial" | "failed" | "canceled";

interface IngestionLastError {
  message: string;
  requestId?: string;
  chunkIndex?: number;
  code?: string;
}

interface IngestionState {
  fileName: string;
  status: IngestionStatus;
  phaseLabel: string;
  progress: number; // 0-100
  totalChunks: number;
  processedChunks: number;
  expectedChunks: number;
  insertedChunks: number;
  lastError?: IngestionLastError;
  abortController?: AbortController;
}

function getErrorMessage(error: unknown, fallback = "Falha desconhecida"): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

// ─── Semantic text chunking via LangChain ───────────────────────────────────

let langChainSplitterPromise: Promise<RecursiveCharacterTextSplitter> | null = null;

function getLangChainSplitter() {
  if (!langChainSplitterPromise) {
    langChainSplitterPromise = import("@langchain/textsplitters").then(
      ({ RecursiveCharacterTextSplitter }) =>
        new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
          separators: ["\n\n", "\n", " ", ""],
        })
    );
  }

  return langChainSplitterPromise;
}

async function splitWithLangChain(rawText: string): Promise<string[]> {
  const splitter = await getLangChainSplitter();
  const normalized = rawText.replace(/\0/g, "").trim();
  const chunks = await splitter.splitText(normalized);
  return chunks.filter((c) => c.trim().length >= 3);
}

// ─── Sanitize file name for Supabase Storage ────────────────────────────────

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Client-side PDF text extraction via unpdf ──────────────────────────────

interface PageText {
  pageNumber: number;
  text: string;
}

async function extractTextFromPDF(
  file: File,
  onProgress?: (pagesRead: number, totalPages: number) => void
): Promise<PageText[]> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
  const totalPages = pdf.numPages;
  
  onProgress?.(0, totalPages);
  
  const result = await extractText(pdf, { mergePages: false });
  const pageTexts = result.text as unknown as string[];
  
  onProgress?.(totalPages, totalPages);

  return pageTexts.map((text, index) => ({
    pageNumber: index + 1,
    text,
  }));
}

// ─── Retry helper with exponential backoff ──────────────────────────────────

const RETRY_DELAYS = [500, 1500, 3000];

function isTransientError(error: unknown): boolean {
  const msg = getErrorMessage(error, String(error ?? "")).toLowerCase();
  // Network failures
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch") || msg.includes("aborted")) {
    return true;
  }
  // Edge function relay errors (supabase wraps status in the error)
  if (msg.includes("429") || msg.includes("503") || msg.includes("500") || msg.includes("502") || msg.includes("504")) {
    return true;
  }
  if (msg.includes("rate") || msg.includes("limit") || msg.includes("throttl")) {
    return true;
  }
  return false;
}

function isValidationError(errorCode?: string): boolean {
  return !!errorCode && errorCode.startsWith("VALIDATION:");
}

function getDocumentMetadata(doc: AdminDocument): AdminDocumentMetadata {
  if (!doc.metadata_json || typeof doc.metadata_json !== "object") {
    return {};
  }

  return doc.metadata_json;
}

function getDocumentTopicScope(doc: AdminDocument): KnowledgeTopicScope {
  return doc.topic_scope ?? "material_apoio";
}

function getDocumentKindLabel(doc: AdminDocument) {
  const metadata = getDocumentMetadata(doc);
  return metadata.document_kind ? KNOWLEDGE_DOCUMENT_KIND_LABELS[metadata.document_kind] : null;
}

function getDocumentAuthorityLabel(doc: AdminDocument) {
  const metadata = getDocumentMetadata(doc);
  return metadata.authority_level ? KNOWLEDGE_AUTHORITY_LEVEL_LABELS[metadata.authority_level] : null;
}

function getChatVisibilityLabel(doc: AdminDocument) {
  const metadata = getDocumentMetadata(doc);

  if (doc.is_active === false) {
    return metadata.excluded_from_chat_reason === "internal_technical"
      ? "Fora do chat por ser tecnico"
      : "Fora do chat";
  }

  return "Elegivel no chat";
}

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const { retries = 3, signal } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new Error("Cancelado pelo usuário");
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      if (attempt < retries && isTransientError(err) && !signal?.aborted) {
        const delay = RETRY_DELAYS[attempt] || 3000;
        console.warn(`Retry ${attempt + 1}/${retries} after ${delay}ms:`, getErrorMessage(err));
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw (lastErr instanceof Error ? lastErr : new Error(getErrorMessage(lastErr)));
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMBED_BATCH_SIZE = 10; // max accepted by edge function
const TIMEOUT_SECONDS = 300;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
}

// ─── Embed a batch with retry + response validation ─────────────────────────

async function embedBatchWithRetry(
  documentId: string,
  batch: string[],
  startIndex: number,
  ingestionJobId?: string | null,
  signal?: AbortSignal
): Promise<{ saved: number; requestId?: string; failedEmbeddings: number }> {
  return withRetry(async () => {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke("embed-chunks", {
      body: {
        document_id: documentId,
        chunks: batch,
        start_index: startIndex,
        ingestion_job_id: ingestionJobId ?? null,
      },
    });

    // Transport-level error (network, 5xx relay)
    if (fnErr) {
      throw new Error(`EMBED_TRANSPORT: ${fnErr.message}`);
    }

    // Application-level error in response body
    if (fnData?.ok === false || fnData?.error) {
      const code = fnData?.error || "UNKNOWN";
      if (isValidationError(code)) {
        // Don't retry validation errors
        throw new Error(`Validação: ${code}`);
      }
      throw new Error(`EMBED_APP_ERROR: ${code} (req: ${fnData?.request_id || "?"})`);
    }

    return {
      saved: fnData?.saved || batch.length,
      requestId: fnData?.request_id,
      failedEmbeddings: fnData?.failed_embeddings || 0,
    };
  }, { retries: 3, signal });
}

// ─── Verify chunks in DB ────────────────────────────────────────────────────

async function verifyChunksInDB(documentId: string): Promise<number> {
  const { count } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true })
    .eq("document_id", documentId);
  return count || 0;
}

async function getExistingChunkIndexes(documentId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from("document_chunks")
    .select("chunk_index")
    .eq("document_id", documentId);
  return new Set((data || []).map((row) => row.chunk_index));
}

async function safeCreateIngestionJob(payload: IngestionJobInsert): Promise<string | null> {
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("Could not create ingestion job:", error.message);
    return null;
  }

  return data?.id ?? null;
}

async function safeUpdateIngestionJob(jobId: string | null | undefined, payload: IngestionJobUpdate): Promise<void> {
  if (!jobId) return;

  const { error } = await supabase
    .from("ingestion_jobs")
    .update(payload)
    .eq("id", jobId);

  if (error) {
    console.warn("Could not update ingestion job:", error.message);
  }
}

async function safeLogProcessingEvent(payload: ProcessingEventInsert): Promise<void> {
  const { error } = await supabase
    .from("document_processing_events")
    .insert(payload);

  if (error) {
    console.warn("Could not log processing event:", error.message);
  }
}

async function getNextAttemptNumber(documentId: string): Promise<number> {
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .select("attempt_number")
    .eq("document_id", documentId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Could not determine ingestion attempt number:", error.message);
    return 1;
  }

  return (data?.attempt_number ?? 0) + 1;
}

export default function Admin() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [ingestions, setIngestions] = useState<IngestionState[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [processingTimers, setProcessingTimers] = useState<Record<string, number>>({});
  const prevStatusRef = useRef<Record<string, string>>({});
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
      if (data) setDocuments(data as AdminDocument[]);
  }, []);

  // Polling
  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  // Detect status changes → toasts
  useEffect(() => {
    const prev = prevStatusRef.current;
    for (const doc of documents) {
      const oldStatus = prev[doc.id];
      if (oldStatus && oldStatus !== doc.status) {
        if (doc.status === "processed") {
          toast({ title: "✅ Documento pronto", description: `"${doc.name}" foi processado com sucesso.` });
        } else if (doc.status === "error") {
          toast({ title: "❌ Erro no processamento", description: `"${doc.name}" falhou. Use o botão reprocessar.`, variant: "destructive" });
        }
      }
    }
    prevStatusRef.current = Object.fromEntries(documents.map((d) => [d.id, d.status]));
  }, [documents, toast]);

  // Processing timers for legacy server-side processing docs
  useEffect(() => {
    const processingDocs = documents.filter((d) => d.status === "processing" || d.status === "pending");
    if (processingDocs.length === 0) {
      setProcessingTimers({});
      return;
    }
    const interval = setInterval(() => {
      setProcessingTimers((prev) => {
        const next = { ...prev };
        for (const doc of processingDocs) {
          if (!next[doc.id]) {
            next[doc.id] = Math.floor((Date.now() - new Date(doc.created_at).getTime()) / 1000);
          } else {
            next[doc.id] = prev[doc.id] + 1;
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [documents]);

  // ─── Client-side ingestion pipeline ─────────────────────────────────────

  const updateIngestion = (fileName: string, updates: Partial<IngestionState>) => {
    setIngestions((prev) =>
      prev.map((ing) => (ing.fileName === fileName ? { ...ing, ...updates } : ing))
    );
  };

  /**
   * Send chunks in batches with retry, verification, and idempotency.
   * Returns { insertedChunks, status }.
   */
  const sendChunksInBatches = async (
    documentId: string,
    chunks: string[],
    fileName: string,
    abortSignal: AbortSignal,
    skipIndexes?: Set<number>,
    ingestionJobId?: string | null
  ): Promise<{ insertedChunks: number; status: IngestionStatus }> => {
    const totalChunks = chunks.length;
    const chunksToSend: { chunk: string; index: number }[] = [];

    for (let i = 0; i < chunks.length; i++) {
      if (!skipIndexes || !skipIndexes.has(i)) {
        chunksToSend.push({ chunk: chunks[i], index: i });
      }
    }

    if (chunksToSend.length === 0) {
      // All chunks already exist
      return { insertedChunks: totalChunks, status: "done" };
    }

    let processedCount = skipIndexes ? (totalChunks - chunksToSend.length) : 0;
    let failedEmbeddings = 0;

    await safeLogProcessingEvent({
      document_id: documentId,
      ingestion_job_id: ingestionJobId ?? null,
      event_type: "embedding_batches_started",
      message: `Vetorizacao iniciada para ${chunksToSend.length} fragmentos pendentes.`,
      details_json: {
        total_chunks: totalChunks,
        pending_chunks: chunksToSend.length,
        skipped_chunks: processedCount,
      },
    });

    updateIngestion(fileName, {
      status: "vectorizing",
      expectedChunks: totalChunks,
      processedChunks: processedCount,
      phaseLabel: `Vetorizando... ${processedCount}/${totalChunks}`,
      progress: 30 + Math.round((processedCount / totalChunks) * 60),
    });

    // Process in batches of EMBED_BATCH_SIZE
    for (let i = 0; i < chunksToSend.length; i += EMBED_BATCH_SIZE) {
      if (abortSignal.aborted) {
        return { insertedChunks: processedCount, status: "canceled" };
      }

      const batchItems = chunksToSend.slice(i, i + EMBED_BATCH_SIZE);
      const batchChunks = batchItems.map((b) => b.chunk);
      const batchStartIndex = batchItems[0].index;

      try {
        const batchResult = await embedBatchWithRetry(documentId, batchChunks, batchStartIndex, ingestionJobId, abortSignal);
        failedEmbeddings += batchResult.failedEmbeddings;
      } catch (err: unknown) {
        console.error(`Batch at index ${batchStartIndex} failed after retries:`, err);
        const message = getErrorMessage(err);
        updateIngestion(fileName, {
          lastError: {
            message,
            chunkIndex: batchStartIndex,
            code: message.includes("VALIDATION") ? "VALIDATION" : "TRANSIENT",
          },
        });
        // Don't throw — move to verification
        break;
      }

      processedCount += batchItems.length;
      const embeddingProgress = 30 + Math.round((processedCount / totalChunks) * 60);
      updateIngestion(fileName, {
        processedChunks: processedCount,
        progress: embeddingProgress,
        phaseLabel: `Vetorizando... ${processedCount}/${totalChunks}`,
      });
    }

    // Verification phase
    updateIngestion(fileName, {
      status: "verifying",
      phaseLabel: "Verificando integridade...",
      progress: 92,
    });
    await safeLogProcessingEvent({
      document_id: documentId,
      ingestion_job_id: ingestionJobId ?? null,
      event_type: "verification_started",
      message: "Verificacao de integridade iniciada apos a vetorizacao.",
      details_json: {
        total_chunks: totalChunks,
        processed_chunks: processedCount,
        failed_embeddings: failedEmbeddings,
      },
    });

    const insertedChunks = await verifyChunksInDB(documentId);
    updateIngestion(fileName, { insertedChunks });

    if (insertedChunks >= totalChunks && failedEmbeddings === 0) {
      await safeLogProcessingEvent({
        document_id: documentId,
        ingestion_job_id: ingestionJobId ?? null,
        event_type: "verification_completed",
        message: "Todos os fragmentos esperados foram confirmados no banco.",
        details_json: {
          inserted_chunks: insertedChunks,
          total_chunks: totalChunks,
        },
      });
      return { insertedChunks, status: "done" };
    } else if (insertedChunks > 0) {
      await safeLogProcessingEvent({
        document_id: documentId,
        ingestion_job_id: ingestionJobId ?? null,
        event_type: "verification_partial",
        event_level: "warning",
        message: "A verificacao encontrou persistencia parcial dos fragmentos.",
        details_json: {
          inserted_chunks: insertedChunks,
          total_chunks: totalChunks,
          failed_embeddings: failedEmbeddings,
        },
      });
      return { insertedChunks, status: "partial" };
    } else {
      await safeLogProcessingEvent({
        document_id: documentId,
        ingestion_job_id: ingestionJobId ?? null,
        event_type: "verification_failed",
        event_level: "error",
        message: "Nenhum fragmento foi confirmado no banco apos a vetorizacao.",
        details_json: {
          inserted_chunks: insertedChunks,
          total_chunks: totalChunks,
          failed_embeddings: failedEmbeddings,
        },
      });
      return { insertedChunks, status: "failed" };
    }
  };

  const processFileClientSide = async (file: File) => {
    const abortController = new AbortController();
    const startedAt = new Date().toISOString();
    const ingestion: IngestionState = {
      fileName: file.name,
      status: "extracting",
      phaseLabel: "Lendo PDF...",
      progress: 0,
      totalChunks: 0,
      processedChunks: 0,
      expectedChunks: 0,
      insertedChunks: 0,
      abortController,
    };

    setIngestions((prev) => [...prev, ingestion]);

    let ingestionJobId: string | null = null;
    let documentId: string | null = null;

    try {
      ingestionJobId = await safeCreateIngestionJob({
        job_type: "upload_ingestion",
        trigger_source: "admin_panel",
        status: "running",
        attempt_number: 1,
        started_at: startedAt,
        payload_json: {
          file_name: file.name,
          mime_type: file.type || "application/pdf",
          size_bytes: file.size,
        },
      });

      await safeLogProcessingEvent({
        ingestion_job_id: ingestionJobId,
        event_type: "upload_received",
        message: `Arquivo ${file.name} recebido para ingestao.`,
        details_json: {
          mime_type: file.type || "application/pdf",
          size_bytes: file.size,
        },
      });

      // Phase 1: Extract text from PDF in the browser
      updateIngestion(file.name, { status: "extracting", phaseLabel: "Extraindo texto do PDF..." });

      const pages = await extractTextFromPDF(file, (pagesRead, totalPages) => {
        updateIngestion(file.name, {
          progress: Math.round((pagesRead / totalPages) * 25),
          phaseLabel: `Extraindo texto... página ${pagesRead}/${totalPages}`,
        });
      });

      if (abortController.signal.aborted) {
        const cancelledAt = new Date().toISOString();
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "cancelled",
          failed_at: cancelledAt,
          error_message: "Processamento cancelado durante a extracao de texto.",
        });
        await safeLogProcessingEvent({
          ingestion_job_id: ingestionJobId,
          event_type: "ingestion_cancelled",
          event_level: "warning",
          message: "Processamento cancelado durante a extracao de texto.",
        });
        return;
      }

      const fullText = pages.map((p) => p.text).join("\n\n");
      if (fullText.length < 50) {
        throw new Error("PDF parece estar vazio ou conter apenas imagens (sem texto extraível).");
      }
      const classification = classifyKnowledgeDocument(file.name, fullText);

      if (classification.warning) {
        toast({
          title: "Arquivo salvo como material interno",
          description: classification.warning,
        });
      }

      await safeLogProcessingEvent({
        ingestion_job_id: ingestionJobId,
        event_type: "text_extracted",
        message: "Texto extraido do PDF no navegador.",
        details_json: {
          page_count: pages.length,
          text_char_count: fullText.length,
        },
      });

      // Phase 2: Chunk text per page, injecting source tags
      updateIngestion(file.name, {
        phaseLabel: "Fatiando texto em fragmentos...",
        progress: 25,
      });

      const allChunks: string[] = [];
      for (const page of pages) {
        if (!page.text.trim()) continue;
        const pageChunks = await splitWithLangChain(page.text);
        for (const chunk of pageChunks) {
          allChunks.push(`[Fonte: ${file.name} | Página: ${page.pageNumber}]\n\n${chunk}`);
        }
      }
      const chunks = allChunks;
      const totalChunks = chunks.length;

      updateIngestion(file.name, {
        totalChunks,
        expectedChunks: totalChunks,
        phaseLabel: `${totalChunks} fragmentos criados`,
        progress: 30,
      });

      await safeLogProcessingEvent({
        ingestion_job_id: ingestionJobId,
        event_type: "chunks_generated",
        message: `${totalChunks} fragmentos gerados a partir do PDF.`,
        details_json: {
          total_chunks: totalChunks,
          page_count: pages.length,
        },
      });

      if (abortController.signal.aborted) {
        const cancelledAt = new Date().toISOString();
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "cancelled",
          failed_at: cancelledAt,
          error_message: "Processamento cancelado antes do upload do arquivo.",
        });
        await safeLogProcessingEvent({
          ingestion_job_id: ingestionJobId,
          event_type: "ingestion_cancelled",
          event_level: "warning",
          message: "Processamento cancelado antes do upload do arquivo.",
        });
        return;
      }

      // Phase 3: Upload file to storage
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${crypto.randomUUID()}_${sanitizedName}`;
      const documentHash = await computeFileHash(file);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: false });

      if (uploadErr) throw new Error(`Upload falhou: ${uploadErr.message}`);

      await safeLogProcessingEvent({
        ingestion_job_id: ingestionJobId,
        event_type: "storage_uploaded",
        message: "Arquivo salvo no storage da base documental.",
        details_json: {
          storage_path: filePath,
        },
      });

      // Create document record
      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .insert({
          name: file.name,
          file_name: file.name,
          file_path: filePath,
          storage_path: filePath,
          mime_type: file.type || "application/pdf",
          document_hash: documentHash,
          source_type: "upload",
          source_name: "Painel administrativo CLARA",
          language_code: "pt-BR",
          jurisdiction_scope: "municipal_rj",
          topic_scope: classification.topicScope,
          page_count: pages.length,
          text_char_count: fullText.length,
          is_active: classification.shouldIndex,
          metadata_json: {
            ingestion_source: "admin_panel",
            extraction_mode: "client_side",
            auto_topic_scope: classification.topicScope,
            document_kind: classification.documentKind,
            authority_level: classification.authorityLevel,
            technical_score: classification.technicalScore,
            procedural_score: classification.proceduralScore,
            official_score: classification.officialScore,
            faq_score: classification.faqScore,
            guide_score: classification.guideScore,
            normative_score: classification.normativeScore,
            manual_score: classification.manualScore,
            search_weight: classification.searchWeight,
            tags: classification.tags,
            excluded_from_chat_reason: classification.excludedFromChatReason,
          },
          status: "processing",
        })
        .select()
        .single();

      if (docErr || !doc) throw new Error("Falha ao registrar documento");
      documentId = doc.id;

      await safeUpdateIngestionJob(ingestionJobId, {
        document_id: documentId,
      });

      await safeLogProcessingEvent({
        document_id: documentId,
        ingestion_job_id: ingestionJobId,
        event_type: "document_registered",
        message: "Documento registrado no acervo documental.",
        details_json: {
          page_count: pages.length,
          total_chunks: totalChunks,
          document_hash: documentHash,
        },
      });

      if (abortController.signal.aborted) {
        const cancelledAt = new Date().toISOString();
        await supabase.from("documents").update({ status: "cancelled", failure_reason: "Processamento cancelado pelo usuário", failed_at: cancelledAt }).eq("id", documentId);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "cancelled",
          failed_at: cancelledAt,
          error_message: "Processamento cancelado pelo usuario antes do envio final dos chunks.",
        });
        await safeLogProcessingEvent({
          document_id: documentId,
          ingestion_job_id: ingestionJobId,
          event_type: "ingestion_cancelled",
          event_level: "warning",
          message: "Processamento cancelado pelo usuario.",
        });
        return;
      }

      // Phase 4: Send chunks with retry + verification
      const result = await sendChunksInBatches(documentId, chunks, file.name, abortController.signal, undefined, ingestionJobId);

      if (result.status === "canceled") {
        const cancelledAt = new Date().toISOString();
        await supabase.from("documents").update({ status: "cancelled", failure_reason: "Processamento cancelado pelo usuário", failed_at: cancelledAt }).eq("id", documentId);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "cancelled",
          failed_at: cancelledAt,
          error_message: "Processamento cancelado durante a vetorizacao.",
          result_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: totalChunks,
          },
        });
        await safeLogProcessingEvent({
          document_id: documentId,
          ingestion_job_id: ingestionJobId,
          event_type: "ingestion_cancelled",
          event_level: "warning",
          message: "Processamento cancelado durante a vetorizacao.",
          details_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: totalChunks,
          },
        });
        updateIngestion(file.name, { status: "canceled", phaseLabel: "Cancelado" });
        return;
      }

      if (result.status === "done") {
        const processedAt = new Date().toISOString();
        await supabase.from("documents").update({ status: "processed", processed_at: processedAt, failed_at: null, failure_reason: null }).eq("id", documentId);
        await supabase.from("usage_logs").insert({
          event_type: "client_side_ingestion",
          metadata: { document_id: documentId, chunks_count: totalChunks, text_length: fullText.length },
        });
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "completed",
          completed_at: processedAt,
          failed_at: null,
          error_code: null,
          error_message: null,
          result_json: {
            inserted_chunks: totalChunks,
            expected_chunks: totalChunks,
            text_char_count: fullText.length,
          },
        });
        await safeLogProcessingEvent({
          document_id: documentId,
          ingestion_job_id: ingestionJobId,
          event_type: "ingestion_completed",
          message: "Documento processado com sucesso e incorporado ao indice vetorial.",
          details_json: {
            inserted_chunks: totalChunks,
            expected_chunks: totalChunks,
          },
        });
        updateIngestion(file.name, {
          status: "done",
          phaseLabel: `✓ Pronto — ${totalChunks} fragmentos`,
          progress: 100,
        });
        toast({ title: "✅ Documento processado", description: `"${file.name}" — ${totalChunks} fragmentos indexados.` });
      } else if (result.status === "partial") {
        const failedAt = new Date().toISOString();
        const failureReason = "Processamento parcial: parte dos chunks ficou sem embedding ou não foi persistida.";
        await supabase.from("documents").update({ status: "error", failed_at: failedAt, failure_reason: failureReason }).eq("id", documentId);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "failed",
          failed_at: failedAt,
          error_code: "PARTIAL_INGESTION",
          error_message: failureReason,
          result_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: totalChunks,
          },
        });
        await safeLogProcessingEvent({
          document_id: documentId,
          ingestion_job_id: ingestionJobId,
          event_type: "ingestion_partial",
          event_level: "warning",
          message: failureReason,
          details_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: totalChunks,
          },
        });
        updateIngestion(file.name, {
          status: "partial",
          phaseLabel: `⚠ Parcial — ${result.insertedChunks}/${totalChunks} fragmentos`,
          progress: Math.round((result.insertedChunks / totalChunks) * 100),
        });
        toast({ title: "⚠ Processamento parcial", description: `"${file.name}" — ${result.insertedChunks}/${totalChunks}. Use Retomar.`, variant: "destructive" });
      } else {
        const failedAt = new Date().toISOString();
        const failureReason = "Falha total no processamento dos chunks.";
        await supabase.from("documents").update({ status: "error", failed_at: failedAt, failure_reason: failureReason }).eq("id", documentId);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "failed",
          failed_at: failedAt,
          error_code: "INGESTION_FAILED",
          error_message: failureReason,
          result_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: totalChunks,
          },
        });
        await safeLogProcessingEvent({
          document_id: documentId,
          ingestion_job_id: ingestionJobId,
          event_type: "ingestion_failed",
          event_level: "error",
          message: failureReason,
          details_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: totalChunks,
          },
        });
        updateIngestion(file.name, {
          status: "failed",
          phaseLabel: "Falha — nenhum fragmento salvo",
        });
        toast({ title: "❌ Falha total", description: `"${file.name}" — nenhum fragmento salvo.`, variant: "destructive" });
      }

      fetchDocuments();
    } catch (err: unknown) {
      console.error("Client-side ingestion error:", err);
      const message = getErrorMessage(err);
      updateIngestion(file.name, {
        status: "failed",
        phaseLabel: `Erro: ${message}`,
        lastError: { message },
      });
      const failedAt = new Date().toISOString();
      await safeUpdateIngestionJob(ingestionJobId, {
        status: "failed",
        failed_at: failedAt,
        error_code: "CLIENT_INGESTION_ERROR",
        error_message: message,
      });
      await safeLogProcessingEvent({
        document_id: documentId,
        ingestion_job_id: ingestionJobId,
        event_type: "ingestion_failed",
        event_level: "error",
        message,
      });
      toast({ title: "❌ Erro no processamento", description: message, variant: "destructive" });
      fetchDocuments();
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Clear completed/errored ingestions
    setIngestions((prev) => prev.filter((ing) => ing.status === "vectorizing" || ing.status === "extracting" || ing.status === "verifying"));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        toast({ title: "Erro", description: `${file.name} não é um PDF`, variant: "destructive" });
        continue;
      }
      await processFileClientSide(file);
    }

    e.target.value = "";
    setTimeout(() => {
      setIngestions((prev) => prev.filter((ing) => ing.status !== "done"));
    }, 5000);
  };

  const handleCancelIngestion = (fileName: string) => {
    setIngestions((prev) => {
      const ing = prev.find((i) => i.fileName === fileName);
      ing?.abortController?.abort();
      return prev.map((i) => i.fileName === fileName ? { ...i, status: "canceled" as IngestionStatus, phaseLabel: "Cancelado" } : i);
    });
  };

  const handleRetry = async (doc: Document) => {
    setRetryingId(doc.id);
    let ingestionJobId: string | null = null;
    try {
      const attemptNumber = await getNextAttemptNumber(doc.id);
      ingestionJobId = await safeCreateIngestionJob({
        document_id: doc.id,
        job_type: "reprocess",
        trigger_source: "admin_panel",
        status: "running",
        attempt_number: attemptNumber,
        started_at: new Date().toISOString(),
        payload_json: {
          file_name: doc.name,
          storage_path: doc.file_path,
        },
      });

      await safeLogProcessingEvent({
        document_id: doc.id,
        ingestion_job_id: ingestionJobId,
        event_type: "reprocess_started",
        message: "Reprocessamento iniciado a partir do painel administrativo.",
        details_json: {
          attempt_number: attemptNumber,
        },
      });

      // Check which chunks already exist (idempotent resume)
      const existingIndexes = await getExistingChunkIndexes(doc.id);

      await supabase.from("documents").update({ status: "processing", failed_at: null, failure_reason: null }).eq("id", doc.id);

      // Download the file from storage and re-process client-side
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (dlErr || !fileData) {
        throw new Error("Não foi possível baixar o arquivo do storage");
      }

      const file = new File([fileData], doc.name, { type: "application/pdf" });

      const abortController = new AbortController();
      const ingestion: IngestionState = {
        fileName: doc.name,
        status: "extracting",
        phaseLabel: "Re-extraindo texto...",
        progress: 0,
        totalChunks: 0,
        processedChunks: 0,
        expectedChunks: 0,
        insertedChunks: 0,
        abortController,
      };
      setIngestions((prev) => [...prev.filter((i) => i.fileName !== doc.name), ingestion]);

      const pages = await extractTextFromPDF(file, (pagesRead, totalPages) => {
        updateIngestion(doc.name, {
          progress: Math.round((pagesRead / totalPages) * 25),
          phaseLabel: `Extraindo... ${pagesRead}/${totalPages}`,
        });
      });

      await safeLogProcessingEvent({
        document_id: doc.id,
        ingestion_job_id: ingestionJobId,
        event_type: "text_extracted",
        message: "Texto reextraido do PDF para reprocessamento.",
        details_json: {
          page_count: pages.length,
        },
      });

      const fullText = pages.map((p) => p.text).join("\n\n");
      if (fullText.length < 50) throw new Error("PDF sem texto extraível");

      const allChunks: string[] = [];
      for (const page of pages) {
        if (!page.text.trim()) continue;
        const pageChunks = await splitWithLangChain(page.text);
        for (const chunk of pageChunks) {
          allChunks.push(`[Fonte: ${doc.name} | Página: ${page.pageNumber}]\n\n${chunk}`);
        }
      }
      const chunks = allChunks;

      updateIngestion(doc.name, {
        totalChunks: chunks.length,
        expectedChunks: chunks.length,
        progress: 30,
      });

      await safeLogProcessingEvent({
        document_id: doc.id,
        ingestion_job_id: ingestionJobId,
        event_type: "chunks_generated",
        message: `${chunks.length} fragmentos recalculados para reprocessamento.`,
        details_json: {
          total_chunks: chunks.length,
          existing_chunks: existingIndexes.size,
        },
      });

      // If all chunks already exist, mark done directly
      if (existingIndexes.size >= chunks.length) {
        const processedAt = new Date().toISOString();
        await supabase.from("documents").update({ status: "processed", processed_at: processedAt, failed_at: null, failure_reason: null }).eq("id", doc.id);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "completed",
          completed_at: processedAt,
          result_json: {
            total_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
            outcome: "already_complete",
          },
        });
        await safeLogProcessingEvent({
          document_id: doc.id,
          ingestion_job_id: ingestionJobId,
          event_type: "reprocess_completed",
          message: "Reprocessamento concluido sem necessidade de novos embeddings.",
          details_json: {
            total_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
          },
        });
        updateIngestion(doc.name, { status: "done", progress: 100, phaseLabel: `✓ ${chunks.length} fragmentos (já existiam)` });
        toast({ title: "✅ Já completo", description: `"${doc.name}" — todos os fragmentos já existiam.` });
        fetchDocuments();
        setTimeout(() => {
          setIngestions((prev) => prev.filter((ing) => ing.fileName !== doc.name));
        }, 5000);
        return;
      }

      // Send only missing chunks
      const result = await sendChunksInBatches(doc.id, chunks, doc.name, abortController.signal, existingIndexes, ingestionJobId);

      if (result.status === "done") {
        const processedAt = new Date().toISOString();
        await supabase.from("documents").update({ status: "processed", processed_at: processedAt, failed_at: null, failure_reason: null }).eq("id", doc.id);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "completed",
          completed_at: processedAt,
          failed_at: null,
          error_code: null,
          error_message: null,
          result_json: {
            inserted_chunks: chunks.length,
            expected_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
          },
        });
        await safeLogProcessingEvent({
          document_id: doc.id,
          ingestion_job_id: ingestionJobId,
          event_type: "reprocess_completed",
          message: "Reprocessamento concluido com sucesso.",
          details_json: {
            inserted_chunks: chunks.length,
            expected_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
          },
        });
        updateIngestion(doc.name, { status: "done", progress: 100, phaseLabel: `✓ ${chunks.length} fragmentos` });
        toast({ title: "✅ Reprocessado", description: `"${doc.name}" pronto.` });
      } else if (result.status === "partial") {
        const failedAt = new Date().toISOString();
        const failureReason = "Reprocessamento parcial: parte dos chunks ficou sem embedding ou não foi persistida.";
        await supabase.from("documents").update({ status: "error", failed_at: failedAt, failure_reason: failureReason }).eq("id", doc.id);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "failed",
          failed_at: failedAt,
          error_code: "PARTIAL_REPROCESS",
          error_message: failureReason,
          result_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
          },
        });
        await safeLogProcessingEvent({
          document_id: doc.id,
          ingestion_job_id: ingestionJobId,
          event_type: "reprocess_partial",
          event_level: "warning",
          message: failureReason,
          details_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
          },
        });
        updateIngestion(doc.name, {
          status: "partial",
          phaseLabel: `⚠ ${result.insertedChunks}/${chunks.length} — Retome novamente`,
        });
        toast({ title: "⚠ Parcial", description: `"${doc.name}" — ${result.insertedChunks}/${chunks.length}. Retome.`, variant: "destructive" });
      } else {
        const failedAt = new Date().toISOString();
        const failureReason = "Falha no reprocessamento dos chunks.";
        await supabase.from("documents").update({ status: "error", failed_at: failedAt, failure_reason: failureReason }).eq("id", doc.id);
        await safeUpdateIngestionJob(ingestionJobId, {
          status: "failed",
          failed_at: failedAt,
          error_code: "REPROCESS_FAILED",
          error_message: failureReason,
          result_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
          },
        });
        await safeLogProcessingEvent({
          document_id: doc.id,
          ingestion_job_id: ingestionJobId,
          event_type: "reprocess_failed",
          event_level: "error",
          message: failureReason,
          details_json: {
            inserted_chunks: result.insertedChunks,
            expected_chunks: chunks.length,
            skipped_chunks: existingIndexes.size,
          },
        });
        updateIngestion(doc.name, { status: "failed", phaseLabel: "Falha no reprocessamento" });
        toast({ title: "❌ Falha", description: "Reprocessamento falhou.", variant: "destructive" });
      }

      fetchDocuments();

      setTimeout(() => {
        setIngestions((prev) => prev.filter((ing) => ing.fileName !== doc.name));
      }, 5000);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      const failedAt = new Date().toISOString();
      toast({ title: "Erro ao reprocessar", description: message, variant: "destructive" });
      await supabase.from("documents").update({ status: "error", failed_at: failedAt, failure_reason: message }).eq("id", doc.id);
      await safeUpdateIngestionJob(ingestionJobId, {
        status: "failed",
        failed_at: failedAt,
        error_code: "REPROCESS_ERROR",
        error_message: message,
      });
      await safeLogProcessingEvent({
        document_id: doc.id,
        ingestion_job_id: ingestionJobId,
        event_type: "reprocess_failed",
        event_level: "error",
        message,
      });
      fetchDocuments();
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancel = async (doc: Document) => {
    try {
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.from("documents").update({ status: "cancelled", failed_at: new Date().toISOString(), failure_reason: "Processamento cancelado manualmente." }).eq("id", doc.id);
      await safeLogProcessingEvent({
        document_id: doc.id,
        event_type: "processing_cancelled_manually",
        event_level: "warning",
        message: "Processamento cancelado manualmente pelo painel administrativo.",
      });
      fetchDocuments();
      toast({ title: "Cancelado", description: `"${doc.name}" foi cancelado.` });
    } catch {
      toast({ title: "Erro ao cancelar", variant: "destructive" });
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.storage.from("documents").remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id", doc.id);
      fetchDocuments();
      toast({ title: "Documento removido" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const isTimedOut = (docId: string) => {
    const timer = processingTimers[docId];
    return timer !== undefined && timer >= TIMEOUT_SECONDS;
  };

  const statusIcon = (doc: Document) => {
    if (isTimedOut(doc.id)) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    switch (doc.status) {
      case "processed":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "processing":
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "cancelled":
        return <X className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const statusLabel = (doc: Document) => {
    if (isTimedOut(doc.id)) return "Possível falha — tente reprocessar";
    const map: Record<string, string> = {
      pending: "Na fila",
      processing: "Processando",
      processed: "Pronto",
      error: "Erro",
      cancelled: "Cancelado",
    };
    const label = map[doc.status] || doc.status;
    const timer = processingTimers[doc.id];
    if ((doc.status === "processing" || doc.status === "pending") && timer !== undefined) {
      return `${label}... ${formatTimer(timer)}`;
    }
    return label;
  };

  const canRetry = (doc: Document) =>
    doc.status === "error" || doc.status === "cancelled" || isTimedOut(doc.id);

  const canCancel = (doc: Document) =>
    (doc.status === "processing" || doc.status === "pending") && !isTimedOut(doc.id);

  const phaseColor = (status: IngestionStatus) => {
    switch (status) {
      case "done": return "text-primary";
      case "failed": return "text-destructive";
      case "partial": return "text-yellow-600 dark:text-yellow-400";
      case "canceled": return "text-muted-foreground";
      case "verifying": return "text-blue-500";
      default: return "text-muted-foreground";
    }
  };

  const phaseIcon = (status: IngestionStatus) => {
    switch (status) {
      case "vectorizing": return <Brain className="inline h-3 w-3 mr-1" />;
      case "verifying": return <ShieldCheck className="inline h-3 w-3 mr-1" />;
      case "partial": return <AlertCircle className="inline h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Base de Conhecimento — CLARA
              </h1>
              <p className="text-sm text-muted-foreground">
                Faça upload de PDFs para alimentar a base de conhecimento da assistente.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()} title="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              Upload de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 hover:bg-muted/50">
              <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Clique ou arraste PDFs aqui
              </span>
              <span className="text-xs text-muted-foreground">
                PDFs oficiais de diferentes origens, com extracao inicial local no navegador
              </span>
              <span className="text-[11px] text-muted-foreground/80 text-center max-w-xl mt-1">
                Nesta fase, o painel aceita PDFs do jeito mais simples possivel. Na migracao do backend proprio, o fluxo sera preparado para upload mais robusto e leitura complementar quando um arquivo vier com estrutura mais dificil.
              </span>
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={ingestions.some((i) => i.status === "vectorizing" || i.status === "extracting" || i.status === "verifying")}
              />
            </label>

            {/* Ingestion progress */}
            {ingestions.length > 0 && (
              <div className="space-y-3">
                {ingestions.map((ing) => (
                  <div key={ing.fileName} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate max-w-[60%]">
                        {ing.fileName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${phaseColor(ing.status)}`}>
                          {phaseIcon(ing.status)}
                          {ing.phaseLabel}
                        </span>
                        {(ing.status === "vectorizing" || ing.status === "extracting" || ing.status === "verifying") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCancelIngestion(ing.fileName)}
                            title="Cancelar"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {ing.status !== "done" && ing.status !== "failed" && ing.status !== "canceled" && ing.status !== "partial" && (
                      <Progress value={ing.progress} className="h-2" />
                    )}
                    {ing.status === "done" && (
                      <Progress value={100} className="h-2" />
                    )}
                    {ing.status === "partial" && (
                      <Progress value={ing.progress} className="h-2" />
                    )}
                    {ing.lastError && (
                      <p className="text-xs text-destructive mt-1">
                        {ing.lastError.message}
                        {ing.lastError.chunkIndex !== undefined && ` (chunk #${ing.lastError.chunkIndex})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentos ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum documento na base de conhecimento.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[230px]">Classificacao</TableHead>
                    <TableHead className="w-[180px]">Busca</TableHead>
                    <TableHead className="w-[220px]">Status</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-2">
                          <p>{doc.name}</p>
                          {getDocumentMetadata(doc).tags?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {getDocumentMetadata(doc).tags?.slice(0, 3).map((tag) => (
                                <span
                                  key={`${doc.id}-${tag}`}
                                  className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {KNOWLEDGE_TOPIC_SCOPE_LABELS[getDocumentTopicScope(doc)]}
                          </span>
                          {getDocumentKindLabel(doc) ? (
                            <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                              {getDocumentKindLabel(doc)}
                            </span>
                          ) : null}
                          {getDocumentAuthorityLabel(doc) ? (
                            <span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-foreground/80">
                              {getDocumentAuthorityLabel(doc)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p
                            className={`text-sm font-medium ${
                              doc.is_active === false ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
                            }`}
                          >
                            {getChatVisibilityLabel(doc)}
                          </p>
                          {getDocumentMetadata(doc).excluded_from_chat_reason ? (
                            <p className="text-xs text-muted-foreground">
                              Motivo: {getDocumentMetadata(doc).excluded_from_chat_reason}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Prioridade definida pela classificacao automatica do acervo.
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`flex items-center gap-2 text-sm ${
                            isTimedOut(doc.id)
                              ? "text-yellow-600 dark:text-yellow-400 font-medium"
                              : doc.status === "error"
                              ? "text-destructive"
                              : ""
                          }`}
                        >
                          {statusIcon(doc)}
                          {statusLabel(doc)}
                        </span>
                        {canRetry(doc) && (
                          <div className="flex gap-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(doc)}
                              disabled={retryingId === doc.id}
                              className="h-7 text-xs"
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${retryingId === doc.id ? "animate-spin" : ""}`} />
                              Retomar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(doc)}
                              className="h-7 text-xs text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canCancel(doc) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(doc)}
                              title="Cancelar processamento"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {canRetry(doc) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRetry(doc)}
                              disabled={retryingId === doc.id}
                              title="Retomar"
                            >
                              <RefreshCw className={`h-4 w-4 text-muted-foreground ${retryingId === doc.id ? "animate-spin" : ""}`} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc)}
                            title="Remover documento"
                            className={
                              doc.status === "error" || doc.status === "cancelled" || isTimedOut(doc.id)
                                ? "opacity-100"
                                : "opacity-60 hover:opacity-100"
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metricas agregadas da CLARA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Carregando painel analitico...</p>
              </CardContent>
            </Card>
          }
        >
          <UsageStatsCard />
        </Suspense>
      </div>
    </div>
  );
}
