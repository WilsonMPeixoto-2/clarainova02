# 2026-04-05 — Trilha prioritária R0-R6 e kickoff de execução

## Contexto

Após a auditoria completa do sistema RAG em `2026-04-04`, a leitura técnica mais recente confirmou que a CLARA já tem pipeline funcional, corpus governado com `17` documentos e baseline operacional suficientemente estável para iniciar correções estruturais antes de ampliar novos blocos.

Em `2026-04-05`, a prioridade operacional do BLOCO 5 foi formalmente reordenada para antecipar uma trilha imediata `R0-R6` antes da continuação dos subblocos `5B-5F`.

## Decisão registrada

A ordem imediata de execução passa a ser:

1. `R0` — congelar benchmark canônico e baseline reproduzível do RAG
2. `R1` — aplicar ajustes imediatos de geração sem reingestão do corpus
3. `R2` — alinhar o contrato de `gemini-embedding-2-preview` ao padrão documental atual
4. `R3` — migrar a ingestão para batch embedding nativo e re-embed controlado
5. `R4` — avaliar chunking maior com benchmark, sem intuição solta
6. `R5` — avaliar `1536` dimensões com o mesmo lote canônico
7. `R6` — retomar os subblocos `5B-5F` com a régua já estabilizada

## Motivo da mudança

- O pipeline RAG já funciona em produção e o corpus ainda é pequeno o suficiente para mudanças estruturais com risco controlado.
- O maior risco agora não é ausência de funcionalidade, mas consolidar hábitos errados antes de crescer mais corpus.
- As correções de geração e contrato de embeddings têm maior impacto imediato do que abrir novas frentes de expansão.

## Ações iniciadas nesta rodada

- registrar a nova prioridade em `docs/BLOCK_PLAN.md`, `docs/HANDOFF.md` e `.continuity/current-state.json`
- abrir `R0` com benchmark canônico e baseline reproduzível do lote atual
- iniciar `R1` no backend do chat, cobrindo:
  - `thinkingLevel` por complexidade
  - temperatura dinâmica por modo/saída
  - `maxOutputTokens` ampliado
  - roteamento de modelo por modo e complexidade
  - expansão de query com contexto curto da conversa

## Execução concluída nesta rodada

### R0 — Benchmark canônico congelado

Artefatos criados:

- `scripts/corpus/data/2026-04-05-rag-canonical-questions.json`
- `docs/operational-reports/data/latest-rag-canonical-didatico.json`
- `docs/operational-reports/data/latest-rag-canonical-didatico-summary.json`
- `docs/operational-reports/data/latest-rag-canonical-direto.json`
- `docs/operational-reports/data/latest-rag-canonical-direto-summary.json`

Evoluções implementadas:

- o avaliador em lote agora aceita `summary-output`
- o avaliador calcula resumo agregado por modo e por categoria
- o avaliador já suporta mínimos de gate local
- `package.json` agora expõe:
  - `npm run rag:evaluate:canonical:didatico`
  - `npm run rag:evaluate:canonical:direto`
  - `npm run rag:evaluate:canonical`

Resultado do baseline congelado em `2026-04-05`:

- `Didático`: `16/16` em `HTTP 200`, `16/16` sem web fallback, `16/16` com `answerScopeMatch = exact`, `16/16` com `expectedAllMet = true`, `avgFinalConfidence = 1.0`
- `Direto`: `16/16` em `HTTP 200`, `16/16` sem web fallback, `16/16` com `answerScopeMatch = exact`, `15/16` com `expectedAllMet = true`, `avgFinalConfidence = 1.0`

Observação relevante:

- a única oscilação observada no baseline `Direto` ocorreu em `Q10`, categoria `usuario_externo`, sobre o caráter pessoal e intransferível do credenciamento de usuário externo

Gate local adotado nesta rodada:

- `min-http-ok = 16`
- `min-no-web-fallback = 16`
- `min-scope-exact = 15`
- `min-expected-all-met = 15`
- `min-avg-final-confidence = 0.95`

### R1 — Ajustes imediatos de geração implementados localmente

Arquivo alterado:

- `supabase/functions/chat/index.ts`

Mudanças aplicadas:

- a expansão de query agora recebe contexto curto da conversa para resolver follow-ups elípticos
- o backend passou a construir uma estratégia de geração por complexidade
- perguntas `Didático`, com `sourceTarget`, `conceito`, `erro_sistema` ou recuperação `moderada/fraca` agora priorizam `gemini-3.1-pro-preview`
- perguntas mais simples em `Direto` continuam priorizando `gemini-3.1-flash-lite-preview`
- o backend agora define `thinkingLevel = low/high` conforme a complexidade inferida
- `maxOutputTokens` foi ampliado de `4096` para `8192`
- a temperatura deixou de ser fixa:
  - estruturado: `0.10` em `Direto`, `0.15` em `Didático`
  - stream fallback: `0.20` em `Direto`, `0.45` em `Didático`

## Validação da rodada

- `python -m py_compile scripts/corpus/evaluate_rag_batch.py` passou
- `npm run rag:evaluate:canonical` passou
- `npm run validate` passou com `17` suites e `72` testes
- `deno` não está disponível neste ambiente, então não foi possível executar uma checagem estática nativa da Edge Function fora da validação indireta do repositório

## Próxima ação recomendada

Abrir `R2` imediatamente:

- alinhar o contrato de `gemini-embedding-2-preview` a instruções textuais assimétricas por tarefa
- reduzir dependência de `taskType` como contrato principal
- revisar o uso de prefixos semânticos no conteúdo vetorial antes do re-embed controlado do corpus

## Limite desta rodada

Esta mudança de prioridade não implica, por si só, nenhuma alteração remota em GitHub, Vercel ou Supabase. Qualquer publicação remota decorrente de `R1`, `R2` ou das próximas etapas deve gerar relatório operacional próprio e atualização explícita de `docs/REMOTE_STATE.md`.
