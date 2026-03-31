import type { ChangeEvent, ReactNode } from "react";
import { WarningCircle, Brain, FileText, ShieldCheck, Upload, X } from "@phosphor-icons/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  KNOWLEDGE_AUTHORITY_LEVEL_LABELS,
  KNOWLEDGE_AUTHORITY_LEVELS,
  KNOWLEDGE_CORPUS_LANES,
  KNOWLEDGE_CORPUS_CATEGORIES,
  KNOWLEDGE_CORPUS_CATEGORY_LABELS,
  KNOWLEDGE_DOCUMENT_KIND_LABELS,
  KNOWLEDGE_DOCUMENT_KINDS,
  KNOWLEDGE_INGESTION_PRIORITIES,
  KNOWLEDGE_INGESTION_PRIORITY_LABELS,
  KNOWLEDGE_TOPIC_SCOPE_LABELS,
  KNOWLEDGE_TOPIC_SCOPES,
} from "@/lib/knowledge-document-classifier";
import {
  KNOWLEDGE_SOURCE_TYPE_LABELS,
  type UploadGovernanceFormState,
  type KnowledgeSourceType,
} from "@/lib/admin-governance";

import type { IngestionState, IngestionStatus } from "./admin-types";

interface AdminUploadCardProps {
  ingestions: IngestionState[];
  isBusy: boolean;
  governanceForm: UploadGovernanceFormState;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onGovernanceChange: <K extends keyof UploadGovernanceFormState>(field: K, value: UploadGovernanceFormState[K]) => void;
  onGovernanceReset: () => void;
  onCancelIngestion: (fileName: string) => void;
}

