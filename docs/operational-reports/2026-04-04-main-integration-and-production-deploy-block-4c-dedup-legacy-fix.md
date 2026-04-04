# 2026-04-04 — Main integration and production deploy (BLOCO 4C dedup legacy fix)

## Escopo
- Promoção para `main` da correção de deduplicação para documentos legados sem `document_hash`.
- Confirmação do deploy canônico de produção após o push em `main`.

## Commit publicado
- `1af2d84baf0b126146f128e2045c0307227863ca` — `docs(continuity): record 4c dedup legacy fix`

## Deploy canônico
- deployment id: `dpl_2J9yUxb5DoWMZuYz4LC5FnCPBDv4`
- estado: `READY`
- target: `production`

## URLs ativas
- `https://clarainova02.vercel.app`
- `https://clarainova02-wilson-m-peixotos-projects.vercel.app`
- `https://clarainova02-git-main-wilson-m-peixotos-projects.vercel.app`

## O que ficou válido em produção
- Reuploads do mesmo PDF agora fazem preflight também contra documentos legados sem hash, desde que o arquivo ainda exista no bucket para cálculo do SHA-256.
- O documento duplicado do guia já foi removido do remoto, preservando apenas o registro canônico com hash.
- O próximo teste útil volta a ser um reupload controlado na UI admin para confirmar o bloqueio gracioso de duplicidade após esta publicação.
