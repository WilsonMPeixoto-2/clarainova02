# 2026-04-03 — Main Integration and Production Deploy (Chat Polish 3)

## Objetivo

Promover a rodada `CHAT-LAYOUT-POLISH-3` para `main` e publicar a versão correspondente em produção.

## O que foi integrado em `main`

- Persistência do tamanho da janela do chat no desktop
- Compactação do topo quando a conversa já está em andamento
- Separação mais clara entre estado vazio e conversa ativa
- Runtime fora de `online` tratado como banner completo no vazio e aviso compacto na conversa ativa
- Composer com área útil mais forte e botão de envio mais evidente

## Arquivos principais

- `src/components/ChatSheet.tsx`
- `src/index.css`
- `src/styles/clara-experience.css`
- `docs/operational-reports/2026-04-03-chat-layout-window-polish-3.md`

## Validação antes da promoção

- `npm run validate` ✅
- `npm run continuity:check` ✅

## Situação operacional

- `main` agora incorpora a terceira rodada de polimento da janela do chat
- a próxima prioridade funcional continua sendo o teste remoto de deduplicação do `BLOCO 4C`
- a discussão sobre o símbolo/identidade visual da CLARA fica aberta para a próxima etapa, sem bloquear esta publicação
