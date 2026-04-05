# 2026-04-05 — 5E publicado com transparência editorial no grounding

## Escopo
- concluir o subbloco canônico `5E`
- enriquecer referências grounded com camada editorial e autoridade, sem alterar layout
- derivar avisos editoriais no backend a partir do mix entre núcleo, cobertura, apoio e uso interno

## Mudança funcional
- novo helper puro: `supabase/functions/chat/editorial.ts`
  - classifica `document_topic_scope` em `nucleo`, `cobertura`, `apoio` ou `interno`
  - mapeia `document_authority_level` para rótulos editoriais legíveis
  - deriva avisos editoriais a partir do perfil das referências recuperadas
- `supabase/functions/chat/knowledge.ts`
  - `KnowledgeReference` agora preserva `documentAuthorityLevel` e `documentTopicScope`
- `supabase/functions/chat/response-schema.ts`
  - `buildGroundedReferences` passou a compor `subtitulo` com `sectionTitle + camada editorial + autoridade`
  - `sanitizeStructuredResponse` agora injeta `userNotice` / `cautionNotice` editoriais sem depender da UI
- `supabase/functions/chat/index.ts`
  - o perfil editorial das referências é calculado no retrieval e reaproveitado também no grounded fallback
- testes novos/ajustados:
  - `src/test/chat-editorial.test.ts`
  - `src/test/chat-knowledge.test.ts`

## Publicação funcional
- commit funcional publicado: `76334280b3525e2c1c8c5112f6d3f568f47f3959` (`feat: add editorial transparency to grounded responses`)
- push: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- Supabase oficial:
  - Edge Function `chat` promovida para a versão `37`
- Vercel oficial:
  - preview publicado em `https://clarainova02-17m6zpbdy-wilson-m-peixotos-projects.vercel.app`
  - promoção concluída para produção
  - deploy de produção observado: `dpl_EwXNZwfygkrSL8EsN7LpqQeKcLGt`
  - URL oficial ativa: `https://clarainova02.vercel.app`

## Validação local
- `npm test -- --run src/test/chat-editorial.test.ts src/test/chat-knowledge.test.ts`
- `npm run typecheck`
- `npm run validate`
- `npm run rag:evaluate:canonical`

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
- `5E` ficou publicado com mais transparência editorial usando a UI existente: referências agora carregam sinal visível de camada e autoridade, e a resposta pode alertar quando o grounding saiu de material de cobertura/apoio
- a mudança não tocou no layout paralelo do chat; ficou concentrada na Edge Function `chat`, nos helpers puros do backend e nos testes
- o `5F` permanece operacionalizado pela trilha `R5C`, que já serve a verificação manual de frescor do manifesto/corpus como rotina contínua

## Próxima ação
- encerrar a reconciliação documental de `5C-5F`, manter `R5C` como rotina mensal de corpus e liberar a frente seguinte para o BLOCO 6 / pendências residuais de corpus
