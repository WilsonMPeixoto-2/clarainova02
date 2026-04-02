
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document chunks with embeddings
CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding extensions.vector(768),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vector similarity search index
CREATE INDEX ON public.document_chunks USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 10);

-- Match chunks function for semantic search
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding extensions.vector(768),
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Allow public read access to documents bucket
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow public upload to documents bucket
CREATE POLICY "Public upload access for documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Allow public delete from documents bucket
CREATE POLICY "Public delete access for documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');
