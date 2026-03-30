import type { ChangeEvent, ReactNode } from "react";
import { WarningCircle, Brain, FileText, ShieldCheck, Upload, X } from "@phosphor-icons/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import type { IngestionState, IngestionStatus } from "./admin-types";

interface AdminUploadCardProps {
  ingestions: IngestionState[];
  isBusy: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancelIngestion: (fileName: string) => void;
}

function phaseColor(status: IngestionStatus) {
  switch (status) {
    case "done":
      return "text-primary";
    case "failed":
      return "text-destructive";
    case "partial":
      return "text-yellow-600 dark:text-yellow-400";
    case "canceled":
      return "text-muted-foreground";
    case "verifying":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}

function phaseIcon(status: IngestionStatus): ReactNode {
  switch (status) {
    case "vectorizing":
      return <Brain className="inline h-3 w-3 mr-1" />;
    case "verifying":
      return <ShieldCheck className="inline h-3 w-3 mr-1" />;
    case "partial":
      return <WarningCircle className="inline h-3 w-3 mr-1" />;
    default:
      return null;
  }
}

function isInProgress(status: IngestionStatus) {
  return status === "vectorizing" || status === "extracting" || status === "verifying";
}

export default function AdminUploadCard({
  ingestions,
  isBusy,
  onUpload,
  onCancelIngestion,
}: AdminUploadCardProps) {
  return (
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
            Apenas arquivos PDF — motor pesado carregado sob demanda
          </span>
          <input
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={onUpload}
            disabled={isBusy}
          />
        </label>

        {ingestions.length > 0 && (
          <div className="space-y-3">
            {ingestions.map((ing) => (
              <div key={ing.fileName} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground truncate max-w-[60%]">
                    {ing.fileName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${phaseColor(ing.status)}`}>
                      {phaseIcon(ing.status)}
                      {ing.phaseLabel}
                    </span>
                    {isInProgress(ing.status) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onCancelIngestion(ing.fileName)}
                        title="Cancelar"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {(isInProgress(ing.status) || ing.status === "done" || ing.status === "partial") && (
                  <Progress value={ing.status === "done" ? 100 : ing.progress} className="h-2" />
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
  );
}
