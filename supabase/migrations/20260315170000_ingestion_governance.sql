CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  trigger_source text NOT NULL DEFAULT 'admin_panel',
  status text NOT NULL DEFAULT 'queued',
  attempt_number integer NOT NULL DEFAULT 1,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  error_code text,
  error_message text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_processing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  ingestion_job_id uuid REFERENCES public.ingestion_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ingestion_jobs_document_id_idx
  ON public.ingestion_jobs (document_id);

CREATE INDEX IF NOT EXISTS ingestion_jobs_status_idx
  ON public.ingestion_jobs (status);

CREATE INDEX IF NOT EXISTS ingestion_jobs_created_at_idx
  ON public.ingestion_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS document_processing_events_document_id_idx
  ON public.document_processing_events (document_id);

CREATE INDEX IF NOT EXISTS document_processing_events_job_id_idx
  ON public.document_processing_events (ingestion_job_id);

CREATE INDEX IF NOT EXISTS document_processing_events_type_idx
  ON public.document_processing_events (event_type);

CREATE INDEX IF NOT EXISTS document_processing_events_created_at_idx
  ON public.document_processing_events (created_at DESC);

DROP TRIGGER IF EXISTS set_ingestion_jobs_updated_at ON public.ingestion_jobs;
CREATE TRIGGER set_ingestion_jobs_updated_at
BEFORE UPDATE ON public.ingestion_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_processing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read ingestion_jobs" ON public.ingestion_jobs;
CREATE POLICY "Authenticated read ingestion_jobs"
ON public.ingestion_jobs
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated insert ingestion_jobs" ON public.ingestion_jobs;
CREATE POLICY "Authenticated insert ingestion_jobs"
ON public.ingestion_jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update ingestion_jobs" ON public.ingestion_jobs;
CREATE POLICY "Authenticated update ingestion_jobs"
ON public.ingestion_jobs
FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated read document_processing_events" ON public.document_processing_events;
CREATE POLICY "Authenticated read document_processing_events"
ON public.document_processing_events
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated insert document_processing_events" ON public.document_processing_events;
CREATE POLICY "Authenticated insert document_processing_events"
ON public.document_processing_events
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read search_metrics" ON public.search_metrics;
CREATE POLICY "Authenticated read search_metrics"
ON public.search_metrics
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated read chat_metrics" ON public.chat_metrics;
CREATE POLICY "Authenticated read chat_metrics"
ON public.chat_metrics
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated read query_analytics" ON public.query_analytics;
CREATE POLICY "Authenticated read query_analytics"
ON public.query_analytics
FOR SELECT
TO authenticated
USING (true);
