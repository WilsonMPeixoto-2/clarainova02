# Main integrado e deploy de producao — BLOCO 4A

Data: 2026-04-03  
Fonte oficial integrada: `origin/main`

## Escopo

Registrar a integracao da branch `session/2026-04-03/HOME/CODEX/BLOCO-4A-GEMINI-EMBEDDING-CONTRACT` em `main` e confirmar o deploy canônico de produção correspondente.

## Integracao em main

- branch integrada por fast-forward em `main`
- commit integrado:
  - `df682dd1d178a326fb4f1115026f4a388daac503`
- mensagem:
  - `feat(gemini): align embedding contract before corpus ingestion`

## O que entrou na linha principal

- pilha Gemini declarada no codigo atualizada para:
  - `gemini-3.1-flash-lite-preview`
  - `gemini-3.1-pro-preview`
  - `gemini-embedding-2-preview`
- query embedding com:
  - `taskType: RETRIEVAL_QUERY`
  - normalizacao L2 em `768`
- document embedding com:
  - `taskType: RETRIEVAL_DOCUMENT`
  - `title`
  - normalizacao L2 em `768`
  - persistencia de metadados de embedding
- chunks estruturados no admin, sem prefixos artificiais no texto semantico

## Validacao local da branch antes da integracao

- `npm run validate` passou
- `npm run continuity:check` passou

## Producao Vercel

- projeto canônico: `clarainova02`
- deploy de producao observado: `READY`
- deployment id: `dpl_4XhtFxiDd3NCq49kMgLYyF3o14mH`
- commit publicado: `df682dd1d178a326fb4f1115026f4a388daac503`
- aliases observados:
  - `https://clarainova02.vercel.app`
  - `https://clarainova02-git-main-wilson-m-peixotos-projects.vercel.app`
  - `https://clarainova02-wilson-m-peixotos-projects.vercel.app`

## Proxima etapa oficial

Abrir a execucao do `BLOCO 4B`:

1. verificar o estado real do corpus remoto e possivel mistura entre geracoes de embeddings
2. decidir re-embed ou limpeza do legado
3. executar smoke test com 1 PDF real e 1–3 perguntas grounded
4. so depois liberar a carga curada do corpus inicial
