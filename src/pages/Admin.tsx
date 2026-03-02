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
import { Upload, Trash2, FileText, Loader2, CheckCircle2, XCircle, ArrowLeft, LogOut, RefreshCw, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import UsageStatsCard from "@/components/UsageStatsCard";

interface Document {
  id: string;
  name: string;
  file_path: string;
  status: string;
  created_at: string;
}

interface UploadState {
  fileName: string;
  loaded: number;
  total: number;
  phase: "uploading" | "done" | "error";
  startTime: number;
  xhr?: XMLHttpRequest;
}

const TIMEOUT_SECONDS = 300; // 5 minutes

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
}

function formatETA(loaded: number, total: number, startTime: number): string {
  const elapsed = (Date.now() - startTime) / 1000;
  if (elapsed < 1 || loaded === 0) return "";
  const speed = loaded / elapsed;
  const remaining = (total - loaded) / speed;
  if (remaining < 60) return `~${Math.ceil(remaining)}s restante`;
  return `~${Math.ceil(remaining / 60)}min restante`;
}

export default function Admin() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
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

  // Processing timers
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

  // XHR upload to Supabase Storage with real progress
  const uploadFileXHR = (file: File, filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/documents/${filePath}`;

      const uploadState: UploadState = {
        fileName: file.name,
        loaded: 0,
        total: file.size,
        phase: "uploading",
        startTime: Date.now(),
        xhr,
      };

      setUploads((prev) => [...prev, uploadState]);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploads((prev) =>
            prev.map((u) =>
              u.fileName === file.name ? { ...u, loaded: e.loaded, total: e.total } : u
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploads((prev) =>
            prev.map((u) =>
              u.fileName === file.name ? { ...u, phase: "done", loaded: u.total } : u
            )
          );
          resolve();
        } else {
          setUploads((prev) =>
            prev.map((u) =>
              u.fileName === file.name ? { ...u, phase: "error" } : u
            )
          );
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        setUploads((prev) =>
          prev.map((u) =>
            u.fileName === file.name ? { ...u, phase: "error" } : u
          )
        );
        reject(new Error("Network error"));
      };

      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`);
      xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.send(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploads([]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        toast({ title: "Erro", description: `${file.name} não é um PDF`, variant: "destructive" });
        continue;
      }

      try {
        const filePath = `${crypto.randomUUID()}_${file.name}`;

        // Upload with real progress
        await uploadFileXHR(file, filePath);

        // Insert document record
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .insert({ name: file.name, file_path: filePath, status: "pending" })
          .select()
          .single();

        if (docErr) throw docErr;

        // Trigger processing with error handling
        await triggerProcessing((doc as unknown as Document).id, file.name);
      } catch (err) {
        console.error(err);
        toast({ title: "Erro no upload", description: `Falha ao enviar ${file.name}`, variant: "destructive" });
      }
    }

    fetchDocuments();
    e.target.value = "";

    // Clear upload states after 3s
    setTimeout(() => setUploads([]), 3000);
  };

  const triggerProcessing = async (docId: string, docName?: string) => {
    const { error } = await supabase.functions.invoke("process-document", {
      body: { document_id: docId },
    });

    if (error) {
      console.error("Process-document invoke error:", error);
      await supabase.from("documents").update({ status: "error" }).eq("id", docId);
      toast({
        title: "Erro ao processar",
        description: `Falha ao iniciar processamento${docName ? ` de "${docName}"` : ""}. Tente reprocessar.`,
        variant: "destructive",
      });
    }
  };

  const handleRetry = async (doc: Document) => {
    setRetryingId(doc.id);
    try {
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.from("documents").update({ status: "pending" }).eq("id", doc.id);
      await triggerProcessing(doc.id, doc.name);
      toast({ title: "Reprocessando", description: `"${doc.name}" será processado novamente.` });
      fetchDocuments();
    } catch {
      toast({ title: "Erro ao reprocessar", variant: "destructive" });
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

  const handleCancelUpload = (fileName: string) => {
    setUploads((prev) => {
      const upload = prev.find((u) => u.fileName === fileName);
      if (upload?.xhr) {
        upload.xhr.abort();
      }
      return prev.filter((u) => u.fileName !== fileName);
    });
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
    if (isTimedOut(doc.id)) {
      return "Possível falha — tente reprocessar";
    }
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
                Apenas arquivos PDF (até 100MB)
              </span>
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploads.some((u) => u.phase === "uploading")}
              />
            </label>

            {/* Active uploads with real progress */}
            {uploads.length > 0 && (
              <div className="space-y-3">
                {uploads.map((u) => (
                  <div key={u.fileName} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate max-w-[70%]">
                        {u.fileName}
                      </span>
                      <div className="flex items-center gap-2">
                        {u.phase === "uploading" && (
                          <span className="text-xs text-muted-foreground">
                            {formatBytes(u.loaded)} / {formatBytes(u.total)}
                          </span>
                        )}
                        {u.phase === "done" && (
                          <span className="text-xs text-primary font-medium">Enviado ✓</span>
                        )}
                        {u.phase === "error" && (
                          <span className="text-xs text-destructive font-medium">Falha ✗</span>
                        )}
                        {u.phase === "uploading" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCancelUpload(u.fileName)}
                            title="Cancelar upload"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {u.phase === "uploading" && (
                      <>
                        <Progress value={u.total > 0 ? (u.loaded / u.total) * 100 : 0} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round((u.loaded / u.total) * 100)}%</span>
                          <span>{formatETA(u.loaded, u.total, u.startTime)}</span>
                        </div>
                      </>
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
