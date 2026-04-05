-- Cache curto para embeddings de consulta recorrentes, fechado por RLS
-- e consumido apenas via Edge Functions com service_role.

CREATE TABLE IF NOT EXISTS public.embedding_cache (
  query_hash TEXT PRIMARY KEY,
  query_text TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  embedding extensions.vector(768) NOT NULL,
  embedding_model TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1 CHECK (hits >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS embedding_cache_expires_at_idx
  ON public.embedding_cache (expires_at);

CREATE INDEX IF NOT EXISTS embedding_cache_last_hit_at_idx
  ON public.embedding_cache (last_hit_at DESC);

ALTER TABLE public.embedding_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.embedding_cache FROM anon, authenticated;
GRANT ALL ON public.embedding_cache TO service_role;
