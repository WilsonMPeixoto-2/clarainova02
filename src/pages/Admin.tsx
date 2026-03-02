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
import { Upload, Trash2, FileText, Loader2, CheckCircle2, XCircle, ArrowLeft, LogOut, RefreshCw, X, AlertTriangle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import UsageStatsCard from "@/components/UsageStatsCard";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Document {
  id: string;
  name: string;
  file_path: string;
  status: string;
  created_at: string;
}

interface IngestionState {
  fileName: string;
  phase: "reading" | "extracting" | "chunking" | "embedding" | "done" | "error";
  phaseLabel: string;
  progress: number; // 0-100
  totalChunks: number;
  processedChunks: number;
  error?: string;
  abortController?: AbortController;
}

// ─── Text chunking (same logic as the old edge function) ────────────────────

function splitIntoChunks(text: string, targetWords = 500, overlapWords = 50): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= targetWords) return [text.trim()];
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start += targetWords - overlapWords;
  }
  return chunks;
}

// ─── Sanitize file name for Supabase Storage ────────────────────────────────

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, "_") // replace special chars
    .replace(/_+/g, "_"); // collapse multiple underscores
}

// ─── Client-side PDF text extraction via pdf.js ─────────────────────────────

async function extractTextFromPDF(
  file: File,
  onProgress?: (pagesRead: number, totalPages: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pageTexts.push(text);
    onProgress?.(i, totalPages);
  }

  return pageTexts.join("\n\n");
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMBED_BATCH_SIZE = 5; // chunks per edge function call
const TIMEOUT_SECONDS = 300;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export default function Admin() {
  const [documents, setDocuments] = useState<Document[]>([]);
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

  const processFileClientSide = async (file: File) => {
    const abortController = new AbortController();
    const ingestion: IngestionState = {
      fileName: file.name,
      phase: "reading",
      phaseLabel: "Lendo PDF...",
      progress: 0,
      totalChunks: 0,
      processedChunks: 0,
      abortController,
    };

    setIngestions((prev) => [...prev, ingestion]);

    try {
      // Phase 1: Extract text from PDF in the browser
      updateIngestion(file.name, { phase: "extracting", phaseLabel: "Extraindo texto do PDF..." });

      const text = await extractTextFromPDF(file, (pagesRead, totalPages) => {
        updateIngestion(file.name, {
          progress: Math.round((pagesRead / totalPages) * 25),
          phaseLabel: `Extraindo texto... página ${pagesRead}/${totalPages}`,
        });
      });

      if (abortController.signal.aborted) return;

      if (text.length < 50) {
        throw new Error("PDF parece estar vazio ou conter apenas imagens (sem texto extraível).");
      }

      // Phase 2: Chunk the text locally
      updateIngestion(file.name, {
        phase: "chunking",
        phaseLabel: "Fatiando texto em fragmentos...",
        progress: 25,
      });

      const chunks = splitIntoChunks(text, 500, 50);
      const totalChunks = chunks.length;

      updateIngestion(file.name, {
        totalChunks,
        phaseLabel: `${totalChunks} fragmentos criados`,
        progress: 30,
      });

      if (abortController.signal.aborted) return;

      // Phase 3: Upload file to storage (sanitized name)
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${crypto.randomUUID()}_${sanitizedName}`;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      // Simple upload via SDK (file stays in storage for reference)
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

      // Phase 4: Send chunks to edge function in batches for embedding
      updateIngestion(file.name, {
        phase: "embedding",
        phaseLabel: `Vetorizando fragmentos... 0/${totalChunks}`,
        progress: 30,
      });

      let processedChunks = 0;

      for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
        if (abortController.signal.aborted) {
          await supabase.from("documents").update({ status: "cancelled" }).eq("id", documentId);
          return;
        }

        const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);

        const { error: fnErr } = await supabase.functions.invoke("embed-chunks", {
          body: { document_id: documentId, chunks: batch, start_index: i },
        });

        if (fnErr) {
          console.error(`Embed batch ${i} failed:`, fnErr);
          throw new Error(`Falha ao vetorizar fragmento ${i + 1}: ${fnErr.message}`);
        }

        processedChunks += batch.length;
        const embeddingProgress = 30 + Math.round((processedChunks / totalChunks) * 65);

        updateIngestion(file.name, {
          processedChunks,
          progress: embeddingProgress,
          phaseLabel: `Vetorizando... ${processedChunks}/${totalChunks}`,
        });
      }

      // Done!
      await supabase.from("documents").update({ status: "processed" }).eq("id", documentId);
      await supabase.from("usage_logs").insert({
        event_type: "client_side_ingestion",
        metadata: { document_id: documentId, chunks_count: totalChunks, text_length: text.length },
      });

      updateIngestion(file.name, {
        phase: "done",
        phaseLabel: `✓ Pronto — ${totalChunks} fragmentos`,
        progress: 100,
      });

      toast({ title: "✅ Documento processado", description: `"${file.name}" — ${totalChunks} fragmentos indexados.` });
      fetchDocuments();
    } catch (err: any) {
      console.error("Client-side ingestion error:", err);
      updateIngestion(file.name, {
        phase: "error",
        phaseLabel: `Erro: ${err.message || "Falha desconhecida"}`,
        error: err.message,
      });
      toast({ title: "❌ Erro no processamento", description: err.message, variant: "destructive" });
      fetchDocuments();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIngestions([]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        toast({ title: "Erro", description: `${file.name} não é um PDF`, variant: "destructive" });
        continue;
      }
      // Process each file sequentially to avoid overwhelming the API
      await processFileClientSide(file);
    }

    e.target.value = "";
    // Keep ingestion UI visible for a few seconds after completion
    setTimeout(() => {
      setIngestions((prev) => prev.filter((ing) => ing.phase !== "done"));
    }, 5000);
  };

  const handleCancelIngestion = (fileName: string) => {
    setIngestions((prev) => {
      const ing = prev.find((i) => i.fileName === fileName);
      ing?.abortController?.abort();
      return prev.filter((i) => i.fileName !== fileName);
    });
  };

  const handleRetry = async (doc: Document) => {
    setRetryingId(doc.id);
    try {
      // Delete existing chunks
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.from("documents").update({ status: "pending" }).eq("id", doc.id);

      // Download the file from storage and re-process client-side
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (dlErr || !fileData) {
        throw new Error("Não foi possível baixar o arquivo do storage");
      }

      const file = new File([fileData], doc.name, { type: "application/pdf" });
      
      // Remove old doc record, processFileClientSide will create a new one
      // Actually, let's reuse the existing record
      await supabase.from("documents").update({ status: "processing" }).eq("id", doc.id);

      // Extract & embed client-side using the existing document ID
      const abortController = new AbortController();
      const ingestion: IngestionState = {
        fileName: doc.name,
        phase: "extracting",
        phaseLabel: "Re-extraindo texto...",
        progress: 0,
        totalChunks: 0,
        processedChunks: 0,
        abortController,
      };
      setIngestions((prev) => [...prev, ingestion]);

      const text = await extractTextFromPDF(file, (pagesRead, totalPages) => {
        updateIngestion(doc.name, {
          progress: Math.round((pagesRead / totalPages) * 25),
          phaseLabel: `Extraindo... ${pagesRead}/${totalPages}`,
        });
      });

      if (text.length < 50) throw new Error("PDF sem texto extraível");

      const chunks = splitIntoChunks(text, 500, 50);
      updateIngestion(doc.name, {
        phase: "embedding",
        totalChunks: chunks.length,
        progress: 30,
        phaseLabel: `Vetorizando... 0/${chunks.length}`,
      });

      let processedChunks = 0;
      for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
        const { error: fnErr } = await supabase.functions.invoke("embed-chunks", {
          body: { document_id: doc.id, chunks: batch, start_index: i },
        });
        if (fnErr) throw new Error(`Embedding falhou: ${fnErr.message}`);

        processedChunks += batch.length;
        updateIngestion(doc.name, {
          processedChunks,
          progress: 30 + Math.round((processedChunks / chunks.length) * 65),
          phaseLabel: `Vetorizando... ${processedChunks}/${chunks.length}`,
        });
      }

      await supabase.from("documents").update({ status: "processed" }).eq("id", doc.id);
      updateIngestion(doc.name, { phase: "done", progress: 100, phaseLabel: `✓ ${chunks.length} fragmentos` });
      toast({ title: "✅ Reprocessado", description: `"${doc.name}" pronto.` });
      fetchDocuments();

      setTimeout(() => {
        setIngestions((prev) => prev.filter((ing) => ing.fileName !== doc.name));
      }, 5000);
    } catch (err: any) {
      toast({ title: "Erro ao reprocessar", description: err.message, variant: "destructive" });
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

  const phaseColor = (phase: IngestionState["phase"]) => {
    switch (phase) {
      case "done": return "text-primary";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
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
                disabled={ingestions.some((i) => i.phase !== "done" && i.phase !== "error")}
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
                        <span className={`text-xs font-medium ${phaseColor(ing.phase)}`}>
                          {ing.phase === "embedding" && <Brain className="inline h-3 w-3 mr-1" />}
                          {ing.phaseLabel}
                        </span>
                        {ing.phase !== "done" && ing.phase !== "error" && (
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
                    {ing.phase !== "done" && ing.phase !== "error" && (
                      <Progress value={ing.progress} className="h-2" />
                    )}
                    {ing.phase === "done" && (
                      <Progress value={100} className="h-2" />
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
                              title="Reprocessar"
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
