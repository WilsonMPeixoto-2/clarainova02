import { type ReactNode, useState } from "react";
import { ArrowsClockwise, Trash, X } from "@phosphor-icons/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  KNOWLEDGE_AUTHORITY_LEVEL_LABELS,
  KNOWLEDGE_CORPUS_CATEGORY_LABELS,
  KNOWLEDGE_DOCUMENT_KIND_LABELS,
  KNOWLEDGE_INGESTION_PRIORITY_LABELS,
  KNOWLEDGE_TOPIC_SCOPE_LABELS,
} from "@/lib/knowledge-document-classifier";
import {
  DOCUMENT_GROUNDING_STATUS_LABELS,
  parseDocumentGovernanceMetadata,
} from "@/lib/admin-governance";

import type { Document } from "./admin-types";

interface AdminDocumentsCardProps {
  documents: Document[];
  retryingId: string | null;
  isTimedOut: (docId: string) => boolean;
  canRetry: (doc: Document) => boolean;
  canCancel: (doc: Document) => boolean;
  statusIcon: (doc: Document) => ReactNode;
  statusLabel: (doc: Document) => string;
  onRetry: (doc: Document) => void;
  onCancel: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

function summarizeByKey(documents: Document[], key: "corpusCategory" | "groundingStatus") {
  return documents.reduce<Record<string, number>>((acc, doc) => {
    const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
    const value = key === "corpusCategory" ? metadata.corpusCategory : metadata.groundingStatus;

    if (value) {
      acc[value] = (acc[value] || 0) + 1;
    }

    return acc;
  }, {});
}

function getDocumentPills(doc: Document) {
  const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
  const pills: string[] = [];

  if (doc.topic_scope && doc.topic_scope in KNOWLEDGE_TOPIC_SCOPE_LABELS) {
    pills.push(KNOWLEDGE_TOPIC_SCOPE_LABELS[doc.topic_scope as keyof typeof KNOWLEDGE_TOPIC_SCOPE_LABELS]);
  }
  if (metadata.documentKind && metadata.documentKind in KNOWLEDGE_DOCUMENT_KIND_LABELS) {
    pills.push(KNOWLEDGE_DOCUMENT_KIND_LABELS[metadata.documentKind as keyof typeof KNOWLEDGE_DOCUMENT_KIND_LABELS]);
  }
  if (metadata.authorityLevel && metadata.authorityLevel in KNOWLEDGE_AUTHORITY_LEVEL_LABELS) {
    pills.push(KNOWLEDGE_AUTHORITY_LEVEL_LABELS[metadata.authorityLevel as keyof typeof KNOWLEDGE_AUTHORITY_LEVEL_LABELS]);
  }
  if (metadata.corpusCategory && metadata.corpusCategory in KNOWLEDGE_CORPUS_CATEGORY_LABELS) {
    pills.push(KNOWLEDGE_CORPUS_CATEGORY_LABELS[metadata.corpusCategory as keyof typeof KNOWLEDGE_CORPUS_CATEGORY_LABELS]);
  }
  if (metadata.ingestionPriority && metadata.ingestionPriority in KNOWLEDGE_INGESTION_PRIORITY_LABELS) {
    pills.push(
      `Prioridade ${KNOWLEDGE_INGESTION_PRIORITY_LABELS[metadata.ingestionPriority as keyof typeof KNOWLEDGE_INGESTION_PRIORITY_LABELS].toLowerCase()}`,
    );
  }
  if (typeof metadata.searchWeight === "number") {
    pills.push(`Peso ${metadata.searchWeight.toFixed(2)}`);
  }

  pills.push(doc.is_active === false ? "Governanca inativa" : "Governanca ativa");

  return pills;
}

function getChunkStatusLine(doc: Document) {
  const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
  if (typeof metadata.expectedChunks !== "number") {
    return null;
  }

  const savedChunks = metadata.savedChunks ?? 0;
  const embeddedChunks = metadata.embeddedChunks ?? 0;

  return `Chunks ${savedChunks}/${metadata.expectedChunks} · Embeddings ${embeddedChunks}/${metadata.expectedChunks}`;
}

function getGroundingLine(doc: Document) {
  const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
  if (!metadata.groundingStatus || !(metadata.groundingStatus in DOCUMENT_GROUNDING_STATUS_LABELS)) {
    return null;
  }

  const label = DOCUMENT_GROUNDING_STATUS_LABELS[
    metadata.groundingStatus as keyof typeof DOCUMENT_GROUNDING_STATUS_LABELS
  ];

  if (metadata.groundingEnabled === true) {
    return `${label} · elegivel para o chat`;
  }

  if (metadata.groundingEnabled === false) {
    return `${label} · ainda fora do grounding`;
  }

  return label;
}

function getStatusTone(doc: Document, timedOut: boolean) {
  if (timedOut) {
    return "text-yellow-600 dark:text-yellow-400 font-medium";
  }

  if (doc.status === "embedding_pending") {
    return "text-amber-600 dark:text-amber-400";
  }

  if (doc.status === "error") {
    return "text-destructive";
  }

  return "";
}

function getRetryLabel(doc: Document) {
  if (doc.status === "embedding_pending") {
    return "Concluir embeddings";
  }

  if (doc.status === "cancelled") {
    return "Processar de novo";
  }

  return "Retomar";
}

export default function AdminDocumentsCard({
  documents,
  retryingId,
  isTimedOut,
  canRetry,
  canCancel,
  statusIcon,
  statusLabel,
  onRetry,
  onCancel,
  onDelete,
}: AdminDocumentsCardProps) {
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const corpusSummary = summarizeByKey(documents, "corpusCategory");
  const groundingSummary = summarizeByKey(documents, "groundingStatus");

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> e todos os seus chunks
              serao permanentemente removidos. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Faixas do corpus</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {Object.entries(corpusSummary).map(([key, value]) => (
                      <span key={key} className="rounded-full border border-border bg-background px-2 py-0.5">
                        {KNOWLEDGE_CORPUS_CATEGORY_LABELS[key as keyof typeof KNOWLEDGE_CORPUS_CATEGORY_LABELS]}: {value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prontidao para grounding</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {Object.entries(groundingSummary).map(([key, value]) => (
                      <span key={key} className="rounded-full border border-border bg-background px-2 py-0.5">
                        {DOCUMENT_GROUNDING_STATUS_LABELS[key as keyof typeof DOCUMENT_GROUNDING_STATUS_LABELS]}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {documents.map((doc) => {
                  const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
                  const timedOut = isTimedOut(doc.id);

                  return (
                    <div key={doc.id} className="rounded-lg border border-border/80 bg-background p-4 space-y-3">
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 text-sm ${getStatusTone(doc, timedOut)}`}>
                          {statusIcon(doc)}
                          {statusLabel(doc)}
                        </div>
                        <p className="break-words text-sm font-medium text-foreground">{doc.name}</p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          {getDocumentPills(doc).map((pill) => (
                            <span key={pill} className="rounded-full border border-border bg-muted/50 px-2 py-0.5">
                              {pill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {getGroundingLine(doc) && <p>{getGroundingLine(doc)}</p>}
                        {getChunkStatusLine(doc) && <p>{getChunkStatusLine(doc)}</p>}
                        {metadata.readinessSummary && <p>{metadata.readinessSummary}</p>}
                        {doc.summary && <p className="line-clamp-3">{doc.summary}</p>}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        {canRetry(doc) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRetry(doc)}
                            disabled={retryingId === doc.id}
                            className="justify-center"
                          >
                            <ArrowsClockwise className={`mr-2 h-3.5 w-3.5 ${retryingId === doc.id ? "animate-spin" : ""}`} />
                            {getRetryLabel(doc)}
                          </Button>
                        )}
                        {canCancel(doc) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCancel(doc)}
                            className="justify-center"
                          >
                            <X className="mr-2 h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(doc)}
                          className="justify-center text-destructive"
                        >
                          <Trash className="mr-2 h-3.5 w-3.5" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead className="w-[320px]">Status e operacao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
                      const timedOut = isTimedOut(doc.id);

                      return (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            <div className="space-y-2">
                              <p className="break-words">{doc.name}</p>
                              <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                                {getDocumentPills(doc).map((pill) => (
                                  <span key={pill} className="rounded-full border border-border bg-muted/50 px-2 py-0.5">
                                    {pill}
                                  </span>
                                ))}
                              </div>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {getGroundingLine(doc) && <p>{getGroundingLine(doc)}</p>}
                                {getChunkStatusLine(doc) && <p>{getChunkStatusLine(doc)}</p>}
                                {metadata.readinessSummary && <p>{metadata.readinessSummary}</p>}
                                {doc.summary && <p className="line-clamp-2">{doc.summary}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <span className={`flex items-center gap-2 text-sm ${getStatusTone(doc, timedOut)}`}>
                                {statusIcon(doc)}
                                {statusLabel(doc)}
                              </span>

                              <div className="flex flex-wrap gap-2">
                                {canRetry(doc) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onRetry(doc)}
                                    disabled={retryingId === doc.id}
                                    className="h-8"
                                  >
                                    <ArrowsClockwise className={`mr-1.5 h-3.5 w-3.5 ${retryingId === doc.id ? "animate-spin" : ""}`} />
                                    {getRetryLabel(doc)}
                                  </Button>
                                )}
                                {canCancel(doc) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCancel(doc)}
                                    className="h-8"
                                  >
                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                    Cancelar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteTarget(doc)}
                                  className="h-8 text-destructive"
                                >
                                  <Trash className="mr-1.5 h-3.5 w-3.5" />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
