import {
  classifyKnowledgeDocument,
  KNOWLEDGE_CORPUS_LANES,
  recommendKnowledgeGovernance,
  type KnowledgeAuthorityLevel,
  type KnowledgeCorpusCategory,
  type KnowledgeDocumentClassification,
  type KnowledgeDocumentKind,
  type KnowledgeIngestionPriority,
  type KnowledgeTopicScope,
} from "@/lib/knowledge-document-classifier";

export type KnowledgeSourceType =
  | "upload"
  | "portal_oficial"
  | "manual_oficial"
  | "normativa"
  | "faq"
  | "apoio_unidade"
  | "interno_clara";

export const KNOWLEDGE_SOURCE_TYPE_LABELS: Record<KnowledgeSourceType, string> = {
  upload: "Upload administrado",
  portal_oficial: "Portal oficial",
  manual_oficial: "Manual oficial",
  normativa: "Normativa",
  faq: "FAQ institucional",
  apoio_unidade: "Apoio da unidade",
  interno_clara: "Interno da CLARA",
};

export interface UploadGovernanceFormState {
  topicScope: KnowledgeTopicScope | "auto";
  documentKind: KnowledgeDocumentKind | "auto";
  authorityLevel: KnowledgeAuthorityLevel | "auto";
  searchWeight: string;
  corpusCategory: KnowledgeCorpusCategory | "auto";
  ingestionPriority: KnowledgeIngestionPriority | "auto";
  isActive: boolean;
  sourceType: KnowledgeSourceType;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  versionLabel: string;
  publishedAt: string;
  lastReviewedAt: string;
  governanceNotes: string;
}

export const DEFAULT_UPLOAD_GOVERNANCE_FORM: UploadGovernanceFormState = {
  topicScope: "auto",
  documentKind: "auto",
  authorityLevel: "auto",
  searchWeight: "",
  corpusCategory: "auto",
  ingestionPriority: "auto",
  isActive: true,
  sourceType: "upload",
  sourceName: "Base documental CLARA",
  sourceUrl: "",
  summary: "",
  versionLabel: "",
  publishedAt: "",
  lastReviewedAt: "",
  governanceNotes: "",
};

export interface ResolvedUploadGovernance {
  classification: KnowledgeDocumentClassification;
  topicScope: KnowledgeTopicScope;
  documentKind: KnowledgeDocumentKind;
  authorityLevel: KnowledgeAuthorityLevel;
  searchWeight: number;
  corpusCategory: KnowledgeCorpusCategory;
  ingestionPriority: KnowledgeIngestionPriority;
  isActive: boolean;
  sourceType: KnowledgeSourceType;
  sourceName: string;
  sourceUrl: string | null;
  summary: string | null;
  versionLabel: string | null;
  publishedAt: string | null;
  lastReviewedAt: string | null;
  governanceNotes: string | null;
  governanceReason: string;
}

export type DocumentGroundingStatus =
  | "processing"
  | "ready"
  | "embeddings_pending"
  | "chunks_incomplete"
  | "inactive"
  | "excluded";

export const DOCUMENT_GROUNDING_STATUS_LABELS: Record<DocumentGroundingStatus, string> = {
  processing: "Em preparação",
  ready: "Pronto para grounding",
  embeddings_pending: "Embeddings pendentes",
  chunks_incomplete: "Chunks incompletos",
  inactive: "Fora do grounding",
  excluded: "Excluido do grounding",
};

export interface ResolvedDocumentOperationalState {
  status: string;
  failureReason: string | null;
  groundingStatus: DocumentGroundingStatus;
  groundingEnabled: boolean;
  readinessSummary: string;
}

export function resolveDocumentRuntimeActivation(input: {
  governanceActivationRequested: boolean;
  operationalState: Pick<ResolvedDocumentOperationalState, "groundingEnabled">;
}) {
  return input.governanceActivationRequested && input.operationalState.groundingEnabled;
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalDate(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? `${trimmed}T00:00:00.000Z` : null;
}

function normalizeCorpusCategorySafety(
  topicScope: KnowledgeTopicScope,
  documentKind: KnowledgeDocumentKind,
  authorityLevel: KnowledgeAuthorityLevel,
  corpusCategory: KnowledgeCorpusCategory,
  searchWeight: number,
) {
  return (
    topicScope === "clara_internal" ||
    documentKind === "internal_technical" ||
    authorityLevel === "internal" ||
    corpusCategory === "interno_excluido" ||
    searchWeight <= 0
  );
}

export function resolveUploadGovernance(
  fileName: string,
  fullText: string,
  form: UploadGovernanceFormState,
): ResolvedUploadGovernance {
  const classification = classifyKnowledgeDocument(fileName, fullText);
  const recommendation = recommendKnowledgeGovernance(classification);

  const topicScope = form.topicScope === "auto" ? classification.topicScope : form.topicScope;
  const documentKind = form.documentKind === "auto" ? classification.documentKind : form.documentKind;
  const authorityLevel = form.authorityLevel === "auto" ? classification.authorityLevel : form.authorityLevel;
  const searchWeight = form.searchWeight.trim()
    ? Math.max(0, Number.parseFloat(form.searchWeight))
    : classification.searchWeight;
  const corpusCategory = form.corpusCategory === "auto" ? recommendation.corpusCategory : form.corpusCategory;
  const ingestionPriority = form.ingestionPriority === "auto"
    ? recommendation.ingestionPriority
    : form.ingestionPriority;

  const keepsAutomaticClassification =
    form.topicScope === "auto" &&
    form.documentKind === "auto" &&
    form.authorityLevel === "auto" &&
    form.searchWeight.trim().length === 0;

  const forcedOutOfGrounding = normalizeCorpusCategorySafety(
    topicScope,
    documentKind,
    authorityLevel,
    corpusCategory,
    searchWeight,
  );
  const isActive = forcedOutOfGrounding
    ? false
    : classification.shouldIndex || !keepsAutomaticClassification
      ? form.isActive
      : false;

  const governanceReason = classification.warning ?? recommendation.rationale;

  return {
    classification,
    topicScope,
    documentKind,
    authorityLevel,
    searchWeight,
    corpusCategory,
    ingestionPriority,
    isActive,
    sourceType: form.sourceType,
    sourceName: form.sourceName.trim() || DEFAULT_UPLOAD_GOVERNANCE_FORM.sourceName,
    sourceUrl: normalizeOptionalText(form.sourceUrl),
    summary: normalizeOptionalText(form.summary),
    versionLabel: normalizeOptionalText(form.versionLabel),
    publishedAt: normalizeOptionalDate(form.publishedAt),
    lastReviewedAt: normalizeOptionalDate(form.lastReviewedAt),
    governanceNotes: normalizeOptionalText(form.governanceNotes),
    governanceReason,
  };
}

type JsonLike = Record<string, unknown> | null | undefined;

function getMetadataValue<T extends string | number | boolean>(
  metadata: JsonLike,
  key: string,
): T | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = metadata[key];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value as T;
  }

  return null;
}

