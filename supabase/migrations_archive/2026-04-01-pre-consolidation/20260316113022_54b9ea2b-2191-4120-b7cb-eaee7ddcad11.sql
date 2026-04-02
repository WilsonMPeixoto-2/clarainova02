
-- Add metadata columns to document_chunks
ALTER TABLE public.document_chunks
  ADD COLUMN IF NOT EXISTS page_start integer,
  ADD COLUMN IF NOT EXISTS page_end integer,
  ADD COLUMN IF NOT EXISTS section_title text;

-- Drop old function signature then recreate with new return type
DROP FUNCTION IF EXISTS public.hybrid_search_chunks(extensions.vector, text, integer, integer);

CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding extensions.vector,
  query_text text,
  match_count integer DEFAULT 5,
  rrf_k integer DEFAULT 60
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  content text,
  similarity double precision,
  document_name text,
  page_start integer,
  page_end integer,
  section_title text
)
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
      dc.page_start,
      dc.page_end,
      dc.section_title,
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
      dc.page_start,
      dc.page_end,
      dc.section_title,
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
      COALESCE(s.page_start, k.page_start) AS page_start,
      COALESCE(s.page_end, k.page_end) AS page_end,
      COALESCE(s.section_title, k.section_title) AS section_title,
      (COALESCE(1.0 / (rrf_k + s.rank_ix), 0.0) + COALESCE(1.0 / (rrf_k + k.rank_ix), 0.0))::double precision AS rrf_score
    FROM semantic s
    FULL OUTER JOIN keyword k ON s.id = k.id
  )
  SELECT
    combined.id,
    combined.document_id,
    combined.content,
    combined.rrf_score AS similarity,
    d.name AS document_name,
    combined.page_start,
    combined.page_end,
    combined.section_title
  FROM combined
  JOIN public.documents d ON d.id = combined.document_id
  ORDER BY combined.rrf_score DESC
  LIMIT match_count;
END;
$function$;
