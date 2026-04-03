# 2026-04-03 — Chat Layout Window Polish 3

## Objetivo

Fechar as lacunas restantes da aba do chat sem reabrir backend nem o fluxo do corpus:

- persistir o tamanho da janela
- reduzir a densidade do topo em conversa ativa
- diferenciar melhor estado vazio e estado com conversa
- reforçar o composer como área principal de ação

## O que foi implementado

- Persistência local do tamanho da aba com `localStorage` em `src/components/ChatSheet.tsx`
- Reabertura da aba respeitando o último tamanho escolhido no desktop (`25 / 50 / 75 / 100` ou largura customizada)
- Cabeçalho mais compacto em conversa ativa, com menos redundância de status
- Runtime não-online agora usa banner completo no estado vazio e aviso compacto quando já existe conversa
- Estado vazio encurtado e mais orientado à ação
- Composer com altura maior, texto de apoio mais curto e botão de envio mais evidente

## Arquivos alterados

- `src/components/ChatSheet.tsx`
- `src/index.css`
- `src/styles/clara-experience.css`

## Validação

- `npm run validate` ✅
- `71` testes passando ✅

## Avaliação

Essa rodada fecha a maior parte do diagnóstico restante sem mudar a arquitetura do chat.

O que ainda não foi mexido deliberadamente:

- substituição do símbolo atual em `ClaraMonogram.tsx`

Esse ponto continua válido como melhoria, mas depende de decisão mais consciente de identidade visual para evitar inventar uma marca nova sem referência oficial.

## Próxima ação recomendada

- decidir se esta rodada sobe para `main` como novo polimento do chat
- depois retomar a trilha funcional do `BLOCO 4C`, cujo próximo bloqueio real continua sendo a validação remota da deduplicação por reupload do mesmo PDF
