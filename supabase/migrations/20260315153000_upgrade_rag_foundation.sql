CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS document_hash text,
  ADD COLUMN IF NOT EXISTS language_code text,
  ADD COLUMN IF NOT EXISTS jurisdiction_scope text,
  ADD COLUMN IF NOT EXISTS topic_scope text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS version_label text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS page_count integer,
  ADD COLUMN IF NOT EXISTS text_char_count integer,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text;

UPDATE public.documents
SET
  file_name = COALESCE(file_name, name),
  storage_path = COALESCE(storage_path, file_path),
  language_code = COALESCE(language_code, 'pt-BR'),
  jurisdiction_scope = COALESCE(jurisdiction_scope, 'municipal_rj'),
  topic_scope = COALESCE(topic_scope, 'sei_rio'),
  source_type = COALESCE(source_type, 'upload'),
  source_name = COALESCE(source_name, 'Base documental CLARA'),
  updated_at = COALESCE(updated_at, created_at)
WHERE
  file_name IS NULL
  OR storage_path IS NULL
  OR language_code IS NULL
  OR jurisdiction_scope IS NULL
  OR topic_scope IS NULL
  OR source_type IS NULL
  OR source_name IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS documents_document_hash_key
  ON public.documents (document_hash)
  WHERE document_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS documents_status_idx
  ON public.documents (status);

CREATE INDEX IF NOT EXISTS documents_is_active_idx
  ON public.documents (is_active);

CREATE INDEX IF NOT EXISTS documents_topic_scope_idx
  ON public.documents (topic_scope);

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.document_chunks
  ADD COLUMN IF NOT EXISTS page_start integer,
  ADD COLUMN IF NOT EXISTS page_end integer,
  ADD COLUMN IF NOT EXISTS section_title text,
  ADD COLUMN IF NOT EXISTS text_hash text,
  ADD COLUMN IF NOT EXISTS token_count_estimate integer,
  ADD COLUMN IF NOT EXISTS char_count integer,
  ADD COLUMN IF NOT EXISTS embedding_model text,
  ADD COLUMN IF NOT EXISTS embedding_dim integer,
  ADD COLUMN IF NOT EXISTS semantic_weight real NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS keyword_weight real NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS chunk_metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS embedded_at timestamptz;

ALTER TABLE public.document_chunks
  ADD COLUMN IF NOT EXISTS keyword_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', COALESCE(content, ''))) STORED;

UPDATE public.document_chunks
SET
  page_start = COALESCE(
    page_start,
    ((regexp_match(content, '\|\s*P[aá]gina:\s*([0-9]+)'))[1])::integer
  ),
  page_end = COALESCE(
    page_end,
    ((regexp_match(content, '\|\s*P[aá]gina:\s*([0-9]+)'))[1])::integer,
    page_start
  ),
  text_hash = COALESCE(text_hash, encode(extensions.digest(content, 'sha256'), 'hex')),
  token_count_estimate = COALESCE(token_count_estimate, GREATEST(1, CEIL(char_length(content) / 4.0)::integer)),
  char_count = COALESCE(char_count, char_length(content)),
  embedding_model = COALESCE(embedding_model, CASE WHEN embedding IS NOT NULL THEN 'gemini-embedding-001' ELSE NULL END),
  embedding_dim = COALESCE(embedding_dim, CASE WHEN embedding IS NOT NULL THEN 768 ELSE NULL END),
  embedded_at = COALESCE(embedded_at, CASE WHEN embedding IS NOT NULL THEN created_at ELSE NULL END),
  updated_at = COALESCE(updated_at, created_at)
WHERE
  page_start IS NULL
  OR page_end IS NULL
  OR text_hash IS NULL
  OR token_count_estimate IS NULL
  OR char_count IS NULL
  OR embedding_model IS NULL
  OR embedding_dim IS NULL
  OR embedded_at IS NULL;

CREATE INDEX IF NOT EXISTS document_chunks_document_active_idx
  ON public.document_chunks (document_id, is_active);

CREATE INDEX IF NOT EXISTS document_chunks_text_hash_idx
  ON public.document_chunks (text_hash);

DROP INDEX IF EXISTS public.idx_document_chunks_content_fts;
CREATE INDEX IF NOT EXISTS idx_document_chunks_keyword_tsv
  ON public.document_chunks
  USING gin (keyword_tsv);

DROP TRIGGER IF EXISTS set_document_chunks_updated_at ON public.document_chunks;
CREATE TRIGGER set_document_chunks_updated_at
BEFORE UPDATE ON public.document_chunks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.search_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  query_text text NOT NULL,
  normalized_query text,
  query_embedding_model text,
  keyword_query_text text,
  search_mode text NOT NULL DEFAULT 'hybrid',
  semantic_hits_count integer,
  keyword_hits_count integer,
  merged_hits_count integer NOT NULL DEFAULT 0,
  top_score double precision,
  avg_score double precision,
  search_latency_ms integer,
  selected_document_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_chunk_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.search_metrics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS search_metrics_created_at_idx
  ON public.search_metrics (created_at DESC);

CREATE INDEX IF NOT EXISTS search_metrics_search_mode_idx
  ON public.search_metrics (search_mode);

CREATE TABLE IF NOT EXISTS public.chat_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  query_text text NOT NULL,
  normalized_query text,
  response_text text,
  response_status text NOT NULL DEFAULT 'answered',
  used_rag boolean NOT NULL DEFAULT false,
  used_external_web boolean NOT NULL DEFAULT false,
  used_model_general_knowledge boolean NOT NULL DEFAULT false,
  rag_confidence_score double precision,
  search_result_count integer NOT NULL DEFAULT 0,
  chunks_selected_count integer NOT NULL DEFAULT 0,
  citations_count integer NOT NULL DEFAULT 0,
  model_name text,
  prompt_tokens_estimate integer,
  response_tokens_estimate integer,
  latency_ms integer,
  search_metric_id uuid REFERENCES public.search_metrics(id) ON DELETE SET NULL,
  error_code text,
  error_message text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_metrics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chat_metrics_created_at_idx
  ON public.chat_metrics (created_at DESC);

CREATE INDEX IF NOT EXISTS chat_metrics_response_status_idx
  ON public.chat_metrics (response_status);

CREATE INDEX IF NOT EXISTS chat_metrics_used_rag_idx
  ON public.chat_metrics (used_rag);

CREATE TABLE IF NOT EXISTS public.query_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  query_text text NOT NULL,
  normalized_query text,
  intent_label text,
  topic_label text,
  subtopic_label text,
  is_answered_satisfactorily boolean,
  needs_content_gap_review boolean NOT NULL DEFAULT false,
  gap_reason text,
  used_rag boolean NOT NULL DEFAULT false,
  used_external_web boolean NOT NULL DEFAULT false,
  chat_metric_id uuid REFERENCES public.chat_metrics(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.query_analytics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS query_analytics_created_at_idx
  ON public.query_analytics (created_at DESC);

CREATE INDEX IF NOT EXISTS query_analytics_topic_label_idx
  ON public.query_analytics (topic_label);

CREATE INDEX IF NOT EXISTS query_analytics_intent_label_idx
  ON public.query_analytics (intent_label);

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
