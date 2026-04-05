# 2026-04-05 — 5B publicado com retrieval governado por metadados reais

## Escopo
- concluir o subbloco canônico `5B`
- empurrar a governança de `topic_scope`, `source_name`, `document name` e `version_label` para a própria busca híbrida em SQL
- publicar a migration remota, redeployar a `chat`, validar benchmark e deixar a continuidade pronta para `5C`

## Mudança funcional
- novo helper: `supabase/functions/chat/retrieval-governance.ts`
- `buildDocumentRescuePlan` agora alimenta filtros reais do RPC `hybrid_search_chunks`
- a `chat` tenta primeiro uma busca híbrida governada por metadados; se não houver resultado suficiente, volta para a busca aberta
- novos rótulos operacionais de busca:
  - `hybrid_governed`
  - `keyword_only_governed`
- migration remota aplicada:
  - `20260406000500_add_metadata_filters_to_hybrid_search.sql`

## Publicação funcional
- commit funcional publicado: `43ad740133f7e6fa96798dcf58f32bf0921a5659` (`feat: add metadata-governed hybrid retrieval`)
- push: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- Supabase oficial:
  - migration `20260406000500_add_metadata_filters_to_hybrid_search.sql` aplicada com `supabase db push`
  - Edge Function `chat` promovida para a versão `34`
- Vercel oficial:
  - preview local publicado em `https://clarainova02-fkvctibft-wilson-m-peixotos-projects.vercel.app`
  - promoção concluída para produção
  - deploy de produção observado no alias oficial: `dpl_BEb1nZLVzF58hbdoi3EjgJJnumoJ`
  - URL oficial ativa: `https://clarainova02.vercel.app`

## Validação local
- `npm test -- chat-keyword-rescue chat-retrieval-governance chat-retrieval-mode`
- `npm run typecheck`
- `npm run validate`

## Benchmark remoto pós-publicação
- `Didático`
  - `16/16` `HTTP 200`
  - `16/16` `noWebFallback`
  - `16/16` `scopeExact`
  - `15/16` `expectedAllMet`
  - `avgFinalConfidence = 0.98`
- `Direto`
  - `16/16` `HTTP 200`
  - `16/16` `noWebFallback`
  - `16/16` `scopeExact`
  - `15/16` `expectedAllMet`
  - `avgFinalConfidence = 0.98`

## Resultado
- `5B` fica publicado com busca híbrida governada por metadados reais, sem regressão do benchmark canônico
- a mudança não tocou no layout paralelo do chat; ficou concentrada em SQL, Edge Function `chat` e testes

## Próxima ação
- abrir `5C` com source-target routing de alta precisão, aproveitando a nova governança no próprio SQL em vez de depender só do reranking posterior
