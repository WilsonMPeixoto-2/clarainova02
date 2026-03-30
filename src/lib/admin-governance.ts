import {
  classifyKnowledgeDocument,
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

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalDate(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? `${trimmed}T00:00:00.000Z` : null;
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

  const isActive = classification.shouldIndex || !keepsAutomaticClassification
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

export function parseDocumentGovernanceMetadata(metadata: JsonLike) {
  return {
    documentKind: getMetadataValue<string>(metadata, "document_kind"),
    authorityLevel: getMetadataValue<string>(metadata, "authority_level"),
    searchWeight: getMetadataValue<number>(metadata, "search_weight"),
    corpusCategory: getMetadataValue<string>(metadata, "corpus_category"),
    ingestionPriority: getMetadataValue<string>(metadata, "ingestion_priority"),
    governanceNotes: getMetadataValue<string>(metadata, "governance_notes"),
  };
}
