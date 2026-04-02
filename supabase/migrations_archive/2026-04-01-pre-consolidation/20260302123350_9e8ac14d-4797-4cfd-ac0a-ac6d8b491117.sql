
-- 1. GIN index for full-text search on document_chunks.content
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_fts 
ON public.document_chunks 
USING gin(to_tsvector('portuguese', content));

-- 2. Hybrid search function combining pgvector + full-text search with RRF
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding extensions.vector,
  query_text text,
  match_count integer DEFAULT 5,
  rrf_k integer DEFAULT 60
)
RETURNS TABLE(id uuid, document_id uuid, content text, similarity double precision)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  WITH semantic AS (
    SELECT 
      dc.id,
      dc.document_id,
      dc.content,
      ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank_ix
    FROM public.document_chunks dc
    WHERE dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword AS (
    SELECT 
      dc.id,
      dc.document_id,
      dc.content,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('portuguese', dc.content), plainto_tsquery('portuguese', query_text)) DESC) AS rank_ix
    FROM public.document_chunks dc
    WHERE to_tsvector('portuguese', dc.content) @@ plainto_tsquery('portuguese', query_text)
    ORDER BY ts_rank(to_tsvector('portuguese', dc.content), plainto_tsquery('portuguese', query_text)) DESC
    LIMIT match_count * 2
  ),
  combined AS (
    SELECT 
      COALESCE(s.id, k.id) AS id,
      COALESCE(s.document_id, k.document_id) AS document_id,
      COALESCE(s.content, k.content) AS content,
      COALESCE(1.0 / (rrf_k + s.rank_ix), 0.0) + COALESCE(1.0 / (rrf_k + k.rank_ix), 0.0) AS rrf_score
    FROM semantic s
    FULL OUTER JOIN keyword k ON s.id = k.id
  )
  SELECT 
    combined.id,
    combined.document_id,
    combined.content,
    combined.rrf_score AS similarity
  FROM combined
  ORDER BY combined.rrf_score DESC
  LIMIT match_count;
END;
$function$;

-- 3. Rate limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_created 
ON public.rate_limits (identifier, created_at DESC);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow insert from service role (edge functions use service role)
CREATE POLICY "Service insert rate_limits" ON public.rate_limits
  FOR INSERT WITH CHECK (true);

-- Allow select for checking
CREATE POLICY "Service select rate_limits" ON public.rate_limits
  FOR SELECT USING (true);

-- Allow delete for cleanup
CREATE POLICY "Service delete rate_limits" ON public.rate_limits
  FOR DELETE USING (true);

-- 4. Rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_max_requests integer DEFAULT 15,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_count integer;
BEGIN
  -- Clean old entries
  DELETE FROM public.rate_limits 
  WHERE identifier = p_identifier 
    AND created_at < now() - (p_window_minutes || ' minutes')::interval;
  
  -- Count recent requests
  SELECT count(*) INTO request_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
  
  -- If under limit, record and allow
  IF request_count < p_max_requests THEN
    INSERT INTO public.rate_limits (identifier) VALUES (p_identifier);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;
