
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding extensions.vector,
  query_text text,
  match_count integer DEFAULT 5,
  rrf_k integer DEFAULT 60
)
RETURNS TABLE(id uuid, document_id uuid, content text, similarity double precision)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
      COALESCE(s.document_id, k.document_id) AS id2,
      COALESCE(s.content, k.content) AS content,
      (COALESCE(1.0 / (rrf_k + s.rank_ix), 0.0) + COALESCE(1.0 / (rrf_k + k.rank_ix), 0.0))::double precision AS rrf_score
    FROM semantic s
    FULL OUTER JOIN keyword k ON s.id = k.id
  )
  SELECT 
    combined.id,
    combined.id2,
    combined.content,
    combined.rrf_score AS similarity
  FROM combined
  ORDER BY combined.rrf_score DESC
  LIMIT match_count;
END;
$function$;
