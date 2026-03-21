import type { ReactNode } from "react";
import { RefreshCw, Trash2, X } from "lucide-react";

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
  return (
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
                          onClick={() => onRetry(doc)}
                          disabled={retryingId === doc.id}
                          className="h-7 text-xs"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${retryingId === doc.id ? "animate-spin" : ""}`} />
                          Retomar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(doc)}
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
                          <RefreshCw className={`h-4 w-4 text-muted-foreground ${retryingId === doc.id ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(doc)}
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
  );
}
