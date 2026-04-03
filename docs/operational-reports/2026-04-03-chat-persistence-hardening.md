# 2026-04-03 — Chat Persistence Hardening

## Objetivo

Endurecer a persistencia local do chat para suportar evolucao de schema sem quebrar historicos ja salvos no navegador.

## Escopo executado

- Ajustes em [useChatStore.tsx](C:/Users/okidata/clarainova02-main-publish/src/hooks/useChatStore.tsx)
- Ampliacao da suite em [chat-persistence.test.ts](C:/Users/okidata/clarainova02-main-publish/src/test/chat-persistence.test.ts)

## O que mudou

1. **Versionamento de schema**
- O historico persistido em `localStorage` passou a ser salvo como objeto com `version` e `messages`
- A versao inicial adotada foi `1`

2. **Retrocompatibilidade**
- O loader continua aceitando o formato legado baseado em array puro
- Isso evita perder historicos antigos ja salvos em navegadores de uso real

3. **Validacao minima do payload**
- O carregamento agora verifica se o payload realmente contem mensagens com `role` e `content` validos
- Payloads invalidos continuam falhando de forma segura para `[]`

4. **Cobertura real do provider**
- A suite deixou de testar apenas o `localStorage` cru
- Agora tambem valida a hidratacao real do `ChatProvider` com payload legado e payload versionado

## Validacao

- `npm test -- src/test/chat-persistence.test.ts` passou
- `npm run validate` passou

## Resultado

- A suite total do projeto passou a `70` testes
- A persistencia do chat deixou de depender silenciosamente de um unico formato fixo
