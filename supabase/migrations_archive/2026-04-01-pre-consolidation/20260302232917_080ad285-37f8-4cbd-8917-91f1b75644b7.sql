
-- Just drop and recreate the ivfflat index (the column alter already failed so it's still 768)
-- First check: the index was dropped in a failed transaction, re-create it
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
  ON public.document_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
