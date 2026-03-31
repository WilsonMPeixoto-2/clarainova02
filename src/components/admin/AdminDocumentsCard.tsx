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
  const corpusSummary = documents.reduce<Record<string, number>>((acc, doc) => {
    const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
    if (metadata.corpusCategory) {
      acc[metadata.corpusCategory] = (acc[metadata.corpusCategory] || 0) + 1;
    }
    return acc;
  }, {});
  const groundingSummary = documents.reduce<Record<string, number>>((acc, doc) => {
    const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
    if (metadata.groundingStatus) {
      acc[metadata.groundingStatus] = (acc[metadata.groundingStatus] || 0) + 1;
    }
    return acc;
  }, {});

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
            serão permanentemente removidos. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[260px]">Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <p>{doc.name}</p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          {(() => {
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
                              pills.push(`Prioridade ${KNOWLEDGE_INGESTION_PRIORITY_LABELS[metadata.ingestionPriority as keyof typeof KNOWLEDGE_INGESTION_PRIORITY_LABELS].toLowerCase()}`);
                            }
                            if (typeof metadata.searchWeight === "number") {
                              pills.push(`Peso ${metadata.searchWeight.toFixed(2)}`);
                            }
                            pills.push(doc.is_active === false ? "Governanca inativa" : "Governanca ativa");

                            return pills.map((pill) => (
                              <span key={pill} className="rounded-full border border-border bg-muted/50 px-2 py-0.5">
                                {pill}
                              </span>
                            ));
                          })()}
                        </div>
                        {(() => {
                          const metadata = parseDocumentGovernanceMetadata(doc.metadata_json);
                          const groundingLabel = metadata.groundingStatus && metadata.groundingStatus in DOCUMENT_GROUNDING_STATUS_LABELS
                            ? DOCUMENT_GROUNDING_STATUS_LABELS[metadata.groundingStatus as keyof typeof DOCUMENT_GROUNDING_STATUS_LABELS]
                            : null;
                          const chunkHealth = typeof metadata.expectedChunks === "number"
                            ? `${metadata.embeddedChunks ?? 0}/${metadata.expectedChunks} embeddings`
                            : null;

                          return (
                            <div className="space-y-1">
                              {groundingLabel && (
                                <p className="text-xs text-muted-foreground">
                                  {groundingLabel}
                                  {chunkHealth ? ` · ${chunkHealth}` : ""}
                                </p>
                              )}
                              {metadata.readinessSummary && (
                                <p className="text-xs text-muted-foreground">{metadata.readinessSummary}</p>
                              )}
                            </div>
                          );
                        })()}
                        {doc.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{doc.summary}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`flex items-center gap-2 text-sm ${
                          isTimedOut(doc.id)
                            ? "text-yellow-600 dark:text-yellow-400 font-medium"
                            : doc.status === "error" || doc.status === "embedding_pending"
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
                            onClick={() => onRetry(doc)}
                            disabled={retryingId === doc.id}
                            className="h-7 text-xs"
                          >
                            <ArrowsClockwise className={`h-3 w-3 mr-1 ${retryingId === doc.id ? "animate-spin" : ""}`} />
                            Retomar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(doc)}
                            className="h-7 text-xs text-destructive"
                          >
                            <Trash className="h-3 w-3 mr-1" />
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
                            onClick={() => onCancel(doc)}
                            title="Cancelar processamento"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        {canRetry(doc) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRetry(doc)}
                            disabled={retryingId === doc.id}
                            title="Retomar"
                          >
                            <ArrowsClockwise className={`h-4 w-4 text-muted-foreground ${retryingId === doc.id ? "animate-spin" : ""}`} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(doc)}
                          title="Remover documento"
                          className={
                            doc.status === "error" || doc.status === "cancelled" || isTimedOut(doc.id)
                              ? "opacity-100"
                              : "opacity-60 hover:opacity-100"
                          }
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
