# 2026-04-05 — R3C publicado em produção e benchmark remoto

## Escopo
- concluir o `R3C` com telemetria explícita de tamanho de prompt e do histórico enviado
- publicar a rodada sem tocar no layout do chat além de um ajuste mínimo de provider para voltar a cumprir o lint do branch atual

## Implementação funcional
- a Edge Function `chat` agora calcula um breakdown explícito de prompt em `metadata_json` de `chat_metrics`
- os campos novos registrados por request incluem:
  - `prompt_tokens_total`
  - `prompt_tokens_system`
  - `prompt_tokens_response_mode`
  - `prompt_tokens_retrieval_quality`
  - `prompt_tokens_source_target`
  - `prompt_tokens_knowledge_context`
  - `prompt_tokens_history`
  - `prompt_chars_total`
  - `history_chars_total`
  - `history_message_count`
  - `history_user_message_count`
  - `history_assistant_message_count`
  - `prompt_over_10k`
- o cálculo foi extraído para `supabase/functions/chat/prompt-telemetry.ts` com testes dedicados em `src/test/chat-prompt-telemetry.test.ts`
- o `recordTelemetry` agora passa a usar o total calculado do helper em vez de recomputar apenas `systemPromptWithContext + chatMessages`
- o caminho de falha de geração também grava o mesmo breakdown de prompt, preservando observabilidade mesmo quando o modelo falha

## Ajuste mínimo fora do RAG
- `src/components/providers/SmoothScrollProvider.tsx` recebeu um ajuste mínimo para remover um erro real de lint do React (`refs during render`)
- o objetivo desse ajuste foi apenas restaurar a automação de validação do branch atual
- não houve mudança de layout, nem reabertura da frente visual em que outra ferramenta já está trabalhando

## Validação local
- `npm test -- src/test/chat-prompt-telemetry.test.ts src/test/chat-timing-budget.test.ts src/test/chat-conversation-context.test.ts` passou com `3` arquivos e `11` testes
- `npm run validate` passou com `20` suites e `90` testes
- o build continuou emitindo apenas os warnings conhecidos de chunks grandes

## Publicação remota
- commit funcional publicado: `ac237c0c2473c9f3c0fb5e57c3cce939177b2933`
- branch publicada: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- deploy Vercel produção: `dpl_EGa5TVJ7eKLAKNKZzRzskH96cxK9`
- URL oficial ativa: `https://clarainova02.vercel.app`
- URL de produção observada: `https://clarainova02-3ujxtx771-wilson-m-peixotos-projects.vercel.app`
- Edge Function `chat`: versão `27`

## Benchmark remoto pós-publicação
- `Didático`: `16/16 httpOk`, `16/16 noWebFallback`, `15/16 scopeExact`, `16/16 expectedAllMet`, `avgFinalConfidence 0.9906`
- `Direto`: `16/16 httpOk`, `16/16 noWebFallback`, `16/16 scopeExact`, `16/16 expectedAllMet`, `avgFinalConfidence 1.0`

## Decisão
- `R3C` fechado com sucesso em produção
- próxima frente imediata: `R4A` com feedback explícito do usuário vinculado a `request_id`