function getMetadataArrayValue(metadata: JsonLike, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = metadata[key];
  return Array.isArray(value) ? value : null;
}

export function getKnowledgeCorpusLane(category: KnowledgeCorpusCategory | null | undefined) {
  if (!category) return null;
  return KNOWLEDGE_CORPUS_LANES.find((lane) => lane.category === category) ?? null;
}

export function resolveDocumentOperationalState(input: {
  expectedChunks: number;
  savedChunks: number;
  embeddedChunks: number;
  governanceActive: boolean;
  excludedFromGrounding: boolean;
}) : ResolvedDocumentOperationalState {
  const expectedChunks = Math.max(0, input.expectedChunks);
  const savedChunks = Math.max(0, Math.min(input.savedChunks, expectedChunks || input.savedChunks));
  const embeddedChunks = Math.max(0, Math.min(input.embeddedChunks, savedChunks));
  const missingEmbeddings = Math.max(expectedChunks - embeddedChunks, 0);

  if (expectedChunks === 0 || savedChunks === 0 || savedChunks < expectedChunks) {
    const missingChunks = Math.max(expectedChunks - savedChunks, 0);
    return {
      status: "error",
      failureReason: savedChunks === 0 ? "no_chunks_persisted" : "partial_ingestion",
      groundingStatus: "chunks_incomplete",
      groundingEnabled: false,
      readinessSummary: missingChunks > 0
        ? `${savedChunks}/${expectedChunks} chunks salvos`
        : "Nenhum chunk salvo",
    };
  }

  if (embeddedChunks < expectedChunks) {
    return {
      status: "embedding_pending",
      failureReason: "embedding_incomplete",
      groundingStatus: "embeddings_pending",
      groundingEnabled: false,
      readinessSummary: `${embeddedChunks}/${expectedChunks} embeddings prontos`,
    };
  }

  if (input.excludedFromGrounding) {
    return {
      status: "processed",
      failureReason: null,
      groundingStatus: "excluded",
      groundingEnabled: false,
      readinessSummary: "Documento completo, mas fora do grounding principal",
    };
  }

  if (!input.governanceActive) {
    return {
      status: "processed",
      failureReason: null,
      groundingStatus: "inactive",
      groundingEnabled: false,
      readinessSummary: "Documento completo, aguardando ativacao manual",
    };
  }

  return {
    status: "processed",
    failureReason: null,
    groundingStatus: "ready",
    groundingEnabled: true,
    readinessSummary: `${embeddedChunks}/${expectedChunks} embeddings prontos`,
  };
}

export function parseDocumentGovernanceMetadata(metadata: JsonLike) {
  return {
    documentKind: getMetadataValue<string>(metadata, "document_kind"),
    authorityLevel: getMetadataValue<string>(metadata, "authority_level"),
    searchWeight: getMetadataValue<number>(metadata, "search_weight"),
    corpusCategory: getMetadataValue<string>(metadata, "corpus_category"),
    ingestionPriority: getMetadataValue<string>(metadata, "ingestion_priority"),
    governanceNotes: getMetadataValue<string>(metadata, "governance_notes"),
    expectedChunks: getMetadataValue<number>(metadata, "expected_chunks"),
    savedChunks: getMetadataValue<number>(metadata, "saved_chunks"),
    embeddedChunks: getMetadataValue<number>(metadata, "embedded_chunks"),
    missingEmbeddings: getMetadataValue<number>(metadata, "missing_embeddings"),
    groundingStatus: getMetadataValue<string>(metadata, "grounding_status"),
    groundingEnabled: getMetadataValue<boolean>(metadata, "grounding_enabled"),
    governanceActivationRequested: getMetadataValue<boolean>(metadata, "governance_activation_requested"),
    readinessSummary: getMetadataValue<string>(metadata, "readiness_summary"),
    lastEmbeddingAttemptAt: getMetadataValue<string>(metadata, "last_embedding_attempt_at"),
    lastEmbeddingRequestIds: getMetadataArrayValue(metadata, "last_embedding_request_ids"),
  };
}
