-- Final housekeeping before v1.0 closure:
-- 1. remove bootstrap/template leftovers not used by the product
-- 2. make the shared updated_at trigger advisor-safe
-- 3. document the service_role-only access model of cache tables

DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.posts;
DROP TABLE IF EXISTS public.users;

ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_catalog;

COMMENT ON TABLE public.embedding_cache IS
  'Short-lived query embedding cache. Accessed only by Edge Functions via service_role.';

COMMENT ON TABLE public.chat_response_cache IS
  'Short-lived structured chat response cache. Accessed only by Edge Functions via service_role.';
