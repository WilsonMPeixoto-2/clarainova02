# BLOCO 4 — Governanca documental e estrategia de alimentacao inicial do RAG

Data de conclusao: 2026-03-30

## Objetivo

Materializar a politica de corpus da CLARA antes da primeira ingestao ampla, com governanca suficiente no admin e uma estrategia operacional clara para o corpus inicial.

## Alteracoes realizadas

- Revisao e ampliacao da classificacao documental em `src/lib/knowledge-document-classifier.ts`:
  - arrays e labels exportados para o admin
  - recomendacao de categoria de corpus e prioridade de ingestao
- Criacao do resolvedor de governanca em `src/lib/admin-governance.ts`:
  - consolidacao entre classificacao automatica e override manual
  - resolucao de `topic_scope`, `document_kind`, `authority_level`, `search_weight`, `is_active`, `corpus_category` e `ingestion_priority`
  - parser para leitura da governanca na lista de documentos
- Evolucao do fluxo do admin em `src/pages/Admin.tsx`:
  - perfil de governanca do lote antes do upload
  - persistencia dos metadados no `documents`
  - `metadata_json` enriquecido com curadoria, justificativa e scores do classificador
- Revisao da UI administrativa em:
  - `src/components/admin/AdminUploadCard.tsx`
  - `src/components/admin/AdminDocumentsCard.tsx`
  - `src/components/admin/AdminPageHeader.tsx`
  - `src/components/admin/admin-types.ts`

## Documentacao operacional criada

- `docs/corpus-governance.md`
- `docs/corpus-ingestion-playbook.md`

Esses documentos fixam:

- categorias do corpus
- metadados obrigatorios e complementares
- regra de prioridade documental
- sequencia recomendada da primeira carga
- criterio para manter materiais internos fora do chat

## Verificacoes realizadas

- `npm run validate`
- cobertura adicional em:
  - `src/test/admin-governance.test.ts`
  - `src/test/knowledge-document-classifier.test.ts`
- atualizacao da documentacao central em:
  - `README.md`
  - `docs/MIGRATION_STATUS.md`

## Resultado

- O admin agora consegue inserir documentos com governanca suficiente para evitar ingestao improvisada.
- O corpus inicial ganhou politica clara de prioridade, peso e ativacao.
- Materiais tecnicos da propria CLARA passam a ser empurrados para fora do chat por padrao quando a classificacao ficar automatica.
- O projeto ficou pronto para entrar no `BLOCO 5` com uma base minima real, sem precisar decidir a curadoria no improviso.

## Observacoes

- Este bloco nao fez ingestao ampla nem provou o RAG com corpus real; ele apenas preparou o sistema correto para essa etapa.
- Nao foi necessario criar migration nova neste bloco, porque a estrutura atual de `documents` e `metadata_json` ja acomodava a governanca definida.
