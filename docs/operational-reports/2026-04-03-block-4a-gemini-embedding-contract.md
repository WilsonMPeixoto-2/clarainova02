# BLOCO 4A — Alinhamento Gemini e contrato de embedding

Data: 2026-04-03  
Branch: `session/2026-04-03/HOME/CODEX/BLOCO-4A-GEMINI-EMBEDDING-CONTRACT`

## Objetivo

Alinhar o repositório principal ao estado real da pilha Gemini já adotada no ambiente e fechar o pacote técnico mínimo do novo contrato de embeddings antes da ingestão séria do corpus.

## Escopo executado nesta rodada

### 1. Modelos declarados no código

- `chat/index.ts` agora declara:
  - `gemini-3.1-flash-lite-preview`
  - `gemini-3.1-pro-preview`
- `chat/index.ts` e `embed-chunks/index.ts` agora declaram:
  - `gemini-embedding-2-preview`

### 2. Contrato do embedding novo

- Query embedding passou a usar `taskType: 'RETRIEVAL_QUERY'`
- Document embedding passou a usar `taskType: 'RETRIEVAL_DOCUMENT'`
- Embedding documental agora envia `title`

### 3. Limpeza semântica dos chunks

- `preparePdfIngestion` deixou de prefixar o conteúdo com `[Fonte: ... | Página: ...]`
- O frontend agora envia chunks estruturados com:
  - `content`
  - `pageStart`
  - `pageEnd`
  - `sectionTitle`
  - `sourceTag`
- A Edge Function foi mantida compatível com o formato legado em string para evitar ruptura silenciosa

### 4. Metadados de embedding persistidos

No `upsert` de `document_chunks`, os novos chunks passam a gravar:

- `embedding_model`
- `embedding_dim`
- `embedded_at`
- `chunk_metadata_json`
- `text_hash`
- `char_count`
- `token_count_estimate`

### 5. Normalização L2

- Query embeddings em `768` passam a ser normalizados antes do retrieval
- Document embeddings em `768` passam a ser normalizados antes da persistência

## Validação local

- `npm run validate` passou na branch de sessão

## O que ainda ficou pendente

- verificar contaminação entre gerações de embeddings no corpus remoto
- executar smoke test com 1 PDF real e 1–3 perguntas grounded
- integrar a branch em `main` e só depois refletir isso em produção

## Decisão operacional

O bloco 4 foi refinado em subetapas:

1. `4A` — alinhar código ao contrato Gemini e ao embedding novo
2. `4B` — verificar corpus remoto, smoke test e preparar deduplicação/paralelismo
3. só depois liberar a carga curada do corpus inicial
