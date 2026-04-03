# 2026-04-03 — Main Integration and Production Deploy (Chat Polish)

## Objetivo

Promover para `main` a rodada de polimento da janela do chat e publicar a atualização em produção sem reabrir a frente do corpus.

## O que foi integrado

- A janela do chat passou a abrir em `75%` por padrão no desktop.
- O topo ganhou controle explícito de `Tamanho` com presets `25 / 50 / 75 / 100`.
- A ação de `Imprimir` voltou a ficar disponível ao lado da exportação em PDF.
- O estado vazio ficou mais curto e menos redundante.
- O bloco de `Modo de resposta` foi simplificado e ganhou contraste cromático melhor entre `Direto` e `Didático`.
- O composer ficou mais alto e mais protagonista.

## Origem da integração

- Branch promovida: `session/2026-04-03/HOME/CODEX/CHAT-LAYOUT-POLISH-2`
- Commit funcional promovido: `db2886b`
- Commit de continuidade da branch promovida: `f6e01ed`

## Próximo passo após a publicação

- confirmar o deploy canônico `READY` em produção
- manter como próximo bloqueio funcional do projeto o teste remoto de deduplicação via reupload do mesmo PDF no admin
