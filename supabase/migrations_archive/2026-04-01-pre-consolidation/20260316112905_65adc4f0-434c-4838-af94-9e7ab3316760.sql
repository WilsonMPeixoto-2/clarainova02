
-- Table: ingestion_jobs
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  job_type text NOT NULL DEFAULT 'upload_ingestion',
  trigger_source text NOT NULL DEFAULT 'admin_panel',
  status text NOT NULL DEFAULT 'pending',
  attempt_number integer NOT NULL DEFAULT 1,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  failed_at timestamptz,
  error_code text,
  error_message text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  result_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ingestion_jobs" ON public.ingestion_jobs FOR SELECT TO public USING (true);
CREATE POLICY "Public insert ingestion_jobs" ON public.ingestion_jobs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update ingestion_jobs" ON public.ingestion_jobs FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete ingestion_jobs" ON public.ingestion_jobs FOR DELETE TO public USING (true);

-- Table: document_processing_events
CREATE TABLE IF NOT EXISTS public.document_processing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  ingestion_job_id uuid REFERENCES public.ingestion_jobs(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_level text NOT NULL DEFAULT 'info',
  message text NOT NULL DEFAULT '',
  details_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_processing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read processing_events" ON public.document_processing_events FOR SELECT TO public USING (true);
CREATE POLICY "Public insert processing_events" ON public.document_processing_events FOR INSERT TO public WITH CHECK (true);

-- Table: chat_metrics
CREATE TABLE IF NOT EXISTS public.chat_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  query_text text,
  normalized_query text,
  response_text text,
  response_status text,
  used_rag boolean DEFAULT false,
  used_external_web boolean DEFAULT false,
  used_model_general_knowledge boolean DEFAULT false,
  rag_confidence_score double precision,
  search_result_count integer DEFAULT 0,
  chunks_selected_count integer DEFAULT 0,
  citations_count integer DEFAULT 0,
  model_name text,
  prompt_tokens_estimate integer,
  response_tokens_estimate integer,
  latency_ms integer,
  search_metric_id uuid,
  error_code text,
  error_message text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read chat_metrics" ON public.chat_metrics FOR SELECT TO public USING (true);
CREATE POLICY "Public insert chat_metrics" ON public.chat_metrics FOR INSERT TO public WITH CHECK (true);

-- Table: search_metrics
CREATE TABLE IF NOT EXISTS public.search_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  query_text text,
  normalized_query text,
  query_embedding_model text,
  keyword_query_text text,
  search_mode text DEFAULT 'hybrid',
  merged_hits_count integer DEFAULT 0,
  top_score double precision,
  avg_score double precision,
  search_latency_ms integer,
  selected_document_ids text[] DEFAULT '{}',
  selected_chunk_ids text[] DEFAULT '{}',
  selected_sources text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.search_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read search_metrics" ON public.search_metrics FOR SELECT TO public USING (true);
CREATE POLICY "Public insert search_metrics" ON public.search_metrics FOR INSERT TO public WITH CHECK (true);

-- Table: query_analytics
CREATE TABLE IF NOT EXISTS public.query_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  query_text text,
  normalized_query text,
  intent_label text,
  topic_label text,
  subtopic_label text,
  is_answered_satisfactorily boolean,
  needs_content_gap_review boolean DEFAULT false,
  gap_reason text,
  used_rag boolean DEFAULT false,
  used_external_web boolean DEFAULT false,
  chat_metric_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.query_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read query_analytics" ON public.query_analytics FOR SELECT TO public USING (true);
CREATE POLICY "Public insert query_analytics" ON public.query_analytics FOR INSERT TO public WITH CHECK (true);
