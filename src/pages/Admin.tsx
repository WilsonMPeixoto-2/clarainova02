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
import { Upload, Trash2, FileText, Loader2, CheckCircle2, XCircle, ArrowLeft, LogOut, RefreshCw } from "lucide-react";
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

export default function Admin() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  // Polling + status change toasts
  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  // Detect status changes and show toasts
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
            // Calculate from created_at
            const elapsed = Math.floor((Date.now() - new Date(doc.created_at).getTime()) / 1000);
            next[doc.id] = elapsed;
          } else {
            next[doc.id] = prev[doc.id] + 1;
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        toast({ title: "Erro", description: `${file.name} não é um PDF`, variant: "destructive" });
        continue;
      }

      try {
        setUploadProgress(((i) / files.length) * 100);

        const filePath = `${crypto.randomUUID()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .insert({ name: file.name, file_path: filePath, status: "pending" })
          .select()
          .single();

        if (docErr) throw docErr;

        triggerProcessing((doc as unknown as Document).id);

        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (err) {
        console.error(err);
        toast({ title: "Erro no upload", description: `Falha ao enviar ${file.name}`, variant: "destructive" });
      }
    }

    setUploading(false);
    fetchDocuments();
    e.target.value = "";
    toast({ title: "Upload concluído", description: "Os documentos estão sendo processados." });
  };

  const triggerProcessing = (docId: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(
      `https://${projectId}.supabase.co/functions/v1/process-document`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ document_id: docId }),
      }
    ).catch(console.error);
  };

  const handleRetry = async (doc: Document) => {
    setRetryingId(doc.id);
    try {
      // Delete old chunks
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      // Reset status
      await supabase.from("documents").update({ status: "pending" }).eq("id", doc.id);
      // Re-trigger
      triggerProcessing(doc.id);
      toast({ title: "Reprocessando", description: `"${doc.name}" será processado novamente.` });
      fetchDocuments();
    } catch {
      toast({ title: "Erro ao reprocessar", variant: "destructive" });
    } finally {
      setRetryingId(null);
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

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "processing":
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const statusLabel = (doc: Document) => {
    const map: Record<string, string> = {
      pending: "Aguardando",
      processing: "Processando",
      processed: "Pronto",
      error: "Erro",
    };
    const label = map[doc.status] || doc.status;
    const timer = processingTimers[doc.id];
    if ((doc.status === "processing" || doc.status === "pending") && timer !== undefined) {
      return `${label}... ${formatTimer(timer)}`;
    }
    return label;
  };

  const canRetry = (status: string) => status === "error" || status === "processing";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => supabase.auth.signOut()}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              Upload de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground text-center">
                  Enviando documentos...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
                    <TableHead className="w-[180px]">Status</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-sm">
                          {statusIcon(doc.status)}
                          {statusLabel(doc)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canRetry(doc.status) && (
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
