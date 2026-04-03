# Main integrado e deploy de producao — BLOCO 4C

Data: 2026-04-03  
Fonte oficial integrada: `origin/main`

## Escopo

Registrar a integracao em `main` da branch `session/2026-04-03/HOME/CODEX/BLOCO-4C-INGESTION-HARDENING`, que acumulou o endurecimento da ingestão, a prova remota do BLOCO 4B, refinamentos de usabilidade do chat e novas suites de teste.

## Integracao em main

- branch integrada por fast-forward em `main`
- head integrado:
  - `6b6e28c7dfddfdf517dfea6e7c151314c086c2f9`

## O que entrou na linha principal

- prova remota do BLOCO 4B documentada e consolidada
- functions administrativas reequilibradas para autenticação por sessão + vínculo em `public.admin_users`
- pipeline do BLOCO 4C com:
  - `document_hash`
  - preflight de duplicidade
  - tratamento gracioso de corrida no insert do documento
  - concorrência controlada em `embed-chunks`
  - helpers compartilhados do contrato de embedding
  - testes mínimos do pipeline
- refinamentos de chat:
  - `ClaraMonogram`
  - `textarea` com auto-resize
  - envio por `Enter`
  - quebra de linha com `Shift+Enter`
  - resize do painel por teclado
- cobertura adicional para:
  - `Header`
  - `Footer`
  - `DocumentMeta`
  - hidratação versionada do `ChatProvider`
- caminho discreto para `/admin` no drawer móvel e no footer público

## Validacao local antes da promocao

- `npm run validate` passou
- `npm run continuity:check` passou
- suite total em `71` testes

## Producao Vercel

O push em `main` desta integracao deve gerar o deploy canônico de producao do projeto `clarainova02` via GitHub/Vercel.

## Proxima etapa oficial

1. confirmar o deploy canônico desta rodada em produção
2. repetir um upload controlado do mesmo PDF para validar deduplicação real
3. decidir o destino do legado `MODELO_DE_OFICIO_PDDE.pdf`
4. só então liberar a carga curada do corpus inicial
