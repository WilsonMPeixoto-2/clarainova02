# 2026-04-05 — 5D publicado com contratos mais nítidos entre Direto e Didático

## Escopo
- concluir o subbloco canônico `5D`
- reforçar a distinção entre `Direto` e `Didático` no contrato estruturado e no texto plano
- publicar a `chat`, validar benchmark e preparar `5E`

## Mudança funcional
- `supabase/functions/chat/response-schema.ts`
  - `Didático` passou a tender para `modoResposta = combinado` quando há passos + apoios de leitura
  - `Direto` ficou mais enxuto em destaques, process states e explicações auxiliares
  - a renderização em texto plano passou a diferenciar claramente:
    - `Checklist rapido` / `Conferencia final` para `Direto`
    - `Orientacao inicial` / `Passo a passo guiado` / `Termos importantes` para `Didático`
- `src/lib/clara-response.ts`
  - espelhamento das regras do backend para manter consistência em preview, exportação e testes
- testes atualizados:
  - `src/test/clara-response.test.ts`
  - `src/test/clara-response-mode.test.ts`

## Publicação funcional
- commit funcional publicado: `859e606600f9353c18f700d5c1f0bf465ec1daa6` (`feat: sharpen direct and didactic response contracts`)
- push: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- Supabase oficial:
  - Edge Function `chat` promovida para a versão `36`
- Vercel oficial:
  - preview publicado em `https://clarainova02-o966wqmik-wilson-m-peixotos-projects.vercel.app`
  - promoção concluída para produção
  - deploy de produção observado: `dpl_8mQPTsQpidQN4VMdg7rM7tN2CxXP`
  - URL oficial ativa: `https://clarainova02.vercel.app`

## Validação local
- `npm test -- --run src/test/clara-response.test.ts src/test/clara-response-mode.test.ts`
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
- `5D` ficou publicado com modos de resposta semanticamente mais distintos sem reabrir a frente de layout
- a CLARA agora preserva melhor a promessa do modo escolhido, tanto na resposta estruturada quanto na exportação/renderização em texto

## Próxima ação
- abrir `5E` para dar mais transparência editorial ao grounding, usando a UI existente e sem colidir com a frente paralela de layout
