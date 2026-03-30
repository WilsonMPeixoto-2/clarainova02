# BLOCO 0 — Congelamento técnico e linha de base

Data de conclusão: 2026-03-30

## Objetivo

Estabelecer uma linha de base limpa, documentada e verificável antes da evolução funcional do produto.

## Alterações realizadas

- Atualização do script padrão de validação em `package.json` para usar `npm run validate` com `typecheck`, `lint`, `test` e `build`.
- Revisão do `README.md` para refletir o estado real do repositório, do fluxo de validação e do ambiente esperado.
- Revisão de `docs/MIGRATION_STATUS.md` para alinhar a documentação ao conjunto real de migrations e ao status atual do projeto.
- Revisão de `SUPABASE_SETUP.md` para remover suposições incorretas sobre variáveis e esclarecer o vínculo atual com o projeto Supabase.
- Correção de resíduos de migração de ícones em:
  - `src/components/UsageStatsCard.tsx`
  - `src/components/chat/ChatStructuredMessage.tsx`
  - `src/pages/AuthCallback.tsx`

## Resultado

- Baseline técnico estabilizado.
- Documentação interna compatível com o código atual.
- Checagem padrão consolidada em `npm run validate`.

## Validação executada

- `npm run validate`

## Observações

- Este bloco não incluiu deploy.
- Warnings de chunk grande no build permanecem visíveis, mas não bloqueiam a baseline.
