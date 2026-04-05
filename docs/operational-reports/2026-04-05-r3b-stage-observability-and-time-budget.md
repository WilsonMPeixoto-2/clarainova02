# 2026-04-05 — R3B local: observabilidade por estágio e budget real

## Objetivo
Substituir a lógica de timeout único na `chat` por um budget real de request e tornar a latência observável por estágio, sem tocar no layout do chat.

## Escopo implementado localmente
- novo helper puro em `supabase/functions/chat/timing-budget.ts`
  - budget total por request
  - decisão explícita de:
    - tentar ou não structured
    - quanto tempo reservar para stream fallback
    - quando ainda vale tentar leakage repair
  - acumulador de timings por estágio
- `supabase/functions/chat/index.ts`
  - mede:
    - `embedding_ms`
    - `expansion_ms`
    - `search_ms`
    - `generation_ms`
    - `sanitization_ms`
  - grava esses valores em `metadata_json` de `chat_metrics`
  - grava também:
    - `time_budget_ms`
    - `budget_elapsed_ms`
    - `budget_remaining_ms`
    - `structured_skipped_for_budget`
    - `structured_timeout_ms`
    - `stream_init_timeout_ms`
    - `leakage_repair_timeout_ms`
  - o fluxo estruturado agora só roda se ainda houver budget suficiente
  - o stream fallback passa a respeitar timeout compatível com o budget restante
  - leakage repair deixa de ser tentativa cega quando o request já chegou perto do limite

## Decisão operacional
- não houve mudança de schema nem migration nesta rodada
- a observabilidade foi adicionada em `metadata_json` para acelerar publicação e leitura operacional
- o layout do chat ficou fora de escopo por coexistência com outra frente paralela

## Validação local
- `npm run typecheck`
- `npx vitest run src/test/chat-timing-budget.test.ts src/test/chat-conversation-context.test.ts src/test/chat-api.test.ts`
- `npm run validate`

## Resultado local
- `npm run validate` passou com `19` suites e `87` testes
- o `R3B` está pronto para publicação em produção

## Próxima ação
- commitar e publicar o `R3B`
- rodar benchmark canônico remoto pós-deploy
- sem regressão, abrir o `R3C`
