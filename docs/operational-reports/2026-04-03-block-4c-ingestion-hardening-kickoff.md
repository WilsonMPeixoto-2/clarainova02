## BLOCO 4C — Deduplicação, paralelismo e testes do pipeline

Data: 2026-04-03  
Branch de sessão: `session/2026-04-03/HOME/CODEX/BLOCO-4C-INGESTION-HARDENING`

## Objetivo

Endurecer o pipeline de ingestão agora que o contrato novo do Gemini já foi provado em produção com um PDF real e grounding ativo.

## Estado de entrada

O BLOCO 4B foi concluído com evidência operacional:

- novo PDF real processado com `88/88` chunks e `88/88` embeddings
- `embedding_model = gemini-embedding-2-preview`
- `embedding_dim = 768`
- `embedded_at` e `chunk_metadata_json` preenchidos
- grounding público funcionando com o novo manual

## Escopo do 4C

1. deduplicação real por `document_hash`
2. paralelismo controlado na geração de embeddings
3. testes mínimos do pipeline de ingestão

## Resultado esperado

- o mesmo PDF deixa de ser reingerido silenciosamente
- o tempo por lote de embeddings cai sem pressionar quota de forma agressiva
- regressões do contrato de ingestão passam a ser detectáveis antes do deploy

## Critério de conclusão

- `document_hash` calculado e tratado como deduplicação operacional real
- `embed-chunks` processando lotes com concorrência pequena e controlada
- cobertura mínima para:
  - chunk estruturado
  - normalização
  - persistência de metadados de embedding
  - deduplicação
