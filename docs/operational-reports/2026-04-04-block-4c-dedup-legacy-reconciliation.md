# 2026-04-04 — BLOCO 4C dedup legacy reconciliation

## Contexto
- O teste remoto de reupload do mesmo PDF (`SEI-Guia-do-usuario-Versao-final.pdf`) não validou a deduplicação como esperado.
- A investigação remota mostrou que o reupload criou um novo `document_id` com `88/88` chunks e `88/88` embeddings.
- A causa não foi falha do `document_hash` novo, e sim a presença de um registro legado do mesmo PDF criado antes da introdução do hash no fluxo de ingestão.

## O que foi provado
- O registro antigo do guia estava em `public.documents` com `document_hash = null`.
- O registro novo do mesmo guia já estava com `document_hash = 489655ddada66ef228e48b0f08cdc5838045244bfda8b997875b5de8c359ecd3`.
- Os dois arquivos armazenados no bucket `documents` possuíam o mesmo SHA-256, portanto eram bytes idênticos.
- A lógica atual de preflight por hash já impede novos duplicados quando o documento existente já tem `document_hash`, mas não cobria documentos legados sem hash.

## Correção implementada
- `src/lib/admin-ingestion.ts`
  - novo helper `computeBlobHash(blob)` para calcular SHA-256 também a partir de arquivos baixados do Storage.
- `src/pages/Admin.tsx`
  - novo passo de reconciliação de legado sem hash antes do upload.
  - a UI agora consulta candidatos legados com o mesmo `file_name`, baixa o arquivo do bucket, calcula o hash remoto e compara com o hash do PDF enviado.
  - quando houver match exato, o sistema faz backfill do `document_hash` no documento legado e bloqueia o reupload como duplicado, sem subir um novo arquivo.
- `src/test/admin-ingestion.test.ts`
  - cobertura para garantir que `File` e `Blob` com os mesmos bytes geram o mesmo SHA-256.

## Reconciliação remota executada
- O duplicado legado já criado em produção foi removido por ser comprovadamente o mesmo arquivo:
  - documento removido: `a38235c9-06f2-412f-9920-cea8c55ddf38`
  - storage removido: `b7f9535e-4297-4510-94a1-3ade84d529f5_SEI-Guia-do-usuario-Versao-final.pdf`
- O corpus canônico ficou assim:
  - `2ab139c7-5cf8-48ae-9ff8-d3ecc153e0ed`
  - `SEI-Guia-do-usuario-Versao-final.pdf`
  - `document_hash` preenchido
  - `88/88` chunks
  - `88/88` embeddings

## Validação local
- `npm run typecheck` ✅
- `npm test -- --run src/test/admin-ingestion.test.ts src/test/embedding-contract.test.ts` ✅
- `npm run validate` ✅
- `npm run continuity:check` ✅

## Estado após esta rodada
- A deduplicação por `document_hash` está funcional para:
  - documentos novos
  - documentos legados sem hash, desde que o arquivo armazenado no bucket ainda exista para cálculo do backfill
- O corpus remoto não está mais poluído pelo duplicado do guia.

## Próximo passo recomendado
- Publicar esta correção.
- Depois, executar um novo reupload controlado do mesmo PDF na UI admin para comprovar o bloqueio gracioso de duplicidade já sob a lógica corrigida.
