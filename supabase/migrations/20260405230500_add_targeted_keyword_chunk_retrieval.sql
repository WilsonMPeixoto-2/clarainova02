-- Recuperacao lexical dirigida para cenarios em que embeddings de consulta
-- ou geracao por modelo estejam indisponiveis, mas a base documental siga ativa.

CREATE OR REPLACE FUNCTION public.fetch_targeted_keyword_chunks(
  query_text text,
  target_document_ids uuid[],
  match_count integer DEFAULT 4
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
    (
      ts_rank(dc.keyword_tsv, plainto_tsquery('portuguese', query_text))
      + (
        ts_rank(
          to_tsvector(
            'simple',
            concat_ws(
              ' ',
              COALESCE(d.name, ''),
              COALESCE(d.source_name, ''),
              COALESCE(d.version_label, ''),
              COALESCE(dc.section_title, '')
            )
          ),
          websearch_to_tsquery('simple', query_text)
        ) * 1.35
      )
    )::double precision AS similarity,
    d.name AS document_name,
    COALESCE(
      NULLIF(d.metadata_json->>'document_kind', ''),
      CASE COALESCE(d.topic_scope, 'material_apoio')
        WHEN 'sei_rio_norma' THEN 'norma'
        WHEN 'sei_rio_manual' THEN 'manual'
        WHEN 'sei_rio_guia' THEN 'guia'
        WHEN 'sei_rio_faq' THEN 'faq'
        WHEN 'sei_rio_termo' THEN 'termo'
        WHEN 'pen_manual_compativel' THEN 'manual'
        WHEN 'pen_compatibilidade' THEN 'apoio'
        WHEN 'pen_release_note' THEN 'apoio'
        WHEN 'interface_update' THEN 'apoio'
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
        WHEN 'sei_rio_termo' THEN 'official'
        WHEN 'pen_manual_compativel' THEN 'institutional'
        WHEN 'pen_compatibilidade' THEN 'institutional'
        WHEN 'pen_release_note' THEN 'institutional'
        WHEN 'interface_update' THEN 'supporting'
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
        WHEN 'sei_rio_termo' THEN 1.0
        WHEN 'pen_manual_compativel' THEN 0.84
        WHEN 'pen_compatibilidade' THEN 0.76
        WHEN 'pen_release_note' THEN 0.7
        WHEN 'interface_update' THEN 0.6
        WHEN 'rotina_administrativa' THEN 0.95
        WHEN 'clara_internal' THEN 0.0
        ELSE 0.8
      END
    ) AS document_search_weight,
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
    AND dc.document_id = ANY(target_document_ids)
  ORDER BY similarity DESC, dc.chunk_index ASC
  LIMIT match_count;
END;
$function$;
