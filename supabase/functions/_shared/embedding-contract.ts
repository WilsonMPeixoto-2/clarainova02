export const EMBEDDING_NORMALIZATION = "l2";

export interface DocumentChunkMetadataInput {
  sourceTag: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
  taskType: string;
  titleUsed: string | null;
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

export function buildDocumentChunkMetadata(input: DocumentChunkMetadataInput) {
  return {
    source_tag: input.sourceTag,
    page_start: input.pageStart,
    page_end: input.pageEnd,
    section_title: input.sectionTitle,
    task_type: input.taskType,
    title_used: input.titleUsed,
    normalization: EMBEDDING_NORMALIZATION,
  };
}
