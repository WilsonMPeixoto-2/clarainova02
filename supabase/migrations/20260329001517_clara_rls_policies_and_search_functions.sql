-- ============================================================
-- CLARA Migration 2: RLS Policies, Search Functions, Storage Security
-- Consolidated from incremental migrations (harden_public_access,
-- ingestion_governance, harden_chat_grounding, enrich_retrieval_metadata)
-- ============================================================

-- 1. Enable RLS on ALL public tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_processing_events ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies — documents (full CRUD for authenticated)
CREATE POLICY "Authenticated read documents"
  ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert documents"
  ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update documents"
  ON public.documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete documents"
  ON public.documents FOR DELETE TO authenticated USING (true);

-- 3. RLS Policies — document_chunks (read, insert, delete for authenticated)
CREATE POLICY "Authenticated read chunks"
  ON public.document_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert chunks"
  ON public.document_chunks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete chunks"
  ON public.document_chunks FOR DELETE TO authenticated USING (true);

-- 4. RLS Policies — usage_logs (read + insert for authenticated)
CREATE POLICY "Authenticated read usage_logs"
  ON public.usage_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert usage_logs"
  ON public.usage_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 5. RLS Policies — rate_limits (read for authenticated; writes via service_role)
CREATE POLICY "Authenticated read rate_limits"
  ON public.rate_limits FOR SELECT TO authenticated USING (true);

-- 6. RLS Policies — ingestion_jobs (read, insert, update for authenticated)
CREATE POLICY "Authenticated read ingestion_jobs"
  ON public.ingestion_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert ingestion_jobs"
  ON public.ingestion_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update ingestion_jobs"
  ON public.ingestion_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 7. RLS Policies — document_processing_events (read + insert for authenticated)
CREATE POLICY "Authenticated read document_processing_events"
  ON public.document_processing_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert document_processing_events"
  ON public.document_processing_events FOR INSERT TO authenticated WITH CHECK (true);

-- 8. RLS Policies — analytics/metrics tables (read-only for authenticated; writes via service_role Edge Functions)
CREATE POLICY "Authenticated read search_metrics"
  ON public.search_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read chat_metrics"
  ON public.chat_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read query_analytics"
  ON public.query_analytics FOR SELECT TO authenticated USING (true);

-- 9. Storage bucket security — authenticated only
CREATE POLICY "Authenticated read access for documents"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated upload access for documents"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Authenticated delete access for documents"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- 10. Final hybrid_search_chunks function (v7 — RRF with authority metadata)
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
