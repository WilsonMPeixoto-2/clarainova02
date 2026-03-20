import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Trash2, FileText, Loader2, CheckCircle2, XCircle, ArrowLeft, LogOut, RefreshCw, X, AlertTriangle, Brain, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import UsageStatsCard from "@/components/UsageStatsCard";
import { extractText, getDocumentProxy } from "unpdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

interface Document {
  id: string;
  name: string;
  file_path: string;
  status: string;
  created_at: string;
}

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

// ─── Semantic text chunking via LangChain ───────────────────────────────────

const langChainSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""],
});

async function splitWithLangChain(rawText: string): Promise<string[]> {
  const normalized = rawText.replace(/\u0000/g, "").trim();
  const chunks = await langChainSplitter.splitText(normalized);
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

// ─── Client-side PDF text extraction via unpdf ──────────────────────────────

interface PageText {
  pageNumber: number;
  text: string;
}

async function extractTextFromPDF(
  file: File,
  onProgress?: (pagesRead: number, totalPages: number) => void
): Promise<PageText[]> {
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

function isTransientError(error: any): boolean {
  const msg = String(error?.message || error || "").toLowerCase();
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

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const { retries = 3, signal } = opts;
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new Error("Cancelado pelo usuário");
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (attempt < retries && isTransientError(err) && !signal?.aborted) {
        const delay = RETRY_DELAYS[attempt] || 3000;
        console.warn(`Retry ${attempt + 1}/${retries} after ${delay}ms:`, err.message);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
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
  signal?: AbortSignal
): Promise<{ saved: number; requestId?: string }> {
  return withRetry(async () => {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke("embed-chunks", {
      body: { document_id: documentId, chunks: batch, start_index: startIndex },
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
        const err = new Error(`Validação: ${code}`);
        (err as any).noRetry = true;
        throw err;
      }
      throw new Error(`EMBED_APP_ERROR: ${code} (req: ${fnData?.request_id || "?"})`);
    }

    return { saved: fnData?.saved || batch.length, requestId: fnData?.request_id };
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
  return new Set((data || []).map((r: any) => r.chunk_index));
}

export default function Admin() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ingestions, setIngestions] = useState<IngestionState[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [processingTimers, setProcessingTimers] = useState<Record<string, number>>({});
  const prevStatusRef = useRef<Record<string, string>>({});

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDocuments(data as unknown as Document[]);
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
          toast.success("Documento pronto", { description: `"${doc.name}" foi processado com sucesso.` });
        } else if (doc.status === "error") {
          toast.error("Erro no processamento", { description: `"${doc.name}" falhou. Use o botão reprocessar.` });
        }
      }
    }
    prevStatusRef.current = Object.fromEntries(documents.map((d) => [d.id, d.status]));
  }, [documents]);

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
    skipIndexes?: Set<number>
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
        await embedBatchWithRetry(documentId, batchChunks, batchStartIndex, abortSignal);
      } catch (err: any) {
        console.error(`Batch at index ${batchStartIndex} failed after retries:`, err);
        updateIngestion(fileName, {
          lastError: {
            message: err.message,
            chunkIndex: batchStartIndex,
            code: err.message.includes("VALIDATION") ? "VALIDATION" : "TRANSIENT",
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

    const insertedChunks = await verifyChunksInDB(documentId);
    updateIngestion(fileName, { insertedChunks });

    if (insertedChunks >= totalChunks) {
      return { insertedChunks, status: "done" };
    } else if (insertedChunks > 0) {
      return { insertedChunks, status: "partial" };
    } else {
      return { insertedChunks, status: "failed" };
    }
  };

  const processFileClientSide = async (file: File) => {
    const abortController = new AbortController();
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

    try {
      // Phase 1: Extract text from PDF in the browser
      updateIngestion(file.name, { status: "extracting", phaseLabel: "Extraindo texto do PDF..." });

      const pages = await extractTextFromPDF(file, (pagesRead, totalPages) => {
        updateIngestion(file.name, {
          progress: Math.round((pagesRead / totalPages) * 25),
          phaseLabel: `Extraindo texto... página ${pagesRead}/${totalPages}`,
        });
      });

      if (abortController.signal.aborted) return;

      const fullText = pages.map((p) => p.text).join("\n\n");
      if (fullText.length < 50) {
        throw new Error("PDF parece estar vazio ou conter apenas imagens (sem texto extraível).");
      }

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

      if (abortController.signal.aborted) return;

      // Phase 3: Upload file to storage
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${crypto.randomUUID()}_${sanitizedName}`;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: false });

      if (uploadErr) throw new Error(`Upload falhou: ${uploadErr.message}`);

      // Create document record
      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .insert({ name: file.name, file_path: filePath, status: "processing" })
        .select()
        .single();

      if (docErr || !doc) throw new Error("Falha ao registrar documento");
      const documentId = (doc as any).id;

      if (abortController.signal.aborted) {
        await supabase.from("documents").update({ status: "cancelled" }).eq("id", documentId);
        return;
      }

      // Phase 4: Send chunks with retry + verification
      const result = await sendChunksInBatches(documentId, chunks, file.name, abortController.signal);

      if (result.status === "canceled") {
        await supabase.from("documents").update({ status: "cancelled" }).eq("id", documentId);
        updateIngestion(file.name, { status: "canceled", phaseLabel: "Cancelado" });
        return;
      }

      if (result.status === "done") {
        await supabase.from("documents").update({ status: "processed" }).eq("id", documentId);
        await supabase.from("usage_logs").insert({
          event_type: "client_side_ingestion",
          metadata: { document_id: documentId, chunks_count: totalChunks, text_length: fullText.length },
        });
        updateIngestion(file.name, {
          status: "done",
          phaseLabel: `✓ Pronto — ${totalChunks} fragmentos`,
          progress: 100,
        });
        toast.success("Documento processado", { description: `"${file.name}" — ${totalChunks} fragmentos indexados.` });
      } else if (result.status === "partial") {
        await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
        updateIngestion(file.name, {
          status: "partial",
          phaseLabel: `⚠ Parcial — ${result.insertedChunks}/${totalChunks} fragmentos`,
          progress: Math.round((result.insertedChunks / totalChunks) * 100),
        });
        toast.error("Processamento parcial", { description: `"${file.name}" — ${result.insertedChunks}/${totalChunks}. Use Retomar.` });
      } else {
        await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
        updateIngestion(file.name, {
          status: "failed",
          phaseLabel: "Falha — nenhum fragmento salvo",
        });
        toast.error("Falha total", { description: `"${file.name}" — nenhum fragmento salvo.` });
      }

      fetchDocuments();
    } catch (err: any) {
      console.error("Client-side ingestion error:", err);
      updateIngestion(file.name, {
        status: "failed",
        phaseLabel: `Erro: ${err.message || "Falha desconhecida"}`,
        lastError: { message: err.message },
      });
      toast.error("Erro no processamento", { description: err.message });
      fetchDocuments();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Clear completed/errored ingestions
    setIngestions((prev) => prev.filter((ing) => ing.status === "vectorizing" || ing.status === "extracting" || ing.status === "verifying"));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        toast.error("Erro", { description: `${file.name} não é um PDF` });
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
    try {
      // Check which chunks already exist (idempotent resume)
      const existingIndexes = await getExistingChunkIndexes(doc.id);

      await supabase.from("documents").update({ status: "processing" }).eq("id", doc.id);

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

      // If all chunks already exist, mark done directly
      if (existingIndexes.size >= chunks.length) {
        await supabase.from("documents").update({ status: "processed" }).eq("id", doc.id);
        updateIngestion(doc.name, { status: "done", progress: 100, phaseLabel: `✓ ${chunks.length} fragmentos (já existiam)` });
        toast.success("Já completo", { description: `"${doc.name}" — todos os fragmentos já existiam.` });
        fetchDocuments();
        setTimeout(() => {
          setIngestions((prev) => prev.filter((ing) => ing.fileName !== doc.name));
        }, 5000);
        return;
      }

      // Send only missing chunks
      const result = await sendChunksInBatches(doc.id, chunks, doc.name, abortController.signal, existingIndexes);

      if (result.status === "done") {
        await supabase.from("documents").update({ status: "processed" }).eq("id", doc.id);
        updateIngestion(doc.name, { status: "done", progress: 100, phaseLabel: `✓ ${chunks.length} fragmentos` });
        toast.success("Reprocessado", { description: `"${doc.name}" pronto.` });
      } else if (result.status === "partial") {
        await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "partial",
          phaseLabel: `⚠ ${result.insertedChunks}/${chunks.length} — Retome novamente`,
        });
        toast.error("Parcial", { description: `"${doc.name}" — ${result.insertedChunks}/${chunks.length}. Retome.` });
      } else {
        await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
        updateIngestion(doc.name, { status: "failed", phaseLabel: "Falha no reprocessamento" });
        toast.error("Falha", { description: "Reprocessamento falhou." });
      }

      fetchDocuments();

      setTimeout(() => {
        setIngestions((prev) => prev.filter((ing) => ing.fileName !== doc.name));
      }, 5000);
    } catch (err: any) {
      toast.error("Erro ao reprocessar", { description: err.message });
      await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
      fetchDocuments();
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancel = async (doc: Document) => {
    try {
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.from("documents").update({ status: "cancelled" }).eq("id", doc.id);
      fetchDocuments();
      toast.success("Cancelado", { description: `"${doc.name}" foi cancelado.` });
    } catch {
      toast.error("Erro ao cancelar");
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.storage.from("documents").remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id", doc.id);
      fetchDocuments();
      toast.success("Documento removido");
    } catch {
      toast.error("Erro ao remover");
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
                Apenas arquivos PDF — processamento local no navegador
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
                    <TableHead className="w-[220px]">Status</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
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

        <UsageStatsCard />
      </div>
    </div>
  );
}
