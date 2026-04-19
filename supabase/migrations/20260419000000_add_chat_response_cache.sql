-- Cache curto para respostas completas do chat, para economizar chamadas LLM.
CREATE TABLE IF NOT EXISTS public.chat_response_cache (
  query_hash TEXT PRIMARY KEY,
  query_text TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  response_mode TEXT NOT NULL,
  response_payload JSONB NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1 CHECK (hits >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_response_cache_expires_at_idx
  ON public.chat_response_cache (expires_at);

CREATE INDEX IF NOT EXISTS chat_response_cache_last_hit_at_idx
  ON public.chat_response_cache (last_hit_at DESC);

ALTER TABLE public.chat_response_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.chat_response_cache FROM anon, authenticated;
GRANT ALL ON public.chat_response_cache TO service_role;
