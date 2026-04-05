export const EMBEDDING_NORMALIZATION = "l2";
export const EMBEDDING_CONTRACT_VERSION = "2026-04-05-r2-domain-instructions-v1";
export const EMBEDDING_DOMAIN_SCOPE = "sistema_sei_rio_prefeitura_rio";

export interface DocumentChunkMetadataInput {
  sourceTag: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
  taskType: string;
  titleUsed: string | null;
  inputStyle: string;
  contractVersion: string;
  domainScope: string;
}

interface DocumentEmbeddingInput {
  content: string;
  titleUsed: string | null;
  sectionTitle: string | null;
  sourceTag: string | null;
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeL2(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(norm) || norm === 0) {
    return values;
  }

  return values.map((value) => value / norm);
}

export function estimateTokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

export function buildQueryEmbeddingText(query: string) {
  const normalized = compactWhitespace(query);
  return [
    "task: retrieval_query",
    `domain: ${EMBEDDING_DOMAIN_SCOPE}`,
    "audience: servidores e usuarios do sistema SEI-Rio",
    `query: ${normalized}`,
  ].join("\n");
}

export function buildDocumentEmbeddingText(input: DocumentEmbeddingInput) {
  const normalizedContent = compactWhitespace(input.content);
  const parts = [
    "task: retrieval_document",
    `domain: ${EMBEDDING_DOMAIN_SCOPE}`,
    "corpus: normas, manuais, guias, perguntas frequentes e orientacoes operacionais sobre o SEI-Rio",
  ];

  if (input.titleUsed) {
    parts.push(`title: ${compactWhitespace(input.titleUsed)}`);
  }

  if (input.sectionTitle) {
    parts.push(`section: ${compactWhitespace(input.sectionTitle)}`);
  }

  if (input.sourceTag && input.sourceTag !== input.titleUsed) {
    parts.push(`source: ${compactWhitespace(input.sourceTag)}`);
  }

  parts.push(`text: ${normalizedContent}`);
  return parts.join("\n");
}

export function buildDocumentChunkMetadata(input: DocumentChunkMetadataInput) {
  return {
    source_tag: input.sourceTag,
    page_start: input.pageStart,
    page_end: input.pageEnd,
    section_title: input.sectionTitle,
    task_type: input.taskType,
    title_used: input.titleUsed,
    input_style: input.inputStyle,
    contract_version: input.contractVersion,
    domain_scope: input.domainScope,
    normalization: EMBEDDING_NORMALIZATION,
  };
}
