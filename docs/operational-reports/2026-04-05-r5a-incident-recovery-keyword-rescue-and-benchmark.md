# R5A — Recuperacao do incidente, keyword-only rescue e benchmark green

## Data
- 2026-04-05

## Contexto
- O `R5A` abriu com batch embedding nativo e re-embed controlado do corpus.
- O re-embed remoto expôs um incidente externo: o provedor Gemini passou a responder `429 RESOURCE_EXHAUSTED` para embeddings e para parte da geracao.
- O benchmark canonico remoto colapsou apos o `R4B` e ficou ainda mais fragil durante a tentativa de re-embed.

## Diagnostico consolidado
- O fallback anterior de query embedding usava vetor zero e mantinha a busca hibrida contaminada.
- O corpus remoto nao desapareceu: o projeto ficou com `314` chunks ativos, mas `289` deles passaram a ter `embedding = null`.
- A indisponibilidade dominante do Gemini apareceu em dois eixos:
  - spending cap / `RESOURCE_EXHAUSTED` para embeddings
  - quota diaria do `gemini-3.1-pro` e falhas intermitentes de geracao

## Medidas aplicadas
- `d038269` — degradacao segura para `keyword_only` quando o embedding de consulta falha
  - `hybrid_search_chunks` e `fetch_targeted_chunks` passaram a aceitar `query_embedding = null` sem simular semantica por vetor zero
  - a `chat` passou a registrar `query_embedding_model = keyword_only_no_embedding` e `search_mode` coerente
- `4d4a8b4` — targeted keyword rescue
  - nova funcao SQL `fetch_targeted_keyword_chunks`
  - novo helper `keyword-rescue.ts`
  - resgate lexical dirigido por nome de documento, fonte, `topic_scope` e versao
- `1cf67a9` — grounded fallback fortalecido sob indisponibilidade do provedor
  - o fallback deterministicamente grounded deixou de usar texto herdado indevido
  - a resposta passou a ser ancorada na pergunta e nos trechos recuperados
  - `finalConfidence` e `answerScopeMatch` passaram a refletir a qualidade real do retrieval
  - o teto do rate limit por minuto foi ajustado de `15` para `24` para nao sabotar a bateria canonica

## Publicacao
- Commit funcional principal de recuperacao: `d038269` — `fix: degrade rag retrieval to keyword-only without embeddings`
- Commit funcional de resgate dirigido: `4d4a8b4` — `fix: add targeted keyword rescue for rag fallback`
- Commit funcional de fallback grounded: `1cf67a9` — `fix: strengthen grounded fallback under provider outage`
- Deploy Vercel final da rodada: `dpl_5SCxT5wjBWpGd84prMyqgibia416`
- URL oficial: `https://clarainova02.vercel.app`
- `chat` publicada na versao `31`
- `embed-chunks` mantida na versao `21`

## Validacao local
- `npm run validate`
  - `25` suites
  - `102` testes
  - apenas o warning conhecido de `SmoothScrollProvider.tsx`

## Benchmark remoto final
- `Didatico`
  - `16/16` `HTTP 200`
  - `16/16` sem web fallback
  - `16/16` `scopeExact`
  - `15/16` `expectedAllMet`
  - `avgFinalConfidence = 0.98`
- `Direto`
  - `16/16` `HTTP 200`
  - `16/16` sem web fallback
  - `16/16` `scopeExact`
  - `15/16` `expectedAllMet`
  - `avgFinalConfidence = 0.98`

## Resultado
- O sistema voltou a ficar operacional em producao mesmo com embeddings indisponiveis e quota parcial de geracao.
- O benchmark canonico remoto voltou ao gate green.
- O `R5A` pode ser tratado como fechado no eixo de resiliencia operacional.

## Proxima acao
- Abrir `R5B` com cache de embeddings para perguntas recorrentes, sem tocar na frente paralela de layout.
