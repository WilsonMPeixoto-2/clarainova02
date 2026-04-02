-- Fecha a reabertura publica indevida de tabelas operacionais/analiticas.
--
-- O projeto remoto oficial ja esta mais endurecido e usa `public.is_admin_user()`
-- apoiada em `public.admin_users`. Como esse contrato ainda nao esta versionado
-- neste clone, esta migration precisa funcionar em dois cenarios:
-- 1. ambientes que ja possuem `is_admin_user()` -> aplica policy admin-only
-- 2. ambientes que ainda nao possuem esse helper -> fecha o acesso publico e
--    preserva, por ora, o baseline autenticado

-- ingestion_jobs
DROP POLICY IF EXISTS "Public read ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Public insert ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Public update ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Public delete ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Authenticated read ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Authenticated insert ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Authenticated update ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Authenticated delete ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Admin manage ingestion_jobs" ON public.ingestion_jobs;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin_user'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admin manage ingestion_jobs"
      ON public.ingestion_jobs
      FOR ALL
      TO authenticated
      USING ((SELECT public.is_admin_user()))
      WITH CHECK ((SELECT public.is_admin_user()))
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Authenticated read ingestion_jobs"
      ON public.ingestion_jobs
      FOR SELECT
      TO authenticated
      USING (true)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Authenticated insert ingestion_jobs"
      ON public.ingestion_jobs
      FOR INSERT
      TO authenticated
      WITH CHECK (true)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Authenticated update ingestion_jobs"
      ON public.ingestion_jobs
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

-- document_processing_events
DROP POLICY IF EXISTS "Public read processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Public read document_processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Public insert processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Public insert document_processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Authenticated read document_processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Authenticated insert document_processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Admin manage document_processing_events" ON public.document_processing_events;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin_user'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admin manage document_processing_events"
      ON public.document_processing_events
      FOR ALL
      TO authenticated
      USING ((SELECT public.is_admin_user()))
      WITH CHECK ((SELECT public.is_admin_user()))
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Authenticated read document_processing_events"
      ON public.document_processing_events
      FOR SELECT
      TO authenticated
      USING (true)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Authenticated insert document_processing_events"
      ON public.document_processing_events
      FOR INSERT
      TO authenticated
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

-- chat_metrics
DROP POLICY IF EXISTS "Public read chat_metrics" ON public.chat_metrics;
DROP POLICY IF EXISTS "Public insert chat_metrics" ON public.chat_metrics;
DROP POLICY IF EXISTS "Authenticated read chat_metrics" ON public.chat_metrics;
DROP POLICY IF EXISTS "Authenticated insert chat_metrics" ON public.chat_metrics;
DROP POLICY IF EXISTS "Admin read chat_metrics" ON public.chat_metrics;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin_user'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admin read chat_metrics"
      ON public.chat_metrics
      FOR SELECT
      TO authenticated
      USING ((SELECT public.is_admin_user()))
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Authenticated read chat_metrics"
      ON public.chat_metrics
      FOR SELECT
      TO authenticated
      USING (true)
    $policy$;
  END IF;
END $$;

-- search_metrics
DROP POLICY IF EXISTS "Public read search_metrics" ON public.search_metrics;
DROP POLICY IF EXISTS "Public insert search_metrics" ON public.search_metrics;
DROP POLICY IF EXISTS "Authenticated read search_metrics" ON public.search_metrics;
DROP POLICY IF EXISTS "Authenticated insert search_metrics" ON public.search_metrics;
DROP POLICY IF EXISTS "Admin read search_metrics" ON public.search_metrics;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin_user'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admin read search_metrics"
      ON public.search_metrics
      FOR SELECT
      TO authenticated
      USING ((SELECT public.is_admin_user()))
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Authenticated read search_metrics"
      ON public.search_metrics
      FOR SELECT
      TO authenticated
      USING (true)
    $policy$;
  END IF;
END $$;

-- query_analytics
DROP POLICY IF EXISTS "Public read query_analytics" ON public.query_analytics;
DROP POLICY IF EXISTS "Public insert query_analytics" ON public.query_analytics;
DROP POLICY IF EXISTS "Authenticated read query_analytics" ON public.query_analytics;
DROP POLICY IF EXISTS "Authenticated insert query_analytics" ON public.query_analytics;
DROP POLICY IF EXISTS "Admin read query_analytics" ON public.query_analytics;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin_user'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admin read query_analytics"
      ON public.query_analytics
      FOR SELECT
      TO authenticated
      USING ((SELECT public.is_admin_user()))
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Authenticated read query_analytics"
      ON public.query_analytics
      FOR SELECT
      TO authenticated
      USING (true)
    $policy$;
  END IF;
END $$;
