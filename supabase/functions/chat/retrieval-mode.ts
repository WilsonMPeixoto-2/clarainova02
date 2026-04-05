export const KEYWORD_ONLY_QUERY_EMBEDDING_MODEL = 'keyword_only_no_embedding';

export function shouldUseSemanticRetrieval(queryEmbeddingPayload: string | null): boolean {
  return typeof queryEmbeddingPayload === 'string' && queryEmbeddingPayload.trim().length > 0;
}
