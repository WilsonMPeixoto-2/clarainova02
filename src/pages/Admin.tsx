import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Warning, CheckCircle, CircleNotch, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminUploadCard from "@/components/admin/AdminUploadCard";
import {
  ADMIN_UPLOAD_MAX_SIZE_BYTES,
  ADMIN_UPLOAD_MAX_SIZE_MB,
  type Document,
  type IngestionState,
  type IngestionStatus,
} from "@/components/admin/admin-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabaseConfig, SUPABASE_UNAVAILABLE_MESSAGE, supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_UPLOAD_GOVERNANCE_FORM,
  getKnowledgeCorpusLane,
  resolveDocumentOperationalState,
  resolveUploadGovernance,
  type UploadGovernanceFormState,
} from "@/lib/admin-governance";
import {
  KNOWLEDGE_CORPUS_CATEGORY_LABELS,
  KNOWLEDGE_DOCUMENT_KIND_LABELS,
  KNOWLEDGE_INGESTION_PRIORITY_LABELS,
  KNOWLEDGE_TOPIC_SCOPE_LABELS,
} from "@/lib/knowledge-document-classifier";
import { computeBlobHash, type PreparedChunk, type PreparedPdfIngestion } from "@/lib/admin-ingestion";
import { sanitizeFileName } from "@/lib/file-utils";

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
  batch: PreparedChunk[],
  startIndex: number,
  title: string,
  signal?: AbortSignal,
): Promise<{ saved: number; embedded: number; failedEmbeddings: number; requestId?: string }> {
  return withRetry(async () => {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke("embed-chunks", {
      body: { document_id: documentId, chunks: batch, start_index: startIndex, title },
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

    const saved = fnData?.saved || batch.length;
    const failedEmbeddings = Math.max(0, fnData?.failed_embeddings || 0);
    return {
      saved,
      embedded: Math.max(saved - failedEmbeddings, 0),
      failedEmbeddings,
      requestId: fnData?.request_id,
    };
  }, { retries: 3, signal });
}

function countExpectedChunkIndexes(indexes: Iterable<number>, expectedChunkCount: number): number {
  const expectedIndexes = new Set<number>();

  for (let index = 0; index < expectedChunkCount; index++) {
    expectedIndexes.add(index);
  }

  let matched = 0;
  for (const index of indexes) {
    if (expectedIndexes.has(index)) {
      matched += 1;
    }
  }

  return matched;
}

function hasAllExpectedChunkIndexes(indexes: Set<number>, expectedChunkCount: number): boolean {
  return countExpectedChunkIndexes(indexes, expectedChunkCount) === expectedChunkCount;
}

interface DocumentChunkHealth {
  savedCount: number;
  embeddedCount: number;
  savedIndexes: Set<number>;
  embeddedIndexes: Set<number>;
}

async function inspectDocumentChunks(documentId: string, expectedChunkCount: number): Promise<DocumentChunkHealth> {
  const { data } = await supabase
    .from("document_chunks")
    .select("chunk_index, embedding")
    .eq("document_id", documentId);

  const rows = (data || []) as Array<{ chunk_index: number; embedding: string | null }>;
  const savedIndexes = new Set(rows.map((row) => row.chunk_index));
  const embeddedIndexes = new Set(
    rows
      .filter((row) => Boolean(row.embedding))
      .map((row) => row.chunk_index),
  );

  return {
    savedCount: countExpectedChunkIndexes(savedIndexes, expectedChunkCount),
    embeddedCount: countExpectedChunkIndexes(embeddedIndexes, expectedChunkCount),
    savedIndexes,
    embeddedIndexes,
  };
}

function normalizeMetadataRecord(metadata: Document["metadata_json"]): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? { ...metadata }
    : {};
}

function isDuplicateDocumentHashError(error: { code?: string; message?: string; details?: string } | null | undefined) {
  if (!error) return false;
  if (error.code !== "23505") return false;

  const haystack = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return haystack.includes("document_hash");
}

function describeDuplicateDocument(
  fileName: string,
  duplicateDocument: { name?: string | null; status?: string | null } | null,
) {
  const duplicateName = duplicateDocument?.name?.trim() || fileName;
  const duplicateStatus = duplicateDocument?.status?.trim();

  if (!duplicateStatus) {
    return `"${duplicateName}" já está cadastrado na base documental da CLARA.`;
  }

  return `"${duplicateName}" já está cadastrado na base documental da CLARA com status ${duplicateStatus}.`;
}

interface DuplicateDocumentCandidate {
  id: string;
  name?: string | null;
  status?: string | null;
  file_path?: string | null;
  storage_path?: string | null;
  page_count?: number | null;
  text_char_count?: number | null;
}

async function findLegacyDuplicateDocument(
  fileName: string,
  prepared: PreparedPdfIngestion,
): Promise<DuplicateDocumentCandidate | null> {
  const { data: candidates, error } = await supabase
    .from("documents")
    .select("id, name, status, file_path, storage_path, page_count, text_char_count")
    .eq("file_name", fileName)
    .is("document_hash", null)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Falha ao verificar documentos legados: ${error.message}`);
  }

  const sortedCandidates = ((candidates ?? []) as DuplicateDocumentCandidate[]).sort((left, right) => {
    const leftScore = Number(left.page_count === prepared.pages.length) + Number(left.text_char_count === prepared.fullText.length);
    const rightScore = Number(right.page_count === prepared.pages.length) + Number(right.text_char_count === prepared.fullText.length);
    return rightScore - leftScore;
  });

  for (const candidate of sortedCandidates) {
    const candidateStoragePath = candidate.storage_path ?? candidate.file_path;
    if (!candidateStoragePath) continue;

    const { data: storedBlob, error: downloadError } = await supabase.storage
      .from("documents")
      .download(candidateStoragePath);

    if (downloadError || !storedBlob) {
      console.warn("Legacy duplicate download failed:", downloadError?.message ?? candidateStoragePath);
      continue;
    }

    const remoteHash = await computeBlobHash(storedBlob);
    if (remoteHash !== prepared.documentHash) {
      continue;
    }

    const { error: backfillError } = await supabase
      .from("documents")
      .update({
        document_hash: prepared.documentHash,
        page_count: candidate.page_count ?? prepared.pages.length,
        text_char_count: candidate.text_char_count ?? prepared.fullText.length,
      })
      .eq("id", candidate.id);

    if (backfillError) {
      throw new Error(`Falha ao reconciliar hash de documento legado: ${backfillError.message}`);
    }

    return candidate;
  }

  return null;
}

function isExcludedFromGrounding(input: {
  corpusCategory: string;
  topicScope: string;
  documentKind: string;
  authorityLevel: string;
  searchWeight: number;
}) {
  return (
    input.corpusCategory === "interno_excluido" ||
    input.topicScope === "clara_internal" ||
    input.documentKind === "internal_technical" ||
    input.authorityLevel === "internal" ||
    input.searchWeight <= 0
  );
}

function buildOperationalMetadata(input: {
  metadata: Record<string, unknown>;
  expectedChunks: number;
  chunkHealth: DocumentChunkHealth;
  operationalState: ReturnType<typeof resolveDocumentOperationalState>;
  governanceActivationRequested: boolean;
  requestIds?: string[];
}) {
  const missingEmbeddings = Math.max(input.expectedChunks - input.chunkHealth.embeddedCount, 0);

  return {
    ...input.metadata,
    expected_chunks: input.expectedChunks,
    saved_chunks: input.chunkHealth.savedCount,
    embedded_chunks: input.chunkHealth.embeddedCount,
    missing_embeddings: missingEmbeddings,
    grounding_status: input.operationalState.groundingStatus,
    grounding_enabled: input.operationalState.groundingEnabled,
    governance_activation_requested: input.governanceActivationRequested,
    readiness_summary: input.operationalState.readinessSummary,
    last_embedding_attempt_at: input.requestIds && input.requestIds.length > 0 ? new Date().toISOString() : input.metadata.last_embedding_attempt_at ?? null,
    last_embedding_request_ids: input.requestIds && input.requestIds.length > 0 ? input.requestIds : input.metadata.last_embedding_request_ids ?? [],
  };
}

export default function Admin() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ingestions, setIngestions] = useState<IngestionState[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [processingTimers, setProcessingTimers] = useState<Record<string, number>>({});
  const [uploadGovernance, setUploadGovernance] = useState<UploadGovernanceFormState>(DEFAULT_UPLOAD_GOVERNANCE_FORM);
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
        } else if (doc.status === "embedding_pending") {
          toast.warning("Embeddings pendentes", {
            description: `"${doc.name}" foi salvo, mas ainda nao esta pronto para grounding.`,
          });
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

  const updateUploadGovernance = useCallback(function updateUploadGovernance<K extends keyof UploadGovernanceFormState>(
    field: K,
    value: UploadGovernanceFormState[K],
  ) {
    setUploadGovernance((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetUploadGovernance = useCallback(() => {
    setUploadGovernance(DEFAULT_UPLOAD_GOVERNANCE_FORM);
  }, []);

  const describeGovernanceSummary = useCallback((resolved: ReturnType<typeof resolveUploadGovernance>) => {
    const scopeLabel = KNOWLEDGE_TOPIC_SCOPE_LABELS[resolved.topicScope];
    const kindLabel = KNOWLEDGE_DOCUMENT_KIND_LABELS[resolved.documentKind];
    const priorityLabel = KNOWLEDGE_INGESTION_PRIORITY_LABELS[resolved.ingestionPriority];
    const corpusLabel = KNOWLEDGE_CORPUS_CATEGORY_LABELS[resolved.corpusCategory];

    return `${scopeLabel} • ${kindLabel} • prioridade ${priorityLabel.toLowerCase()} • ${corpusLabel.toLowerCase()}`;
  }, []);

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
    chunks: PreparedChunk[],
    fileName: string,
    abortSignal: AbortSignal,
    existingChunkHealth?: DocumentChunkHealth,
  ): Promise<{
    savedChunks: number;
    embeddedChunks: number;
    failedEmbeddings: number;
    requestIds: string[];
    status: IngestionStatus;
  }> => {
    const totalChunks = chunks.length;
    const embeddedIndexes = existingChunkHealth?.embeddedIndexes ?? new Set<number>();
    const chunksToSend: { chunk: PreparedChunk; index: number }[] = [];

    for (let index = 0; index < chunks.length; index++) {
      if (!embeddedIndexes.has(index)) {
        chunksToSend.push({ chunk: chunks[index], index });
      }
    }

    if (chunksToSend.length === 0) {
      const chunkHealth = existingChunkHealth ?? await inspectDocumentChunks(documentId, totalChunks);
      const failedEmbeddings = Math.max(chunkHealth.savedCount - chunkHealth.embeddedCount, 0);

      return {
        savedChunks: chunkHealth.savedCount,
        embeddedChunks: chunkHealth.embeddedCount,
        failedEmbeddings,
        requestIds: [],
        status: chunkHealth.embeddedCount >= totalChunks
          ? "done"
          : chunkHealth.savedCount >= totalChunks
            ? "embedding_pending"
            : chunkHealth.savedCount > 0
              ? "partial"
              : "failed",
      };
    }

    let processedCount = existingChunkHealth?.embeddedCount ?? 0;
    const requestIds: string[] = [];

    updateIngestion(fileName, {
      status: "vectorizing",
      expectedChunks: totalChunks,
      processedChunks: processedCount,
      embeddedChunks: processedCount,
      insertedChunks: existingChunkHealth?.savedCount ?? 0,
      failedEmbeddings: Math.max((existingChunkHealth?.savedCount ?? 0) - processedCount, 0),
      phaseLabel: `Vetorizando... ${processedCount}/${totalChunks}`,
      progress: 30 + Math.round((processedCount / totalChunks) * 60),
    });

    for (let index = 0; index < chunksToSend.length; index += EMBED_BATCH_SIZE) {
      if (abortSignal.aborted) {
        const failedEmbeddings = Math.max((existingChunkHealth?.savedCount ?? 0) - processedCount, 0);
        return {
          savedChunks: existingChunkHealth?.savedCount ?? 0,
          embeddedChunks: processedCount,
          failedEmbeddings,
          requestIds,
          status: "canceled",
        };
      }

      const batchItems = chunksToSend.slice(index, index + EMBED_BATCH_SIZE);
      const batchChunks = batchItems.map((item) => item.chunk);
      const batchStartIndex = batchItems[0].index;

      try {
        const result = await embedBatchWithRetry(documentId, batchChunks, batchStartIndex, fileName, abortSignal);
        if (result.requestId) {
          requestIds.push(result.requestId);
        }
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
        embeddedChunks: processedCount,
        progress: embeddingProgress,
        phaseLabel: `Vetorizando... ${processedCount}/${totalChunks}`,
      });
    }

    updateIngestion(fileName, {
      status: "verifying",
      phaseLabel: "Verificando integridade...",
      progress: 92,
    });

    const chunkHealth = await inspectDocumentChunks(documentId, totalChunks);
    const failedEmbeddings = Math.max(chunkHealth.savedCount - chunkHealth.embeddedCount, 0);
    updateIngestion(fileName, {
      insertedChunks: chunkHealth.savedCount,
      embeddedChunks: chunkHealth.embeddedCount,
      failedEmbeddings,
    });

    if (chunkHealth.embeddedCount >= totalChunks) {
      return {
        savedChunks: chunkHealth.savedCount,
        embeddedChunks: chunkHealth.embeddedCount,
        failedEmbeddings,
        requestIds,
        status: "done",
      };
    }
    if (chunkHealth.savedCount >= totalChunks) {
      return {
        savedChunks: chunkHealth.savedCount,
        embeddedChunks: chunkHealth.embeddedCount,
        failedEmbeddings,
        requestIds,
        status: "embedding_pending",
      };
    }
    if (chunkHealth.savedCount > 0) {
      return {
        savedChunks: chunkHealth.savedCount,
        embeddedChunks: chunkHealth.embeddedCount,
        failedEmbeddings,
        requestIds,
        status: "partial",
      };
    }

    return {
      savedChunks: chunkHealth.savedCount,
      embeddedChunks: chunkHealth.embeddedCount,
      failedEmbeddings,
      requestIds,
      status: "failed",
    };
  };

  const processFileClientSide = async (file: File, governanceForm: UploadGovernanceFormState) => {
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
      embeddedChunks: 0,
      failedEmbeddings: 0,
      abortController,
    };

    setIngestions((prev) => [...prev, ingestion]);

    try {
      const prepared = await preparePdfPayload(file, file.name);
      const resolvedGovernance = resolveUploadGovernance(file.name, prepared.fullText, governanceForm);

      updateIngestion(file.name, {
        governanceSummary: describeGovernanceSummary(resolvedGovernance),
        governanceDetail: resolvedGovernance.governanceReason,
        phaseLabel: `Governança definida — ${KNOWLEDGE_DOCUMENT_KIND_LABELS[resolvedGovernance.documentKind]}`,
        progress: 32,
      });

      const { data: duplicateDocument, error: duplicateLookupError } = await supabase
        .from("documents")
        .select("id, name, status")
        .eq("document_hash", prepared.documentHash)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (duplicateLookupError) {
        throw new Error(`Falha ao verificar duplicidade: ${duplicateLookupError.message}`);
      }

      if (duplicateDocument) {
        const duplicateMessage = describeDuplicateDocument(file.name, duplicateDocument);
        updateIngestion(file.name, {
          status: "failed",
          phaseLabel: "Documento já cadastrado",
          progress: 100,
          lastError: {
            code: "DUPLICATE_DOCUMENT",
            message: duplicateMessage,
          },
        });
        toast.warning("Documento já ingerido", {
          description: duplicateMessage,
        });
        return;
      }

      const legacyDuplicateDocument = await findLegacyDuplicateDocument(file.name, prepared);
      if (legacyDuplicateDocument) {
        const duplicateMessage = describeDuplicateDocument(file.name, legacyDuplicateDocument);
        updateIngestion(file.name, {
          status: "failed",
          phaseLabel: "Documento já cadastrado",
          progress: 100,
          lastError: {
            code: "DUPLICATE_DOCUMENT",
            message: duplicateMessage,
          },
        });
        toast.warning("Documento já ingerido", {
          description: duplicateMessage,
        });
        return;
      }

      if (abortController.signal.aborted) return;

      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${crypto.randomUUID()}_${sanitizedName}`;
      const corpusLane = getKnowledgeCorpusLane(resolvedGovernance.corpusCategory);
      const excludedFromGrounding = isExcludedFromGrounding({
        corpusCategory: resolvedGovernance.corpusCategory,
        topicScope: resolvedGovernance.topicScope,
        documentKind: resolvedGovernance.documentKind,
        authorityLevel: resolvedGovernance.authorityLevel,
        searchWeight: resolvedGovernance.searchWeight,
      });
      const initialOperationalState = resolveDocumentOperationalState({
        expectedChunks: prepared.chunks.length,
        savedChunks: 0,
        embeddedChunks: 0,
        governanceActive: resolvedGovernance.isActive,
        excludedFromGrounding,
      });
      const governanceMetadata: Record<string, unknown> = {
        document_kind: resolvedGovernance.documentKind,
        authority_level: resolvedGovernance.authorityLevel,
        search_weight: resolvedGovernance.searchWeight,
        corpus_category: resolvedGovernance.corpusCategory,
        ingestion_priority: resolvedGovernance.ingestionPriority,
        governance_notes: resolvedGovernance.governanceNotes,
        governance_reason: resolvedGovernance.governanceReason,
        classifier_warning: resolvedGovernance.classification.warning,
        classifier_tags: resolvedGovernance.classification.tags,
        classifier_scores: {
          technical: resolvedGovernance.classification.technicalScore,
          procedural: resolvedGovernance.classification.proceduralScore,
          official: resolvedGovernance.classification.officialScore,
          faq: resolvedGovernance.classification.faqScore,
          guide: resolvedGovernance.classification.guideScore,
          normative: resolvedGovernance.classification.normativeScore,
          manual: resolvedGovernance.classification.manualScore,
        },
        corpus_lane_order: corpusLane?.order ?? null,
        corpus_lane_title: corpusLane?.title ?? null,
      };
      const initialMetadata = buildOperationalMetadata({
        metadata: governanceMetadata,
        expectedChunks: prepared.chunks.length,
        chunkHealth: {
          savedCount: 0,
          embeddedCount: 0,
          savedIndexes: new Set<number>(),
          embeddedIndexes: new Set<number>(),
        },
        operationalState: initialOperationalState,
        governanceActivationRequested: resolvedGovernance.isActive,
      });

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: false });

      if (uploadErr) throw new Error(`Upload falhou: ${uploadErr.message}`);

      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .insert({
          name: file.name,
          file_path: filePath,
          file_name: file.name,
          mime_type: file.type || "application/pdf",
          storage_path: filePath,
          status: "processing",
          is_active: resolvedGovernance.isActive,
          language_code: "pt-BR",
          jurisdiction_scope: "municipal_rj",
          topic_scope: resolvedGovernance.topicScope,
          source_type: resolvedGovernance.sourceType,
          source_name: resolvedGovernance.sourceName,
          source_url: resolvedGovernance.sourceUrl,
          summary: resolvedGovernance.summary,
          version_label: resolvedGovernance.versionLabel,
          published_at: resolvedGovernance.publishedAt,
          last_reviewed_at: resolvedGovernance.lastReviewedAt,
          document_hash: prepared.documentHash,
          page_count: prepared.pages.length,
          text_char_count: prepared.fullText.length,
          metadata_json: initialMetadata,
        })
        .select()
        .single();

      if (docErr || !doc) {
        if (isDuplicateDocumentHashError(docErr)) {
          await supabase.storage.from("documents").remove([filePath]);

          const { data: duplicateAfterUpload } = await supabase
            .from("documents")
            .select("id, name, status")
            .eq("document_hash", prepared.documentHash)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const duplicateMessage = describeDuplicateDocument(file.name, duplicateAfterUpload);
          updateIngestion(file.name, {
            status: "failed",
            phaseLabel: "Documento já cadastrado",
            progress: 100,
            lastError: {
              code: "DUPLICATE_DOCUMENT",
              message: duplicateMessage,
            },
          });
          toast.warning("Documento já ingerido", {
            description: duplicateMessage,
          });
          return;
        }

        throw new Error("Falha ao registrar documento");
      }
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
        updateIngestion(file.name, { status: "canceled", phaseLabel: "Processamento cancelado" });
        return;
      }

      const chunkHealth = await inspectDocumentChunks(documentId, prepared.chunks.length);
      const operationalState = resolveDocumentOperationalState({
        expectedChunks: prepared.chunks.length,
        savedChunks: chunkHealth.savedCount,
        embeddedChunks: chunkHealth.embeddedCount,
        governanceActive: resolvedGovernance.isActive,
        excludedFromGrounding,
      });
      const finalMetadata = buildOperationalMetadata({
        metadata: governanceMetadata,
        expectedChunks: prepared.chunks.length,
        chunkHealth,
        operationalState,
        governanceActivationRequested: resolvedGovernance.isActive,
        requestIds: result.requestIds,
      });

      if (result.status === "done") {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: new Date().toISOString(),
          failed_at: null,
          failure_reason: operationalState.failureReason,
          metadata_json: finalMetadata,
        }).eq("id", documentId);
        await supabase.from("usage_logs").insert({
          event_type: "client_side_ingestion",
          metadata: {
            document_id: documentId,
            chunks_count: prepared.chunks.length,
            text_length: prepared.fullText.length,
            topic_scope: resolvedGovernance.topicScope,
            document_kind: resolvedGovernance.documentKind,
            authority_level: resolvedGovernance.authorityLevel,
            corpus_category: resolvedGovernance.corpusCategory,
            ingestion_priority: resolvedGovernance.ingestionPriority,
          },
        });
        updateIngestion(file.name, {
          status: "done",
          insertedChunks: chunkHealth.savedCount,
          embeddedChunks: chunkHealth.embeddedCount,
          failedEmbeddings: result.failedEmbeddings,
          phaseLabel: `✓ Pronto — ${chunkHealth.embeddedCount}/${prepared.chunks.length} embeddings`,
          progress: 100,
        });
        toast.success("Documento processado", {
          description: `"${file.name}" — ${chunkHealth.embeddedCount}/${prepared.chunks.length} embeddings prontos com governança documental.`,
        });
      } else if (result.status === "embedding_pending") {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: null,
          failed_at: new Date().toISOString(),
          failure_reason: operationalState.failureReason,
          metadata_json: finalMetadata,
        }).eq("id", documentId);
        updateIngestion(file.name, {
          status: "embedding_pending",
          insertedChunks: chunkHealth.savedCount,
          embeddedChunks: chunkHealth.embeddedCount,
          failedEmbeddings: result.failedEmbeddings,
          phaseLabel: `⚠ Embeddings pendentes — ${chunkHealth.embeddedCount}/${prepared.chunks.length}`,
          progress: Math.max(92, Math.round((chunkHealth.embeddedCount / prepared.chunks.length) * 100)),
        });
        toast.warning("Documento salvo com embeddings pendentes", {
          description: `"${file.name}" — ${chunkHealth.savedCount} chunks salvos, ${chunkHealth.embeddedCount}/${prepared.chunks.length} embeddings prontos. Use Retomar.`,
        });
      } else if (result.status === "partial") {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: null,
          failed_at: new Date().toISOString(),
          failure_reason: operationalState.failureReason,
          metadata_json: finalMetadata,
        }).eq("id", documentId);
        updateIngestion(file.name, {
          status: "partial",
          insertedChunks: chunkHealth.savedCount,
          embeddedChunks: chunkHealth.embeddedCount,
          failedEmbeddings: result.failedEmbeddings,
          phaseLabel: `⚠ Parcial — ${chunkHealth.savedCount}/${prepared.chunks.length} chunks salvos`,
          progress: Math.round((chunkHealth.savedCount / prepared.chunks.length) * 100),
        });
        toast.error("Processamento parcial", {
          description: `"${file.name}" — ${chunkHealth.savedCount}/${prepared.chunks.length} chunks salvos. Use Retomar.`,
        });
      } else {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: null,
          failed_at: new Date().toISOString(),
          failure_reason: operationalState.failureReason,
          metadata_json: finalMetadata,
        }).eq("id", documentId);
        updateIngestion(file.name, {
          status: "failed",
          insertedChunks: chunkHealth.savedCount,
          embeddedChunks: chunkHealth.embeddedCount,
          failedEmbeddings: result.failedEmbeddings,
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
        toast.error("Envio recusado", {
          description: `${file.name} nao esta em PDF. O painel aceita apenas PDFs com texto extraivel.`,
        });
        continue;
      }
      if (file.size > ADMIN_UPLOAD_MAX_SIZE_BYTES) {
        toast.error("Arquivo acima do limite", {
          description: `${file.name} excede o limite operacional de ${ADMIN_UPLOAD_MAX_SIZE_MB} MB por arquivo.`,
        });
        continue;
      }
      await processFileClientSide(file, uploadGovernance);
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
          ? { ...item, status: "canceled" as IngestionStatus, phaseLabel: "Processamento cancelado" }
          : item
      ));
    });
  };

  const handleRetry = async (doc: Document) => {
    setRetryingId(doc.id);

    try {
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
        embeddedChunks: 0,
        failedEmbeddings: 0,
        abortController,
      };

      setIngestions((prev) => [...prev.filter((item) => item.fileName !== doc.name), ingestion]);

      const prepared = await preparePdfPayload(file, doc.name);
      if (doc.document_hash !== prepared.documentHash) {
        await supabase
          .from("documents")
          .update({ document_hash: prepared.documentHash })
          .eq("id", doc.id);
      }
      const metadata = normalizeMetadataRecord(doc.metadata_json);
      const searchWeight = typeof metadata.search_weight === "number" ? metadata.search_weight : 1;
      const corpusCategory = typeof metadata.corpus_category === "string" ? metadata.corpus_category : "apoio_complementar";
      const topicScope = typeof doc.topic_scope === "string" ? doc.topic_scope : "material_apoio";
      const documentKind = typeof metadata.document_kind === "string" ? metadata.document_kind : "apoio";
      const authorityLevel = typeof metadata.authority_level === "string" ? metadata.authority_level : "supporting";
      const governanceActive = doc.is_active !== false;
      const excludedFromGrounding = isExcludedFromGrounding({
        corpusCategory,
        topicScope,
        documentKind,
        authorityLevel,
        searchWeight,
      });
      const existingChunkHealth = await inspectDocumentChunks(doc.id, prepared.chunks.length);

      updateIngestion(doc.name, {
        insertedChunks: existingChunkHealth.savedCount,
        embeddedChunks: existingChunkHealth.embeddedCount,
        failedEmbeddings: Math.max(existingChunkHealth.savedCount - existingChunkHealth.embeddedCount, 0),
      });

      if (hasAllExpectedChunkIndexes(existingChunkHealth.embeddedIndexes, prepared.chunks.length)) {
        const operationalState = resolveDocumentOperationalState({
          expectedChunks: prepared.chunks.length,
          savedChunks: existingChunkHealth.savedCount,
          embeddedChunks: existingChunkHealth.embeddedCount,
          governanceActive,
          excludedFromGrounding,
        });
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: new Date().toISOString(),
          failed_at: null,
          failure_reason: operationalState.failureReason,
          metadata_json: buildOperationalMetadata({
            metadata,
            expectedChunks: prepared.chunks.length,
            chunkHealth: existingChunkHealth,
            operationalState,
            governanceActivationRequested: governanceActive,
          }),
        }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "done",
          insertedChunks: existingChunkHealth.savedCount,
          embeddedChunks: existingChunkHealth.embeddedCount,
          failedEmbeddings: 0,
          progress: 100,
          phaseLabel: `✓ ${prepared.chunks.length} embeddings prontos (ja existiam)`,
        });
        toast.success("Já completo", {
          description: `"${doc.name}" — todos os embeddings ja existiam.`,
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
        existingChunkHealth,
      );

      const finalChunkHealth = await inspectDocumentChunks(doc.id, prepared.chunks.length);
      const operationalState = resolveDocumentOperationalState({
        expectedChunks: prepared.chunks.length,
        savedChunks: finalChunkHealth.savedCount,
        embeddedChunks: finalChunkHealth.embeddedCount,
        governanceActive,
        excludedFromGrounding,
      });
      const nextMetadata = buildOperationalMetadata({
        metadata,
        expectedChunks: prepared.chunks.length,
        chunkHealth: finalChunkHealth,
        operationalState,
        governanceActivationRequested: governanceActive,
        requestIds: result.requestIds,
      });

      if (result.status === "done") {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: new Date().toISOString(),
          failed_at: null,
          failure_reason: operationalState.failureReason,
          metadata_json: nextMetadata,
        }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "done",
          insertedChunks: finalChunkHealth.savedCount,
          embeddedChunks: finalChunkHealth.embeddedCount,
          failedEmbeddings: 0,
          progress: 100,
          phaseLabel: `✓ ${prepared.chunks.length} embeddings prontos`,
        });
        toast.success("Reprocessado", { description: `"${doc.name}" pronto.` });
      } else if (result.status === "embedding_pending") {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: null,
          failed_at: new Date().toISOString(),
          failure_reason: operationalState.failureReason,
          metadata_json: nextMetadata,
        }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "embedding_pending",
          insertedChunks: finalChunkHealth.savedCount,
          embeddedChunks: finalChunkHealth.embeddedCount,
          failedEmbeddings: result.failedEmbeddings,
          phaseLabel: `⚠ Embeddings pendentes — ${finalChunkHealth.embeddedCount}/${prepared.chunks.length}`,
          progress: Math.max(92, Math.round((finalChunkHealth.embeddedCount / prepared.chunks.length) * 100)),
        });
        toast.warning("Embeddings ainda pendentes", {
          description: `"${doc.name}" — ${finalChunkHealth.embeddedCount}/${prepared.chunks.length} embeddings prontos.`,
        });
      } else if (result.status === "partial") {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: null,
          failed_at: new Date().toISOString(),
          failure_reason: operationalState.failureReason,
          metadata_json: nextMetadata,
        }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "partial",
          insertedChunks: finalChunkHealth.savedCount,
          embeddedChunks: finalChunkHealth.embeddedCount,
          failedEmbeddings: result.failedEmbeddings,
          phaseLabel: `⚠ ${finalChunkHealth.savedCount}/${prepared.chunks.length} chunks salvos — Retome novamente`,
        });
        toast.error("Parcial", {
          description: `"${doc.name}" — ${finalChunkHealth.savedCount}/${prepared.chunks.length}. Retome.`,
        });
      } else {
        await supabase.from("documents").update({
          status: operationalState.status,
          processed_at: null,
          failed_at: new Date().toISOString(),
          failure_reason: operationalState.failureReason,
          metadata_json: nextMetadata,
        }).eq("id", doc.id);
        updateIngestion(doc.name, {
          status: "failed",
          insertedChunks: finalChunkHealth.savedCount,
          embeddedChunks: finalChunkHealth.embeddedCount,
          failedEmbeddings: result.failedEmbeddings,
          phaseLabel: "Falha no reprocessamento",
        });
        toast.error("Falha", { description: "Reprocessamento falhou." });
      }

      fetchDocuments();

      setTimeout(() => {
        setIngestions((prev) => prev.filter((ingestionItem) => ingestionItem.fileName !== doc.name));
      }, 5000);
    } catch (err: unknown) {
      toast.error("Erro ao reprocessar", {
        description: err instanceof Error ? err.message : "Nao foi possivel retomar este documento agora.",
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
      toast.success("Processamento cancelado", { description: `"${doc.name}" saiu da fila administrativa.` });
    } catch {
      toast.error("Nao foi possivel cancelar", {
        description: "Tente novamente em instantes.",
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.storage.from("documents").remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id", doc.id);
      fetchDocuments();
      toast.success("Documento removido", {
        description: `"${doc.name}" foi excluido do painel e do storage.`,
      });
    } catch {
      toast.error("Nao foi possivel remover o documento", {
        description: "Verifique a conexao com o Supabase e tente novamente.",
      });
    }
  };

  const isTimedOut = (docId: string) => {
    const timer = processingTimers[docId];
    return timer !== undefined && timer >= TIMEOUT_SECONDS;
  };

  const statusIcon = (doc: Document) => {
    if (isTimedOut(doc.id)) return <Warning className="h-4 w-4 text-yellow-500" />;

    switch (doc.status) {
      case "processed":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "embedding_pending":
        return <Warning className="h-4 w-4 text-yellow-500" />;
      case "processing":
      case "pending":
        return <CircleNotch className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const statusLabel = (doc: Document) => {
    if (isTimedOut(doc.id)) return "Tempo acima do esperado — revise ou retome";

    const map: Record<string, string> = {
      pending: "Na fila",
      processing: "Processando",
      processed: "Pronto",
      embedding_pending: "Embeddings pendentes",
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
    doc.status === "error" || doc.status === "cancelled" || doc.status === "embedding_pending" || isTimedOut(doc.id);

  const canCancel = (doc: Document) =>
    (doc.status === "processing" || doc.status === "pending") && !isTimedOut(doc.id);

  const isBusy = ingestions.some((ingestion) => (
    ingestion.status === "vectorizing" || ingestion.status === "extracting" || ingestion.status === "verifying"
  ));

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
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
      <div className="mx-auto max-w-5xl space-y-6">
        <AdminPageHeader onSignOut={() => { void supabase.auth.signOut(); }} />

        <Card className="border-border/80 bg-muted/20">
          <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Disponivel agora</p>
              <p className="text-sm font-medium text-foreground">Login por conta provisionada e ingestao manual de PDF</p>
              <p className="text-xs text-muted-foreground">
                O painel segue utilizavel para curadoria, upload, leitura de status e retry administrativo.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ainda depende de integracao</p>
              <p className="text-sm font-medium text-foreground">Google OAuth, passkeys e estabilidade do provedor de embeddings</p>
              <p className="text-xs text-muted-foreground">
                Essas frentes nao impedem a operacao basica do painel, mas continuam fora do fluxo principal hoje.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Como ler o estado documental</p>
              <p className="text-sm font-medium text-foreground">So use o chat quando embeddings e governanca estiverem completos</p>
              <p className="text-xs text-muted-foreground">
                Documento salvo nao significa grounding liberado. O painel agora explicita essa diferenca em cada etapa.
              </p>
            </div>
          </CardContent>
        </Card>

        <AdminUploadCard
          ingestions={ingestions}
          isBusy={isBusy}
          governanceForm={uploadGovernance}
          onUpload={handleUpload}
          onGovernanceChange={updateUploadGovernance}
          onGovernanceReset={resetUploadGovernance}
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