function phaseColor(status: IngestionStatus) {
  switch (status) {
    case "done":
      return "text-primary";
    case "embedding_pending":
      return "text-amber-600 dark:text-amber-400";
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
    case "embedding_pending":
      return <WarningCircle className="inline h-3 w-3 mr-1" />;
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
  governanceForm,
  onUpload,
  onGovernanceChange,
  onGovernanceReset,
  onCancelIngestion,
}: AdminUploadCardProps) {
  const sourceTypes = Object.keys(KNOWLEDGE_SOURCE_TYPE_LABELS) as KnowledgeSourceType[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5" />
          Ingestao governada de documentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Perfil de governanca do proximo lote</p>
              <p className="text-xs text-muted-foreground">
                A classificacao principal pode ficar em modo automatico, mas a curadoria do corpus inicial deve ser decidida antes do upload.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onGovernanceReset} disabled={isBusy}>
              Restaurar padrao
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Escopo tematico</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.topicScope}
                onChange={(event) => onGovernanceChange("topicScope", event.target.value as UploadGovernanceFormState["topicScope"])}
                disabled={isBusy}
              >
                <option value="auto">Sugerir automaticamente</option>
                {KNOWLEDGE_TOPIC_SCOPES.map((option) => (
                  <option key={option} value={option}>{KNOWLEDGE_TOPIC_SCOPE_LABELS[option]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Tipo documental</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.documentKind}
                onChange={(event) => onGovernanceChange("documentKind", event.target.value as UploadGovernanceFormState["documentKind"])}
                disabled={isBusy}
              >
                <option value="auto">Sugerir automaticamente</option>
                {KNOWLEDGE_DOCUMENT_KINDS.map((option) => (
                  <option key={option} value={option}>{KNOWLEDGE_DOCUMENT_KIND_LABELS[option]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Nivel de autoridade</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.authorityLevel}
                onChange={(event) => onGovernanceChange("authorityLevel", event.target.value as UploadGovernanceFormState["authorityLevel"])}
                disabled={isBusy}
              >
                <option value="auto">Sugerir automaticamente</option>
                {KNOWLEDGE_AUTHORITY_LEVELS.map((option) => (
                  <option key={option} value={option}>{KNOWLEDGE_AUTHORITY_LEVEL_LABELS[option]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Peso de busca</span>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.01"
                placeholder="Automatico"
                value={governanceForm.searchWeight}
                onChange={(event) => onGovernanceChange("searchWeight", event.target.value)}
                disabled={isBusy}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Categoria do corpus</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.corpusCategory}
                onChange={(event) => onGovernanceChange("corpusCategory", event.target.value as UploadGovernanceFormState["corpusCategory"])}
                disabled={isBusy}
              >
                <option value="auto">Sugerir automaticamente</option>
                {KNOWLEDGE_CORPUS_CATEGORIES.map((option) => (
                  <option key={option} value={option}>{KNOWLEDGE_CORPUS_CATEGORY_LABELS[option]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Prioridade de ingestao</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.ingestionPriority}
                onChange={(event) => onGovernanceChange("ingestionPriority", event.target.value as UploadGovernanceFormState["ingestionPriority"])}
                disabled={isBusy}
              >
                <option value="auto">Sugerir automaticamente</option>
                {KNOWLEDGE_INGESTION_PRIORITIES.map((option) => (
                  <option key={option} value={option}>{KNOWLEDGE_INGESTION_PRIORITY_LABELS[option]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Origem institucional</span>
              <Input
                value={governanceForm.sourceName}
                onChange={(event) => onGovernanceChange("sourceName", event.target.value)}
                disabled={isBusy}
                placeholder="Ex.: SME Rio / Base documental CLARA"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Tipo de origem</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.sourceType}
                onChange={(event) => onGovernanceChange("sourceType", event.target.value as UploadGovernanceFormState["sourceType"])}
                disabled={isBusy}
              >
                {sourceTypes.map((option) => (
                  <option key={option} value={option}>{KNOWLEDGE_SOURCE_TYPE_LABELS[option]}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">URL de origem</span>
              <Input
                value={governanceForm.sourceUrl}
                onChange={(event) => onGovernanceChange("sourceUrl", event.target.value)}
                disabled={isBusy}
                placeholder="https://..."
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Versao ou referencia</span>
              <Input
                value={governanceForm.versionLabel}
                onChange={(event) => onGovernanceChange("versionLabel", event.target.value)}
                disabled={isBusy}
                placeholder="Ex.: v2026.03 / Portaria 123"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Publicado em</span>
              <Input
                type="date"
                value={governanceForm.publishedAt}
                onChange={(event) => onGovernanceChange("publishedAt", event.target.value)}
                disabled={isBusy}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Ultima revisao</span>
              <Input
                type="date"
                value={governanceForm.lastReviewedAt}
                onChange={(event) => onGovernanceChange("lastReviewedAt", event.target.value)}
                disabled={isBusy}
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Resumo operacional</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.summary}
                onChange={(event) => onGovernanceChange("summary", event.target.value)}
                disabled={isBusy}
                placeholder="Descreva em uma frase o papel desse documento no corpus."
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Notas de curadoria</span>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={governanceForm.governanceNotes}
                onChange={(event) => onGovernanceChange("governanceNotes", event.target.value)}
                disabled={isBusy}
                placeholder="Ex.: entra no nucleo oficial; usar antes de FAQs; revisar com unidade autora."
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border/80 bg-background/70 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={governanceForm.isActive}
              onChange={(event) => onGovernanceChange("isActive", event.target.checked)}
              disabled={isBusy}
            />
            <span>
              <strong className="block text-foreground">Disponibilizar no chat quando aplicavel</strong>
              <span className="text-xs text-muted-foreground">
                Materiais tecnicos da CLARA continuam sendo desativados automaticamente quando a classificacao principal ficar em modo automatico.
              </span>
            </span>
          </label>

          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Ordem recomendada do corpus inicial</p>
            <div className="grid gap-2 md:grid-cols-2">
              {KNOWLEDGE_CORPUS_LANES.map((lane) => (
                <div
                  key={lane.category}
                  className="rounded-md border border-border/70 bg-background/80 p-3"
                >
                  <p className="font-medium text-foreground">{lane.order}. {lane.title}</p>
                  <p className="mt-1">{lane.recommendedFirstLoad}</p>
                  <p className="mt-1">
                    Prioridade padrao: <strong>{lane.defaultPriority}</strong> · Peso sugerido: <strong>{lane.weightBandLabel}</strong>
                  </p>
                  <p className="mt-1">{lane.groundingRole}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 hover:bg-muted/50">
          <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Clique ou arraste PDFs aqui
          </span>
          <span className="text-xs text-muted-foreground">
            Apenas arquivos PDF — cada envio ja entra com governanca documental e prioridade de corpus
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

                {(isInProgress(ing.status) || ing.status === "done" || ing.status === "partial" || ing.status === "embedding_pending") && (
                  <Progress value={ing.status === "done" ? 100 : ing.progress} className="h-2" />
                )}

                {ing.expectedChunks > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Chunks salvos: {ing.insertedChunks}/{ing.expectedChunks}
                    {" · "}
                    Embeddings prontos: {ing.embeddedChunks}/{ing.expectedChunks}
                    {ing.failedEmbeddings > 0 && ` · pendentes: ${ing.failedEmbeddings}`}
                  </p>
                )}

                {ing.lastError && (
                  <p className="text-xs text-destructive mt-1">
                    {ing.lastError.message}
                    {ing.lastError.chunkIndex !== undefined && ` (chunk #${ing.lastError.chunkIndex})`}
                  </p>
                )}

                {ing.governanceSummary && (
                  <p className="text-xs text-muted-foreground">
                    {ing.governanceSummary}
                  </p>
                )}

                {ing.governanceDetail && (
                  <p className="text-[11px] text-muted-foreground/80">
                    {ing.governanceDetail}
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
