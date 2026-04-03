# 2026-04-03 — Chat Layout Window Polish

## Objetivo

Abrir uma rodada paralela de refinamento do painel lateral do chat antes do fechamento operacional do BLOCO 4C, atacando redundâncias visuais, área útil e ações de uso recorrente sem tocar no backend nem no fluxo do corpus.

## O que foi alterado

- O painel do chat passou a abrir em `75%` da largura útil no desktop por padrão.
- O topo deixou de repetir o estado de tamanho do painel como badge e agora usa um controle explícito de `Tamanho` com presets `25 / 50 / 75 / 100`.
- A ação de `Imprimir` voltou a existir ao lado da exportação em PDF.
- O overlay externo ficou mais escuro para reduzir a competição visual com o conteúdo de fundo.
- O estado vazio foi encurtado:
  - remoção do kicker redundante
  - remoção do card intermediário de “modo selecionado”
  - título e subtítulo mais diretos
- O bloco de `Modo de resposta` foi simplificado:
  - uma explicação curta
  - opções com cores mais distintivas por modo
  - menos repetição textual
- O composer ficou mais alto por padrão e as sugestões iniciais passaram a usar grid em duas colunas no desktop.
- O helper de exportação de PDF agora também suporta impressão via nova função `printChatSessionPdf()`.

## Arquivos alterados

- `src/components/ChatSheet.tsx`
- `src/components/chat/chat-session-pdf-export.tsx`
- `src/index.css`
- `src/styles/clara-experience.css`

## Validação

- `npm run typecheck` ✅
- `npm run validate` ✅

## Resultado

O chat se aproxima mais de uma janela institucional de trabalho e menos de um onboarding persistente: mais área útil, menos repetição de estado e ações utilitárias mais claras no topo.
