# 2026-04-05 — R4B publicado em produção com dashboard admin de gaps

## Escopo desta rodada
- fechar `R4B` com exposição operacional de perguntas sem cobertura no painel admin
- manter a frente paralela de layout intacta
- publicar a web e a Edge Function `get-usage-stats`
- verificar o estado remoto e registrar benchmark pós-publicação

## Implementação
- Ampliei `supabase/functions/get-usage-stats/index.ts` para retornar:
  - `content_gap_topics`
  - `recent_content_gaps`
- O cálculo cruza `query_analytics` e `chat_metrics`, puxando:
  - `topic_label`
  - `needs_content_gap_review`
  - `gap_reason`
  - `rag_quality_score`
  - `expanded_query`
  - feedback explícito do usuário (`user_feedback_*`)
- Ampliei [UsageStatsCard.tsx](/C:/Users/okidata/clarainova02/src/components/UsageStatsCard.tsx) para exibir:
  - agrupamento por tópico
  - lista recente de casos editoriais
  - badges de sinal (`Sem cobertura`, `Baixa confiança`, `Feedback negativo`)
  - expansão aplicada e observação do usuário quando existirem
- Atualizei [types.ts](/C:/Users/okidata/clarainova02/src/integrations/supabase/types.ts) para refletir os campos de feedback publicados no `R4A`.
- Adicionei cobertura dedicada em [UsageStatsCard.test.tsx](/C:/Users/okidata/clarainova02/src/test/UsageStatsCard.test.tsx).

## Validação local
- `npm run validate` passou.
- Resultado local:
  - `23` suites
  - `95` testes
- O lint continuou sem erro; permaneceu apenas o warning já conhecido em `SmoothScrollProvider.tsx`.

## Publicação
- Commit funcional publicado: `f95273f` — `feat: add admin content gap dashboard`
- Branch publicada: `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- Edge Function publicada:
  - `get-usage-stats` `v12`
- Deploy web produção:
  - `dpl_J37W4zYAhPYbK53B5aVvpaeqnTJX`
  - `https://clarainova02.vercel.app`
  - `https://clarainova02-7z0u4vb0l-wilson-m-peixotos-projects.vercel.app`

## Verificação remota
- `vercel inspect clarainova02.vercel.app` retornou deploy `READY`.
- `supabase functions list --project-ref jasqctuzeznwdtbcuixn` confirmou `get-usage-stats` em `v12`.
- Não houve edição de schema nem deploy adicional de `chat` nesta rodada.

## Benchmark pós-publicação
- O benchmark canônico remoto executado logo após o `R4B` não ficou green.
- Resultado observado:
  - `Didático`: `scopeExact 0/16`, `expectedAllMet 1/16`, `avgFinalConfidence 0.59`
  - `Direto`: `scopeExact 0/16`, `expectedAllMet 1/16`, `avgFinalConfidence 0.59`
- Sintoma dominante:
  - respostas desviando para `Guia documental localizado`
  - concentração de citações no Decreto Rio nº 57.250
- Leitura técnica:
  - o `R4B` foi admin-only e não alterou `chat`, `embed-chunks`, corpus, migrations nem scoring
  - o drift foi tratado como incidente concomitante do pipeline de chat/retrieval, não como regressão introduzida pelo dashboard do admin

## Decisão
- `R4B` permanece válido e publicado em produção.
- A prioridade seguinte sobe para `R5A`, com batch embedding nativo e re-embed controlado do corpus, porque o benchmark remoto atual sugere degradação material de retrieval.
