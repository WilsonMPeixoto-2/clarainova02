# 2026-04-05 — R6A/R6B finalizados, publicados e benchmarkados

## Escopo
- fechar `R6A` com experimento benchmarkado de chunking/dimensionalidade
- fechar `R6B` com decisao objetiva sobre context caching explicito
- publicar o pacote funcional no projeto oficial, validar a `chat` no Supabase oficial e rodar a bateria canônica remota

## Publicacao funcional
- commit funcional publicado: `dde134fe0c05548b363aba5acbd0de61c5e47881` (`feat: finalize R6 rag benchmark telemetry`)
- push: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- Supabase oficial:
  - `chat` promovida para a versao `33`
- Vercel oficial:
  - tentativas diretas de `vercel --prod` retornaram `Unexpected error` na plataforma
  - recuperacao aplicada: promover o preview `https://clarainova02-o6xjboupv-wilson-m-peixotos-projects.vercel.app`
  - deploy de producao resultante: `dpl_hsq7NmMPznu5CniYa6ZFNKEsaTfT`
  - URL de producao ativa: `https://clarainova02.vercel.app`

## R6A — resultado
- artefato gerado:
  - `docs/operational-reports/data/latest-r6a-chunking-experiment.json`
  - `public/data/latest-r6a-chunking-experiment.json`
- corpus ativo avaliado: `17` documentos
- perfis comparados:
  - `current`
  - `balanced_1400`
  - `context_1800`
- resultado estrutural:
  - todos os perfis ficaram com `408` chunks
  - `avgChunkChars = 1089.29`
  - `reductionVsCurrentPct = 0.0`
- conclusao:
  - o chunking maior nao muda o corpus atual porque o pipeline continua preso a fronteiras de pagina
  - a trilha de `1536` dimensoes nao foi promovida nesta rodada
- evidencias complementares:
  - a telemetria recente de `search_metrics` mostrou `200` linhas, com:
    - `127` `keyword_only_no_embedding`
    - `33` `keyword_fallback_zero_vector`
    - `40` `gemini-embedding-2-preview:2026-04-05-r2-domain-instructions-v1`
  - isso deixa a prontidao semantica em `36.5%` de trafego recente com embedding de consulta real
- decisao:
  - `shipRuntimeChange = false`
  - manter `current`

## R6B — resultado
- artefato gerado:
  - `docs/operational-reports/data/latest-r6b-prompt-cache-readiness.json`
  - `public/data/latest-r6b-prompt-cache-readiness.json`
- mudanca tecnica publicada:
  - a `chat` agora tenta coletar telemetria de uso do provedor Gemini em respostas estruturadas e stream
  - `chat_metrics.metadata_json` ganhou chaves `provider_usage_*`
- amostra auditada apos a publicacao:
  - `200` linhas recentes de `chat_metrics`
  - `avgPromptTokens = 4508.62`
  - `p95PromptTokens = 5718`
  - `maxPromptTokens = 7072`
  - `prompt_over_10k = 0`
  - `grounded_fallback = 180/200` linhas (`90%`)
  - `providerUsageRows = 0`
  - `cacheHitRows = 0`
- conclusao:
  - o caminho dominante atual em producao ainda e `grounded_fallback`
  - portanto, o gargalo operacional nao e context caching explicito
  - enquanto o caminho do provedor nao voltar a ser dominante e estavel, nao vale priorizar cache explicito
- decisao:
  - `shipRuntimeChange = false`
  - `decision = defer_until_provider_path_recovers`

## Benchmark remoto pos-publicacao
- `Didatico`
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

## Validacao local
- `python -m py_compile scripts/corpus/evaluate_chunk_profiles.py scripts/corpus/evaluate_prompt_cache_readiness.py`
- `npm run corpus:experiment:chunking`
- `npm run corpus:analyze:prompt-cache`
- `npm test`
- `npm run validate`

## Encaminhamento
- `R6A` e `R6B` ficam encerrados nesta rodada
- a proxima frente recomendada volta para `5B-5F`
- prioridade imediata sugerida:
  1. retomar `5B` com retrieval governado por metadados reais
  2. manter `R5C` como rotina mensal de frescor do manifesto
  3. reavaliar a trilha de cache explicito apenas quando o caminho do provedor voltar a dominar a amostra operacional
