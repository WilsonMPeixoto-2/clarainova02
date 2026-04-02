-- Fecha a reabertura pública indevida de tabelas operacionais/analíticas
-- sem alterar o fluxo atual baseado em conta provisionada autenticada.

-- ingestion_jobs
DROP POLICY IF EXISTS "Public read ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Public insert ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Public update ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Public delete ingestion_jobs" ON public.ingestion_jobs;

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
USING (true)
WITH CHECK (true);

-- document_processing_events
DROP POLICY IF EXISTS "Public read processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Public insert processing_events" ON public.document_processing_events;

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

-- chat_metrics
DROP POLICY IF EXISTS "Public read chat_metrics" ON public.chat_metrics;
DROP POLICY IF EXISTS "Public insert chat_metrics" ON public.chat_metrics;

DROP POLICY IF EXISTS "Authenticated read chat_metrics" ON public.chat_metrics;
CREATE POLICY "Authenticated read chat_metrics"
ON public.chat_metrics
FOR SELECT
TO authenticated
USING (true);

-- search_metrics
DROP POLICY IF EXISTS "Public read search_metrics" ON public.search_metrics;
DROP POLICY IF EXISTS "Public insert search_metrics" ON public.search_metrics;

DROP POLICY IF EXISTS "Authenticated read search_metrics" ON public.search_metrics;
CREATE POLICY "Authenticated read search_metrics"
ON public.search_metrics
FOR SELECT
TO authenticated
USING (true);

-- query_analytics
DROP POLICY IF EXISTS "Public read query_analytics" ON public.query_analytics;
DROP POLICY IF EXISTS "Public insert query_analytics" ON public.query_analytics;

DROP POLICY IF EXISTS "Authenticated read query_analytics" ON public.query_analytics;
CREATE POLICY "Authenticated read query_analytics"
ON public.query_analytics
FOR SELECT
TO authenticated
USING (true);
