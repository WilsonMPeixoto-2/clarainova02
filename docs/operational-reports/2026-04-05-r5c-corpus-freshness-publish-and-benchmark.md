# 2026-04-05 — R5C publicado: validação de frescor do corpus

## Escopo
- parte: `R5C — validação de frescor do corpus`
- branch: `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- commit funcional publicado: `ec5e5ecb76a2237cf70c175b39778cf13e93a502`

## O que entrou
- script novo `scripts/corpus/validate_corpus_freshness.py`
- comando `npm run corpus:validate:freshness`
- geração de artefatos versionados:
  - `docs/operational-reports/data/latest-corpus-freshness.json`
  - `public/data/latest-corpus-freshness.json`
- o card administrativo de métricas agora também mostra o resumo do último relatório de frescor do manifesto

## Resultado da checagem atual
- manifesto verificado: `17/17` entradas com URL
- resumo:
  - `6` fontes classificadas como `current`
  - `0` fontes classificadas como `changed`
  - `0` falhas duras de request após fallback SSL
  - `11` fontes ficaram em `headers_missing`, porque a origem não expôs `Last-Modified` nem `ETag` úteis
- a checagem atual é conservadora: quando a origem não oferece cabeçalhos suficientes, o sistema sinaliza monitoramento em vez de assumir mudança

## Validação local
- `python -m py_compile scripts/corpus/validate_corpus_freshness.py` passou
- `npm run corpus:validate:freshness` passou
- `npm run validate` passou com `26` suites e `106` testes

## Publicação remota
- deploy Vercel produção:
  - deployment id: `dpl_DFaFmyNSNUzJshS7R2oeGAK5n8mM`
  - alias: `https://clarainova02.vercel.app`
- verificação direta:
  - `https://clarainova02.vercel.app/data/latest-corpus-freshness.json` respondeu com o relatório publicado

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

## Próxima ação
- abrir `R6A` com experimentos benchmarkados de chunking e dimensionalidade, mantendo a frente de layout intocada
