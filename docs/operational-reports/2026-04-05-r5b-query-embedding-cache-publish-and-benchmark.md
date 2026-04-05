# 2026-04-05 — R5B publicado: cache de embeddings de consulta

## Escopo
- parte: `R5B — cache de embeddings para perguntas recorrentes`
- branch: `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- commit funcional publicado: `2ff5ccc69ff3f81c68d48e50d4006ba12461be91`

## O que entrou
- nova tabela remota `public.embedding_cache` com `vector(768)`, `TTL` de `7` dias, `hits`, `last_hit_at` e `expires_at`
- RLS habilitada e acesso fechado a `service_role`
- helper novo em `supabase/functions/chat/embedding-cache.ts` para hash estável, parsing seguro e rotulagem de cache
- a `chat` agora tenta:
  - ler cache antes de chamar `gemini-embedding-2-preview`
  - atualizar `hits` em cache hit
  - gravar o vetor no cache em cache miss bem-sucedido
  - registrar `query_embedding_cache_status` e `expanded_query_embedding_cache_status` em `chat_metrics.metadata_json`
- a rotulagem em `query_embedding_model` passou a distinguir `cache_orig_*` e `cache_expanded_*`

## Validação local
- `npm run validate` passou com `26` suites e `106` testes

## Publicação remota
- migration aplicada: `20260405235500_add_query_embedding_cache.sql`
- deploy Supabase:
  - `chat` -> versão `32`
- deploy Vercel produção:
  - deployment id: `dpl_2LsEeDWY5T8LVm1DdhQpYYGzLogF`
  - alias: `https://clarainova02.vercel.app`

## Benchmark pós-publicação
- `Didático`:
  - `16/16 HTTP 200`
  - `16/16 noWebFallback`
  - `16/16 scopeExact`
  - `15/16 expectedAllMet`
  - `avgFinalConfidence 0.98`
- `Direto`:
  - `16/16 HTTP 200`
  - `16/16 noWebFallback`
  - `16/16 scopeExact`
  - `15/16 expectedAllMet`
  - `avgFinalConfidence 0.98`

## Observação operacional importante
- nesta janela de publicação, o provedor de embeddings continuou instável/exaurido
- evidência:
  - `search_metrics.query_embedding_model` recente permaneceu em `keyword_only_no_embedding`
  - `public.embedding_cache` permaneceu com `0` linhas logo após o benchmark canônico
- conclusão:
  - o `R5B` está implementado e publicado
  - a ativação real do cache depende da retomada das embeddings de consulta do Gemini
  - o sistema continuou operacional porque o `R5A` manteve `keyword_only_targeted` como fallback seguro

## Próxima ação
- abrir `R5C` com validação de frescor do corpus, sem tocar na frente paralela de layout
