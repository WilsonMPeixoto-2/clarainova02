

# Hardening do Pipeline RAG: Idempotencia, Retry com Backoff, e Eliminacao de Falsos Positivos

## Problema atual

O pipeline falha na primeira tentativa (429/rate limit do Gemini) e so funciona na segunda. Alem disso, nao ha protecao contra duplicacao de chunks ao reprocessar, nem retry automatico para erros transitorios.

## Visao geral das mudancas

4 melhorias obrigatorias distribuidas entre frontend e backend:

1. **Idempotencia** -- UNIQUE constraint no banco + upsert na Edge Function + filtragem de chunks ja existentes no frontend
2. **Retry com backoff** -- helper `withRetry` no frontend para erros 429/5xx com delays crescentes
3. **Verificacao pos-processamento** -- status "verifying" + SELECT count vs expectedChunks
4. **Erro explicito** -- nunca engolir erros do JSON de resposta

## Mudancas detalhadas

### Migration SQL

Adicionar constraint UNIQUE em `(document_id, chunk_index)` na tabela `document_chunks`. Isso permite upsert idempotente e impede duplicacao.

```sql
ALTER TABLE public.document_chunks
ADD CONSTRAINT document_chunks_doc_chunk_unique
UNIQUE (document_id, chunk_index);
```

### Edge Function `embed-chunks/index.ts`

- Trocar `.insert(rows)` por `.upsert(rows, { onConflict: "document_id,chunk_index" })` para idempotencia
- Adicionar `request_id` (UUID) em todas as respostas para rastreabilidade
- Retornar tempos de execucao (embedding_ms, db_ms) na resposta
- Manter filtragem de chunks < 3 chars existente

### Frontend `Admin.tsx`

**A1 -- Estado enriquecido por documento:**

Expandir `IngestionState` com novos campos:
- `status`: idle | extracting | vectorizing | verifying | done | partial | failed | canceled
- `expectedChunks`, `insertedChunks`
- `lastError` com message, requestId, chunkIndex, code

**A2 -- Batch com concorrencia controlada:**

Mudar `EMBED_BATCH_SIZE` de 5 para 10 (maximo aceito pela Edge Function). Envio sequencial entre lotes (sem concorrencia) para evitar throttling do Gemini.

**A3 -- Helper `withRetry`:**

```text
async function withRetry(fn, opts):
  retries = 3
  delays = [500, 1500, 3000]
  Repetir somente para:
    - HTTP 429, 500-599
    - erro de rede (fetch fail)
  NAO repetir para erros de validacao
```

Aplicado em cada chamada a `supabase.functions.invoke("embed-chunks")`.

**A4 -- Validacao de resposta:**

Apos cada invoke, verificar `fnData?.error` e `fnData?.ok === false`. Se existir erro, incluir `requestId` e `chunkIndex` no log e na UI.

**A5 -- Cancelamento real:**

O botao X ja usa AbortController. Refinar para que o loop de batches verifique `signal.aborted` antes de cada lote e marque status "canceled".

**A6 -- Verificacao pos-processamento:**

Apos enviar todos os chunks:
1. Mudar status para "verifying" com label "Verificando integridade..."
2. SELECT count de `document_chunks` onde `document_id = X`
3. Se count >= expectedChunks: marcar "done"
4. Se count > 0 mas < expectedChunks: marcar "partial" com botao "Retomar"
5. Se count = 0: marcar "failed"

**A7 -- Retomar sem duplicar (idempotencia client-side):**

No `handleRetry`:
- NAO deletar chunks existentes
- Buscar chunk_indexes ja salvos: `SELECT chunk_index FROM document_chunks WHERE document_id = X`
- Filtrar lista de envio para somente indices faltantes
- Se todos ja existem: marcar "done" direto

## Arquivos afetados

| Arquivo | Tipo | Mudanca |
|---------|------|---------|
| `supabase/functions/embed-chunks/index.ts` | Edge Function | upsert + request_id + tempos |
| `src/pages/Admin.tsx` | Frontend | withRetry, estado enriquecido, verificacao, idempotencia |
| Migration SQL | DB | UNIQUE (document_id, chunk_index) |

## Fluxo revisado

```text
Upload PDF
  |
  v
Extrair texto (pdf.js no browser)
  |
  v
Fatiar (LangChain RecursiveCharacterTextSplitter)
  |
  v
Para cada lote de 10 chunks:
  |-- withRetry(embed-chunks, retries=3, backoff)
  |-- Se 429/5xx: aguardar e repetir
  |-- Se erro de validacao: falhar imediatamente
  |-- Atualizar progress bar
  |
  v
Status "verifying"
  |-- SELECT count(*) FROM document_chunks WHERE document_id = X
  |-- count >= expected? -> "done"
  |-- count > 0 < expected? -> "partial" (botao Retomar)
  |-- count = 0? -> "failed"
  |
  v
Retomar (se partial):
  |-- Buscar chunk_indexes existentes
  |-- Enviar somente os faltantes
  |-- Repetir verificacao
```

## Criterios de aceite

- 4 PDFs simultaneos: so marca "done" se todos os chunks salvaram
- Reprocessar retoma sem duplicar (upsert + filtragem de indices)
- Chunk vazio gera erro explicito com request_id
- 429/503 se recupera com retry automatico (ate 3 tentativas)
- Status "partial" visivel quando chunks faltam

