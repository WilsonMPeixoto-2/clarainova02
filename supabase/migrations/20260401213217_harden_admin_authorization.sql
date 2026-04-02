-- ============================================================
-- CLARA Migration 4: Harden admin authorization and admin-only RLS
-- ============================================================

-- 1. Canonical admin membership table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read their own admin membership"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2. Helper function used by RLS and the admin frontend gate
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'auth'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = COALESCE(p_user_id, (select auth.uid()))
      AND is_active = true
  );
$function$;

-- 3. Remove permissive authenticated policies from admin-only tables
DROP POLICY IF EXISTS "Authenticated read documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated delete documents" ON public.documents;

DROP POLICY IF EXISTS "Authenticated read chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated insert chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated delete chunks" ON public.document_chunks;

DROP POLICY IF EXISTS "Authenticated read usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Authenticated insert usage_logs" ON public.usage_logs;

DROP POLICY IF EXISTS "Authenticated read rate_limits" ON public.rate_limits;

DROP POLICY IF EXISTS "Authenticated read ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Authenticated insert ingestion_jobs" ON public.ingestion_jobs;
DROP POLICY IF EXISTS "Authenticated update ingestion_jobs" ON public.ingestion_jobs;

DROP POLICY IF EXISTS "Authenticated read document_processing_events" ON public.document_processing_events;
DROP POLICY IF EXISTS "Authenticated insert document_processing_events" ON public.document_processing_events;

DROP POLICY IF EXISTS "Authenticated read search_metrics" ON public.search_metrics;
DROP POLICY IF EXISTS "Authenticated read chat_metrics" ON public.chat_metrics;
DROP POLICY IF EXISTS "Authenticated read query_analytics" ON public.query_analytics;

DROP POLICY IF EXISTS "Authenticated read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access for documents" ON storage.objects;

-- 4. Recreate policies so that only explicit admins can use the admin surface
CREATE POLICY "Admin manage documents"
  ON public.documents
  FOR ALL
  TO authenticated
  USING ((select public.is_admin_user()))
  WITH CHECK ((select public.is_admin_user()));

CREATE POLICY "Admin manage chunks"
  ON public.document_chunks
  FOR ALL
  TO authenticated
  USING ((select public.is_admin_user()))
  WITH CHECK ((select public.is_admin_user()));

CREATE POLICY "Admin manage usage_logs"
  ON public.usage_logs
  FOR ALL
  TO authenticated
  USING ((select public.is_admin_user()))
  WITH CHECK ((select public.is_admin_user()));

CREATE POLICY "Admin read rate_limits"
  ON public.rate_limits
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin_user()));

CREATE POLICY "Admin manage ingestion_jobs"
  ON public.ingestion_jobs
  FOR ALL
  TO authenticated
  USING ((select public.is_admin_user()))
  WITH CHECK ((select public.is_admin_user()));

CREATE POLICY "Admin manage document_processing_events"
  ON public.document_processing_events
  FOR ALL
  TO authenticated
  USING ((select public.is_admin_user()))
  WITH CHECK ((select public.is_admin_user()));

CREATE POLICY "Admin read search_metrics"
  ON public.search_metrics
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin_user()));

CREATE POLICY "Admin read chat_metrics"
  ON public.chat_metrics
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin_user()));

CREATE POLICY "Admin read query_analytics"
  ON public.query_analytics
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin_user()));

CREATE POLICY "Admin read access for documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (select public.is_admin_user()));

CREATE POLICY "Admin upload access for documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (select public.is_admin_user()));

CREATE POLICY "Admin delete access for documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (select public.is_admin_user()));
