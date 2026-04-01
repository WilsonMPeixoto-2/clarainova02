
-- ============================================================
-- CLARA Foundation: Extensions, Tables, Indexes, Triggers, Storage
-- Consolidated from 19 incremental migrations
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Utility trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 3. Core tables

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_name TEXT,
  mime_type TEXT,
  storage_path TEXT,
  document_hash TEXT,
  language_code TEXT,
  jurisdiction_scope TEXT,
  topic_scope TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version_label TEXT,
  published_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  page_count INTEGER,
  text_char_count INTEGER,
  summary TEXT,
  source_type TEXT,
  source_name TEXT,
  source_url TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX documents_document_hash_key ON public.documents (document_hash) WHERE document_hash IS NOT NULL;
CREATE INDEX documents_status_idx ON public.documents (status);
CREATE INDEX documents_is_active_idx ON public.documents (is_active);
CREATE INDEX documents_topic_scope_idx ON public.documents (topic_scope);

CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding extensions.vector(768),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  page_start INTEGER,
  page_end INTEGER,
  section_title TEXT,
  text_hash TEXT,
  token_count_estimate INTEGER,
  char_count INTEGER,
  embedding_model TEXT,
  embedding_dim INTEGER,
  semantic_weight REAL NOT NULL DEFAULT 1.0,
  keyword_weight REAL NOT NULL DEFAULT 1.0,
  chunk_metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  embedded_at TIMESTAMPTZ,
  keyword_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('portuguese', COALESCE(content, ''))) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_chunks_doc_chunk_unique UNIQUE (document_id, chunk_index)
);

CREATE INDEX document_chunks_embedding_hnsw_idx ON public.document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX document_chunks_document_active_idx ON public.document_chunks (document_id, is_active);
CREATE INDEX document_chunks_text_hash_idx ON public.document_chunks (text_hash);
CREATE INDEX idx_document_chunks_keyword_tsv ON public.document_chunks USING gin (keyword_tsv);

CREATE TRIGGER set_document_chunks_updated_at
BEFORE UPDATE ON public.document_chunks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_identifier_created ON public.rate_limits (identifier, created_at DESC);

-- 4. Analytics tables

CREATE TABLE public.search_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  query_text TEXT,
  normalized_query TEXT,
  query_embedding_model TEXT,
  keyword_query_text TEXT,
  search_mode TEXT DEFAULT 'hybrid',
  merged_hits_count INTEGER DEFAULT 0,
  top_score DOUBLE PRECISION,
  avg_score DOUBLE PRECISION,
  search_latency_ms INTEGER,
  selected_document_ids TEXT[] DEFAULT '{}',
  selected_chunk_ids TEXT[] DEFAULT '{}',
  selected_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX search_metrics_created_at_idx ON public.search_metrics (created_at DESC);
CREATE INDEX search_metrics_search_mode_idx ON public.search_metrics (search_mode);

CREATE TABLE public.chat_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  query_text TEXT,
  normalized_query TEXT,
  response_text TEXT,
  response_status TEXT,
  used_rag BOOLEAN DEFAULT false,
  used_external_web BOOLEAN DEFAULT false,
  used_model_general_knowledge BOOLEAN DEFAULT false,
  rag_confidence_score DOUBLE PRECISION,
  search_result_count INTEGER DEFAULT 0,
  chunks_selected_count INTEGER DEFAULT 0,
  citations_count INTEGER DEFAULT 0,
  model_name TEXT,
  prompt_tokens_estimate INTEGER,
  response_tokens_estimate INTEGER,
  latency_ms INTEGER,
  search_metric_id UUID,
  error_code TEXT,
  error_message TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_metrics_created_at_idx ON public.chat_metrics (created_at DESC);
CREATE INDEX chat_metrics_response_status_idx ON public.chat_metrics (response_status);
CREATE INDEX chat_metrics_used_rag_idx ON public.chat_metrics (used_rag);

CREATE TABLE public.query_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  query_text TEXT,
  normalized_query TEXT,
  intent_label TEXT,
  topic_label TEXT,
  subtopic_label TEXT,
  is_answered_satisfactorily BOOLEAN,
  needs_content_gap_review BOOLEAN DEFAULT false,
  gap_reason TEXT,
  used_rag BOOLEAN DEFAULT false,
  used_external_web BOOLEAN DEFAULT false,
  chat_metric_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX query_analytics_created_at_idx ON public.query_analytics (created_at DESC);
CREATE INDEX query_analytics_topic_label_idx ON public.query_analytics (topic_label);
CREATE INDEX query_analytics_intent_label_idx ON public.query_analytics (intent_label);

-- 5. Governance tables

CREATE TABLE public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL DEFAULT 'upload_ingestion',
  trigger_source TEXT NOT NULL DEFAULT 'admin_panel',
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  payload_json JSONB DEFAULT '{}'::jsonb,
  result_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ingestion_jobs_document_id_idx ON public.ingestion_jobs (document_id);
CREATE INDEX ingestion_jobs_status_idx ON public.ingestion_jobs (status);
CREATE INDEX ingestion_jobs_created_at_idx ON public.ingestion_jobs (created_at DESC);

CREATE TABLE public.document_processing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  ingestion_job_id UUID REFERENCES public.ingestion_jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL DEFAULT '',
  details_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX document_processing_events_document_id_idx ON public.document_processing_events (document_id);
CREATE INDEX document_processing_events_job_id_idx ON public.document_processing_events (ingestion_job_id);
CREATE INDEX document_processing_events_type_idx ON public.document_processing_events (event_type);
CREATE INDEX document_processing_events_created_at_idx ON public.document_processing_events (created_at DESC);

-- 6. Storage bucket (private, authenticated access only)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
