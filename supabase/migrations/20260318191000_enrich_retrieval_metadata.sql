UPDATE public.documents
SET metadata_json = jsonb_strip_nulls(
  COALESCE(metadata_json, '{}'::jsonb) || jsonb_build_object(
    'document_kind',
    COALESCE(
      NULLIF(metadata_json->>'document_kind', ''),
      CASE COALESCE(topic_scope, 'material_apoio')
        WHEN 'sei_rio_norma' THEN 'norma'
        WHEN 'sei_rio_manual' THEN 'manual'
        WHEN 'sei_rio_guia' THEN 'guia'
        WHEN 'sei_rio_faq' THEN 'faq'
        WHEN 'rotina_administrativa' THEN 'administrativo'
        WHEN 'clara_internal' THEN 'internal_technical'
        ELSE 'apoio'
      END
    ),
    'authority_level',
    COALESCE(
      NULLIF(metadata_json->>'authority_level', ''),
      CASE COALESCE(topic_scope, 'material_apoio')
        WHEN 'sei_rio_norma' THEN 'official'
        WHEN 'sei_rio_manual' THEN 'official'
        WHEN 'sei_rio_guia' THEN 'institutional'
        WHEN 'sei_rio_faq' THEN 'institutional'
        WHEN 'rotina_administrativa' THEN 'institutional'
        WHEN 'clara_internal' THEN 'internal'
        ELSE 'supporting'
      END
    ),
    'search_weight',
    COALESCE(
      NULLIF(metadata_json->>'search_weight', '')::double precision,
      CASE COALESCE(topic_scope, 'material_apoio')
        WHEN 'sei_rio_norma' THEN 1.35
        WHEN 'sei_rio_manual' THEN 1.25
        WHEN 'sei_rio_guia' THEN 1.1
        WHEN 'sei_rio_faq' THEN 0.92
        WHEN 'rotina_administrativa' THEN 0.95
        WHEN 'clara_internal' THEN 0.0
        ELSE 0.8
      END
    )
  )
)
WHERE metadata_json IS NULL
   OR NOT (metadata_json ? 'document_kind')
   OR NOT (metadata_json ? 'authority_level')
   OR NOT (metadata_json ? 'search_weight');

DROP FUNCTION IF EXISTS public.hybrid_search_chunks(extensions.vector, text, integer, integer);

CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding extensions.vector,
  query_text text,
  match_count integer DEFAULT 5,
  rrf_k integer DEFAULT 60
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
    JOIN public.documents d ON d.id = dc.document_id
    WHERE dc.is_active = true
      AND d.is_active = true
      AND COALESCE(d.topic_scope, 'material_apoio') <> 'clara_internal'
      AND dc.embedding IS NOT NULL
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
      ROW_NUMBER() OVER (ORDER BY ts_rank(dc.keyword_tsv, plainto_tsquery('portuguese', query_text)) DESC) AS rank_ix
    FROM public.document_chunks dc
    JOIN public.documents d ON d.id = dc.document_id
    WHERE dc.is_active = true
      AND d.is_active = true
      AND COALESCE(d.topic_scope, 'material_apoio') <> 'clara_internal'
      AND dc.keyword_tsv @@ plainto_tsquery('portuguese', query_text)
    ORDER BY ts_rank(dc.keyword_tsv, plainto_tsquery('portuguese', query_text)) DESC
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
  ),
  document_metadata AS (
    SELECT
      d.id,
      d.name AS document_name,
      COALESCE(d.topic_scope, 'material_apoio') AS document_topic_scope,
      COALESCE(d.source_type, 'upload') AS document_source_type,
      COALESCE(d.source_name, 'Base documental CLARA') AS document_source_name,
      COALESCE(
        NULLIF(d.metadata_json->>'document_kind', ''),
        CASE COALESCE(d.topic_scope, 'material_apoio')
          WHEN 'sei_rio_norma' THEN 'norma'
          WHEN 'sei_rio_manual' THEN 'manual'
          WHEN 'sei_rio_guia' THEN 'guia'
          WHEN 'sei_rio_faq' THEN 'faq'
          WHEN 'rotina_administrativa' THEN 'administrativo'
          WHEN 'clara_internal' THEN 'internal_technical'
          ELSE 'apoio'
        END
      ) AS document_kind,
      COALESCE(
        NULLIF(d.metadata_json->>'authority_level', ''),
        CASE COALESCE(d.topic_scope, 'material_apoio')
          WHEN 'sei_rio_norma' THEN 'official'
          WHEN 'sei_rio_manual' THEN 'official'
          WHEN 'sei_rio_guia' THEN 'institutional'
          WHEN 'sei_rio_faq' THEN 'institutional'
          WHEN 'rotina_administrativa' THEN 'institutional'
          WHEN 'clara_internal' THEN 'internal'
          ELSE 'supporting'
        END
      ) AS document_authority_level,
      COALESCE(
        NULLIF(d.metadata_json->>'search_weight', '')::double precision,
        CASE COALESCE(d.topic_scope, 'material_apoio')
          WHEN 'sei_rio_norma' THEN 1.35
          WHEN 'sei_rio_manual' THEN 1.25
          WHEN 'sei_rio_guia' THEN 1.1
          WHEN 'sei_rio_faq' THEN 0.92
          WHEN 'rotina_administrativa' THEN 0.95
          WHEN 'clara_internal' THEN 0.0
          ELSE 0.8
        END
      ) AS document_search_weight
    FROM public.documents d
  )
  SELECT
    combined.id,
    combined.document_id,
    combined.content,
    (combined.rrf_score * GREATEST(document_metadata.document_search_weight, 0.1))::double precision AS similarity,
    document_metadata.document_name,
    document_metadata.document_kind,
    document_metadata.document_authority_level,
    document_metadata.document_search_weight,
    document_metadata.document_topic_scope,
    document_metadata.document_source_type,
    document_metadata.document_source_name,
    combined.page_start,
    combined.page_end,
    combined.section_title
  FROM combined
  JOIN document_metadata ON document_metadata.id = combined.document_id
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$;
