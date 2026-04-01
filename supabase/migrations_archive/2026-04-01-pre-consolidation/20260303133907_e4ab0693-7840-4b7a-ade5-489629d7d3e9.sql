-- Drop legacy IVFFlat index
DROP INDEX IF EXISTS public.document_chunks_embedding_idx;

-- Create HNSW index for faster, training-free vector search
CREATE INDEX document_chunks_embedding_hnsw_idx 
ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);