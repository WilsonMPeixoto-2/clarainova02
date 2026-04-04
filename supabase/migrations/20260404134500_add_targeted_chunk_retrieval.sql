-- Targeted retrieval for source-routed queries
-- Fetches top chunks from specific documents by embedding distance,
-- WITHOUT the search_weight multiplier that suppresses low-weight sources

CREATE OR REPLACE FUNCTION public.fetch_targeted_chunks(
  query_embedding extensions.vector,
  target_document_ids uuid[],
  match_count integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity double precision,
  document_name text,
  document_kind text,
  document_authority_level text,
  document_search_weight double precision,
  document_topic_scope text,
  document_source_type text,
  document_source_name text,
  page_start integer,
  page_end integer,
  section_title text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    (1.0 - (dc.embedding <=> query_embedding))::double precision AS similarity,
    d.name AS document_name,
    COALESCE(NULLIF(d.metadata_json->>'document_kind', ''), 'apoio') AS document_kind,
    COALESCE(NULLIF(d.metadata_json->>'authority_level', ''), 'supporting') AS document_authority_level,
    COALESCE(NULLIF(d.metadata_json->>'search_weight', '')::double precision, 0.8) AS document_search_weight,
    COALESCE(d.topic_scope, 'material_apoio') AS document_topic_scope,
    COALESCE(d.source_type, 'upload') AS document_source_type,
    COALESCE(d.source_name, 'Base documental CLARA') AS document_source_name,
    dc.page_start,
    dc.page_end,
    dc.section_title
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE dc.is_active = true
    AND d.is_active = true
    AND dc.embedding IS NOT NULL
    AND dc.document_id = ANY(target_document_ids)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
