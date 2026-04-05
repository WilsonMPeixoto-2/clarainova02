# 2026-04-05 — 5C publicado com source-target routing de alta precisão

## Escopo
- concluir o subbloco canônico `5C`
- endurecer a confirmação de fonte nomeada para evitar overboost quando a evidência semântica for fraca
- publicar a `chat`, validar benchmark e preparar o terreno para `5D`

## Mudança funcional
- `supabase/functions/chat/knowledge.ts`
  - `sourceTargetStatus` passou a diferenciar `confirmed` de `weak`
  - o boost de rota nomeada agora exige piso semântico real ou evidência explícita de versão/escopo
  - o prompt para fonte nomeada ganhou fallback específico quando a evidência é fraca
- `supabase/functions/chat/index.ts`
  - `source_target_status` passou a ser propagado até a telemetria
- `src/test/chat-knowledge.test.ts`
  - cobertura nova para caso fraco e caso forte de fonte nomeada

## Publicação funcional
- commit funcional publicado: `3bca20e5d68a1b5fe0f0ce343c0b4c90e054f37b` (`feat: harden source-target route confirmation`)
- push: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- Supabase oficial:
  - Edge Function `chat` promovida para a versão `35`
- Vercel oficial:
  - preview publicado em `https://clarainova02-guz38mj5n-wilson-m-peixotos-projects.vercel.app`
  - promoção concluída para produção
  - deploy de produção observado: `dpl_2mLgBhTxWCkrF9LfJxLPVTBmBsNz`
  - URL oficial ativa: `https://clarainova02.vercel.app`

## Validação local
- `npm test -- --run src/test/chat-knowledge.test.ts`
- `npm run validate`

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
- `5C` ficou publicado com roteamento por fonte nomeada mais seguro e menos propenso a induzir a resposta para material tangencial
- o pacote não tocou no layout paralelo do chat; ficou restrito à Edge Function `chat` e aos testes do RAG

## Próxima ação
- abrir `5D` para deixar `Direto` e `Didático` mais distintos também no contrato textual e na renderização da resposta
