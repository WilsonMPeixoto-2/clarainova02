# 2026-04-05 — Commit, push e deploy de produção do pacote R0-R2

## Escopo publicado

Pacote publicado:

- `R0` — benchmark canônico, baseline e gate local
- `R1` — estratégia de geração por complexidade no backend do chat
- `R2` — contrato textual assimétrico de embeddings e separação entre semântica vetorial e metadado de citação

## GitHub

- branch publicada: `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- commit publicado: `921a29bfcdbc20295d265490b5694a5327f48832`
- mensagem do commit: `feat: ship R0-R2 rag stabilization`

## Vercel

- tipo de publicação: deploy manual por CLI, em produção
- deployment id: `dpl_6PmUpzDwgk7qTezehN8qbUxLTYjC`
- inspector: `https://vercel.com/wilson-m-peixotos-projects/clarainova02/6PmUpzDwgk7qTezehN8qbUxLTYjC`
- URL primária do deployment: `https://clarainova02-ls5nz160f-wilson-m-peixotos-projects.vercel.app`
- alias canônico ativo: `https://clarainova02.vercel.app`
- status final observado: `READY`

## Supabase

Functions publicadas:

- `chat` -> versão `23` em `2026-04-05 06:29:37 UTC`
- `embed-chunks` -> versão `17` em `2026-04-05 06:29:43 UTC`

Observação:

- `get-usage-stats` permaneceu em `11`, sem alteração nesta rodada

## Observação operacional importante

Este deploy colocou a produção à frente de `origin/main`.

Ou seja:

- `origin/main` continua sendo a fonte oficial de verdade integrada
- a produção agora reflete manualmente o commit `921a29b` da branch de sessão
- a reconciliação futura com `main` precisa preservar esse fato para não parecer regressão quando houver nova publicação por integração Git

## Validação usada antes da publicação

- `npm run validate` passou com `17` suites e `74` testes
- `npm run rag:evaluate:canonical` já havia passado localmente na rodada do `R0`
- `supabase functions deploy chat --project-ref jasqctuzeznwdtbcuixn`
- `supabase functions deploy embed-chunks --project-ref jasqctuzeznwdtbcuixn`

## Próxima ação recomendada

Seguir com `R3`, mantendo o protocolo acordado:

1. implementar
2. validar localmente
3. `commit`
4. `push`
5. deploy em produção
6. registrar o estado remoto imediatamente após a publicação
