# 2026-04-06 — Q3/Q4 local: simplificação da resposta e piso crítico de fallback

## Contexto
- O `quality-first reset` entrou na fase em que a CLARA precisava deixar de servir ao próprio sistema e voltar a servir principalmente a resposta.
- `Q1` e o primeiro corte de `Q2` já estavam validados localmente; nesta rodada, o foco foi fechar `Q3` e `Q4` sem conflitar desnecessariamente com a frente paralela de layout.

## Q3 — Simplificação do contrato de resposta e da moldura visível
- O prompt didático em [supabase/functions/chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts) deixou de exigir camadas artificiais como `veredito inicial`, `detalhamento complementar` e comentários sobre o próprio formato.
- O adaptador/sanitizador de resposta em [supabase/functions/chat/response-schema.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/response-schema.ts) e [src/lib/clara-response.ts](/C:/Users/okidata/clarainova02/src/lib/clara-response.ts) agora:
  - remove `termosDestacados` da resposta final
  - zera `processStates`
  - reduz `userNotice` a `null` por padrão
  - mantém `cautionNotice` apenas quando ele realmente muda a segurança da orientação
  - reduz observações finais para o mínimo útil
- O plain text passou a usar rótulos simples: `Resposta principal`/`Passos`, `Antes de concluir` e `Fontes`.
- O renderer em [src/components/chat/ChatStructuredMessage.tsx](/C:/Users/okidata/clarainova02/src/components/chat/ChatStructuredMessage.tsx) deixou de expor:
  - badge visível de confiança
  - `Guia didático`
  - `Veredito inicial`
  - trilha de `processStates`
  - nuvem de destaques editoriais
- A resposta visível ficou reduzida a:
  - resposta
  - passos
  - cautelas quando realmente existirem
  - fontes
  - feedback do usuário

## Q4 — Piso crítico de fallback
- O fallback grounded ganhou playbooks explícitos em [supabase/functions/chat/emergency-playbooks.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/emergency-playbooks.ts) para rotinas que ainda escapavam ao piso emergencial:
  - `assinar documento interno`
  - `despacho x ofício`
  - `notificações/prazos`
- A intenção desta rodada foi garantir que, mesmo sob falha de provedor, dúvidas operacionais recorrentes não voltem a cair em montagem frouxa de chunks.

## Testes
- Novos testes:
  - [src/test/ChatStructuredMessage.test.tsx](/C:/Users/okidata/clarainova02/src/test/ChatStructuredMessage.test.tsx)
  - [src/test/chat-emergency-playbooks.test.ts](/C:/Users/okidata/clarainova02/src/test/chat-emergency-playbooks.test.ts)
- Testes ajustados:
  - [src/test/clara-response.test.ts](/C:/Users/okidata/clarainova02/src/test/clara-response.test.ts)
  - [src/test/clara-response-mode.test.ts](/C:/Users/okidata/clarainova02/src/test/clara-response-mode.test.ts)

## Validação local
- `npm test -- src/test/clara-response.test.ts src/test/ChatStructuredMessage.test.tsx src/test/chat-emergency-playbooks.test.ts src/test/chat-generation-strategy.test.ts src/test/chat-telemetry-quality.test.ts` passou.
- `npm run typecheck` passou.
- `npm run validate` passou com `33` suites e `131` testes.
- Permanece apenas o warning conhecido de Fast Refresh em [SmoothScrollProvider.tsx](/C:/Users/okidata/clarainova02/src/components/providers/SmoothScrollProvider.tsx).

## Publicação
- Esta rodada ficou **local**.
- Motivo: o workspace ainda contém arquivos paralelos de layout/dependências (`package.json`, `package-lock.json` e outros deltas fora do pacote RAG/backend) que não devem ser empacotados cegamente junto com `Q1-Q4`.

## Próximo passo
- Preparar uma publicação limpa do pacote local `Q1-Q4`.
- Depois abrir `Q5`, impedindo que documento entre ativo sem embedding válido e separando ingestão pesada do caminho quente do chat.
