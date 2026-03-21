import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminUploadCard from "@/components/admin/AdminUploadCard";
import type { Document, IngestionState, IngestionStatus } from "@/components/admin/admin-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabaseConfig, SUPABASE_UNAVAILABLE_MESSAGE, supabase } from "@/integrations/supabase/client";

const AdminDocumentsCard = lazy(() => import("@/components/admin/AdminDocumentsCard"));
const UsageStatsCard = lazy(() => import("@/components/UsageStatsCard"));

let adminIngestionModulePromise: Promise<typeof import("@/lib/admin-ingestion")> | null = null;

function loadAdminIngestionModule() {
  if (!adminIngestionModulePromise) {
    adminIngestionModulePromise = import("@/lib/admin-ingestion");
  }

  return adminIngestionModulePromise;
}

function AdminPanelFallback({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          Carregando painel...
        </div>
      </CardContent>
    </Card>
  );
}

const RETRY_DELAYS = [500, 1500, 3000];
const EMBED_BATCH_SIZE = 10;
const TIMEOUT_SECONDS = 300;

function isTransientError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error || "").toLowerCase();
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch") || msg.includes("aborted")) {
    return true;
  }
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
  opts: { retries?: number; signal?: AbortSignal } = {},
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
        console.warn(`Retry ${attempt + 1}/${retries} after ${delay}ms:`, err instanceof Error ? err.message : err);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }

  throw lastErr;
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m${remainingSeconds.toString().padStart(2, "0")}s` : `${remainingSeconds}s`;
}

async function embedBatchWithRetry(
  documentId: string,
  batch: string[],
  startIndex: number,
  signal?: AbortSignal,
): Promise<{ saved: number; requestId?: string }> {
  return withRetry(async () => {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke("embed-chunks", {
      body: { document_id: documentId, chunks: batch, start_index: startIndex },
    });

    if (fnErr) {
      throw new Error(`EMBED_TRANSPORT: ${fnErr.message}`);
    }

    if (fnData?.ok === false || fnData?.error) {
      const code = fnData?.error || "UNKNOWN";
      if (isValidationError(code)) {
        throw new Error(`Validação: ${code}`);
      }
      throw new Error(`EMBED_APP_ERROR: ${code} (req: ${fnData?.request_id || "?"})`);
    }

    return { saved: fnData?.saved || batch.length, requestId: fnData?.request_id };
  }, { retries: 3, signal });
}

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

  return new Set((data || []).map((row: { chunk_index: number }) => row.chunk_index));
}

export default function Admin() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ingestions, setIngestions] = useState<IngestionState[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [processingTimers, setProcessingTimers] = useState<Record<string, number>>({});
  const prevStatusRef = useRef<Record<string, string>>({});

  const fetchDocuments = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setDocuments([]);
      return;
    }

    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setDocuments(data as unknown as Document[]);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

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
    prevStatusRef.current = Object.fromEntries(documents.map((doc) => [doc.id, doc.status]));
  }, [documents]);

  useEffect(() => {
    const processingDocs = documents.filter((doc) => doc.status === "processing" || doc.status === "pending");
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

  const updateIngestion = (fileName: string, updates: Partial<IngestionState>) => {
    setIngestions((prev) =>
      prev.map((ingestion) => (
        ingestion.fileName === fileName ? { ...ingestion, ...updates } : ingestion
      )),
    );
  };

  const preparePdfPayload = async (file: File, fileName: string) => {
    updateIngestion(fileName, {
      status: "extracting",
      phaseLabel: "Carregando motor de ingestão...",
      progress: 2,
    });

    const { preparePdfIngestion } = await loadAdminIngestionModule();

    updateIngestion(fileName, {
      status: "extracting",
      phaseLabel: "Extraindo texto do PDF...",
      progress: 4,
    });

    const prepared = await preparePdfIngestion(file, (pagesRead, totalPages) => {
      updateIngestion(fileName, {
        progress: Math.round((pagesRead / totalPages) * 25),
        phaseLabel: `Extraindo texto... página ${pagesRead}/${totalPages}`,
      });
    });

    updateIngestion(fileName, {
      totalChunks: prepared.chunks.length,
      expectedChunks: prepared.chunks.length,
      phaseLabel: `${prepared.chunks.length} fragmentos criados`,
      progress: 30,
    });

    return prepared;
  };

  const sendChunksInBatches = async (
    documentId: string,
    chunks: string[],
    fileName: string,
    abortSignal: AbortSignal,
    skipIndexes?: Set<number>,
  ): Promise<{ insertedChunks: number; status: IngestionStatus }> => {
    const totalChunks = chunks.length;
    const chunksToSend: { chunk: string; index: number }[] = [];

    for (let index = 0; index < chunks.length; index++) {
      if (!skipIndexes || !skipIndexes.has(index)) {
        chunksToSend.push({ chunk: chunks[index], index });
      }
    }

    if (chunksToSend.length === 0) {
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

    for (let index = 0; index < chunksToSend.length; index += EMBED_BATCH_SIZE) {
      if (abortSignal.aborted) {
        return { insertedChunks: processedCount, status: "canceled" };
      }

      const batchItems = chunksToSend.slice(index, index + EMBED_BATCH_SIZE);
      const batchChunks = batchItems.map((item) => item.chunk);
      const batchStartIndex = batchItems[0].index;

      try {
        await embedBatchWithRetry(documentId, batchChunks, batchStartIndex, abortSignal);
      } catch (err: unknown) {
        console.error(`Batch at index ${batchStartIndex} failed after retries:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        updateIngestion(fileName, {
          lastError: {
            message: errorMessage,
            chunkIndex: batchStartIndex,
            code: errorMessage.includes("VALIDATION") ? "VALIDATION" : "TRANSIENT",
          },
        });
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

    updateIngestion(fileName, {
      status: "verifying",
      phaseLabel: "Verificando integridade...",
      progress: 92,
    });

    const insertedChunks = await verifyChunksInDB(documentId);
    updateIngestion(fileName, { insertedChunks });

    if (insertedChunks >= totalChunks) {
      return { insertedChunks, status: "done" };
    }
    if (insertedChunks > 0) {
      return { insertedChunks, status: "partial" };
    }

    return { insertedChunks, status: "failed" };
  };

  const processFileClientSide = async (file: File) => {
    const abortController = new AbortController();
    const ingestion: IngestionState = {
      fileName: file.name,
      status: "extracting",
      phaseLabel: "Preparando ingestão...",
      progress: 0,
      totalChunks: 0,
      processedChunks: 0,
      expectedChunks: 0,
      insertedChunks: 0,
      abortController,
    };

    setIngestions((prev) => [...prev, ingestion]);

    try {
      const prepared = await preparePdfPayload(file, file.name);

      if (abortController.signal.aborted) return;

      const { sanitizeFileName } = await loadAdminIngestionModule();
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

      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .insert({ name: file.name, file_path: filePath, status: "processing" })
        .select()
        .single();

      if (docErr || !doc) throw new Error("Falha ao registrar documento");
      const documentId = (doc as { id: string }).id;

      if (abortController.signal.aborted) {
        await supabase.from("documents").update({ status: "cancelled" }).eq("id", documentId);
        return;
      }

      const result = await sendChunksInBatches(
        documentId,
        prepared.chunks,
        file.name,
        abortController.signal,
      );

      if (result.status === "canceled") {
        await supabase.from("documents").update({ status: "cancelled" }).eq("id", documentId);
        updateIngestion(file.name, { status: "canceled", phaseLabel: "Cancelado" });
        return;
      }

      if (result.status === "done") {
        await supabase.from("documents").update({ status: "processed" }).eq("id", documentId);
        await supabase.from("usage_logs").insert({
          event_type: "client_side_ingestion",
          metadata: {
            document_id: documentId,
            chunks_count: prepared.chunks.length,
            text_length: prepared.fullText.length,
          },
        });
        updateIngestion(file.name, {
          status: "done",
          phaseLabel: `✓ Pronto — ${prepared.chunks.length} fragmentos`,
          progress: 100,
        });
        toast.success("Documento processado", {
          description: `"${file.name}" — ${prepared.chunks.length} fragmentos indexados.`,
        });
      } else if (result.status === "partial") {
        await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
        updateIngestion(file.name, {
          status: "partial",
          phaseLabel: `⚠ Parcial — ${result.insertedChunks}/${prepared.chunks.length} fragmentos`,
          progress: Math.round((result.insertedChunks / prepared.chunks.length) * 100),
        });
        toast.error("Processamento parcial", {
          description: `"${file.name}" — ${result.insertedChunks}/${prepared.chunks.length}. Use Retomar.`,
        });
      } else {
        await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
        updateIngestion(file.name, {
          status: "failed",
          phaseLabel: "Falha — nenhum fragmento salvo",
        });
        toast.error("Falha total", {
          description: `"${file.name}" — nenhum fragmento salvo.`,
        });
      }

      fetchDocuments();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Falha desconhecida";
      console.error("Client-side ingestion error:", err);
      updateIngestion(file.name, {
        status: "failed",
        phaseLabel: `Erro: ${errorMessage}`,
        lastError: { message: errorMessage },
      });
      toast.error("Erro no processamento", { description: errorMessage });
      fetchDocuments();
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIngestions((prev) =>
      prev.filter((ingestion) => (
        ingestion.status === "vectorizing" || ingestion.status === "extracting" || ingestion.status === "verifying"
      )),
    );

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (file.type !== "application/pdf") {
        toast.error("Erro", { description: `${file.name} não é um PDF` });
        continue;
      }
      await processFileClientSide(file);
    }

    event.target.value = "";
    setTimeout(() => {
      setIngestions((prev) => prev.filter((ingestion) => ingestion.status !== "done"));
    }, 5000);
  };

  const handleCancelIngestion = (fileName: string) => {
    setIngestions((prev) => {
      const ingestion = prev.find((item) => item.fileName === fileName);
      ingestion?.abortController?.abort();
      return prev.map((item) => (
        item.fileName === fileName
          ? { ...item, status: "canceled" as IngestionStatus, phaseLabel: "Cancelado" }
          : item
      ));
    });
  };

  const handleRetry = async (doc: Document) => {
    setRetryingId(doc.id);

    try {
      const existingIndexes = await getExistingChunkIndexes(doc.id);
      await supabase.from("documents").update({ status: "processing" }).eq("id", doc.id);

      const { data: fileData, error: downloadErr } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (downloadErr || !fileData) {
        throw new Error("Não foi possível baixar o arquivo do storage");
      }

      const file = new File([fileData], doc.name, { type: "application/pdf" });
      const abortController = new AbortController();

      const ingestion: IngestionState = {
        fileName: doc.name,
        status: "extracting",
        phaseLabel: "Preparando reprocessamento...",
        progress: 0,
        totalChunks: 0,
        processedChunks: 0,
        expectedChunks: 0,
        insertedChunks: 0,
        abortController,
      };

      setIngestions((prev) => [...prev.filter((item) => item.fileName !== doc.name), ingestion]);

      const prepared = await preparePdfPayload(file, doc.name);

      if (existingIndexes.size >= prepared.chunks.length) {
        await supabase.from("documents").update({ status: "processed" }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "done",
          progress: 100,
          phaseLabel: `✓ ${prepared.chunks.length} fragmentos (já existiam)`,
        });
        toast.success("Já completo", {
          description: `"${doc.name}" — todos os fragmentos já existiam.`,
        });
        fetchDocuments();
        setTimeout(() => {
          setIngestions((prev) => prev.filter((ingestionItem) => ingestionItem.fileName !== doc.name));
        }, 5000);
        return;
      }

      const result = await sendChunksInBatches(
        doc.id,
        prepared.chunks,
        doc.name,
        abortController.signal,
        existingIndexes,
      );

      if (result.status === "done") {
        await supabase.from("documents").update({ status: "processed" }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "done",
          progress: 100,
          phaseLabel: `✓ ${prepared.chunks.length} fragmentos`,
        });
        toast.success("Reprocessado", { description: `"${doc.name}" pronto.` });
      } else if (result.status === "partial") {
        await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "partial",
          phaseLabel: `⚠ ${result.insertedChunks}/${prepared.chunks.length} — Retome novamente`,
        });
        toast.error("Parcial", {
          description: `"${doc.name}" — ${result.insertedChunks}/${prepared.chunks.length}. Retome.`,
        });
      } else {
        await supabase.from("documents").update({ status: "error" }).eq("id", doc.id);
        updateIngestion(doc.name, { status: "failed", phaseLabel: "Falha no reprocessamento" });
        toast.error("Falha", { description: "Reprocessamento falhou." });
      }

      fetchDocuments();

      setTimeout(() => {
        setIngestions((prev) => prev.filter((ingestionItem) => ingestionItem.fileName !== doc.name));
      }, 5000);
    } catch (err: unknown) {
      toast.error("Erro ao reprocessar", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
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
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
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

  const isBusy = ingestions.some((ingestion) => (
    ingestion.status === "vectorizing" || ingestion.status === "extracting" || ingestion.status === "verifying"
  ));

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <AdminPageHeader onSignOut={() => {}} />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Painel administrativo em preparação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{SUPABASE_UNAVAILABLE_MESSAGE}</p>
              <p>
                Assim que o novo projeto Supabase estiver ligado, este painel volta a exibir documentos, ingestões, autenticação e métricas reais.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <AdminPageHeader onSignOut={() => { void supabase.auth.signOut(); }} />

        <AdminUploadCard
          ingestions={ingestions}
          isBusy={isBusy}
          onUpload={handleUpload}
          onCancelIngestion={handleCancelIngestion}
        />

        <Suspense fallback={<AdminPanelFallback title="Documentos" />}>
          <AdminDocumentsCard
            documents={documents}
            retryingId={retryingId}
            isTimedOut={isTimedOut}
            canRetry={canRetry}
            canCancel={canCancel}
            statusIcon={statusIcon}
            statusLabel={statusLabel}
            onRetry={(doc) => { void handleRetry(doc); }}
            onCancel={(doc) => { void handleCancel(doc); }}
            onDelete={(doc) => { void handleDelete(doc); }}
          />
        </Suspense>

        <Suspense fallback={<AdminPanelFallback title="Métricas agregadas da CLARA" />}>
          <UsageStatsCard />
        </Suspense>
      </div>
    </div>
  );
}
