# 2026-04-05 — R4A publicado com ciclo de feedback do usuário

## Escopo
- abrir o `R4A` com feedback explícito do usuário final vinculado ao `request_id`
- fechar o ciclo `resposta -> avaliação -> persistência em query_analytics`
- manter o ajuste estritamente fora da frente de layout, limitando a UI a um controle discreto no rodapé das respostas estruturadas

## Implementação
- a `chat` agora devolve `X-Clara-Request-Id` em respostas estruturadas, texto, stream, guardrail e erros posteriores ao `request_id`
- o frontend passou a carregar esse `requestId` até a mensagem assistente e a exibir um bloco discreto de feedback em respostas estruturadas
- o fluxo novo possui:
  - `Sim` para feedback positivo imediato
  - `Não` para abrir motivos opcionais (`Não era sobre isso`, `Faltou detalhe`, `Informação errada`)
  - comentário livre opcional
- o contrato do frontend foi isolado em `src/lib/chat-feedback-api.ts`
- a UI do feedback foi isolada em `src/components/chat/ChatFeedbackControls.tsx`
- a mensagem estruturada só mostra feedback quando existe `requestId`, então preview/mock continuam sem esse bloco

## Backend
- nova migration remota aplicada: `20260405121500_add_query_feedback_fields.sql`
- `query_analytics` agora possui:
  - `user_feedback_value`
  - `user_feedback_reason`
  - `user_feedback_comment`
  - `user_feedback_source`
  - `user_feedback_submitted_at`
- nova Edge Function pública: `submit-chat-feedback`
- o handler:
  - valida payload e motivo opcional
  - localiza a linha de `query_analytics` por `request_id`
  - grava feedback e marca `needs_content_gap_review = true` em feedback negativo
  - registra `usage_logs.event_type = chat_feedback`

## Validação local
- `npm test -- src/test/chat-api.test.ts src/test/chat-feedback-api.test.ts src/test/chat-feedback-controls.test.tsx src/test/chat-persistence.test.ts` passou com `4` arquivos e `21` testes
- `npm run validate` passou com `22` suites e `94` testes
- o lint segue só com o warning conhecido de `SmoothScrollProvider.tsx`, sem erro

## Publicação
- commit funcional publicado: `79135d4bfd520b33767ffe9cfb1c0ac2682f6074`
- migration remota aplicada: `20260405121500_add_query_feedback_fields.sql`
- deploy Vercel produção: `dpl_9pD7XcrVYGbEkT6Lwa1BnY5P1Ug2`
- URL oficial: `https://clarainova02.vercel.app`
- URL de produção observada: `https://clarainova02-oycznghc3-wilson-m-peixotos-projects.vercel.app`
- Edge Function `chat`: versão `28`
- Edge Function `submit-chat-feedback`: versão `1`

## Verificação remota
- benchmark canônico remoto pós-publicação:
  - `Didático`: `16/16 httpOk`, `16/16 noWebFallback`, `15/16 scopeExact`, `16/16 expectedAllMet`, `avgFinalConfidence 0.9906`
  - `Direto`: `16/16 httpOk`, `16/16 noWebFallback`, `16/16 scopeExact`, `16/16 expectedAllMet`, `avgFinalConfidence 1.0`
- prova de ponta a ponta concluída:
  - `chat` retornou `request_id` no header `X-Clara-Request-Id`
  - `submit-chat-feedback` respondeu `ok = true`
  - a linha remota de `query_analytics` ficou com:
    - `user_feedback_value = not_helpful`
    - `user_feedback_reason = missing_detail`
    - `user_feedback_comment = "Teste automatizado do R4A."`
    - `user_feedback_source = chat_ui`

## Decisão
- `R4A` fechado com sucesso em produção
- próxima frente imediata: `R4B` com dashboard admin para perguntas sem cobertura e gaps do corpus
