# Setup do Supabase Proprio

Este projeto ja nao depende do backend Lovable. O objetivo deste guia e ligar o codigo a um projeto Supabase sob sua propria titularidade, preservando a arquitetura atual da CLARA.

## Checklist completo de conexao

### 1. Pre-requisitos

- [ ] Conta no Supabase
- [ ] Supabase CLI instalada
- [ ] `GEMINI_API_KEY`
- [ ] Node `24.14.1` e npm instalados

### 2. Criar ou escolher o projeto Supabase

- [ ] Dashboard Supabase > New Project
- [ ] Escolher a regiao adequada
- [ ] Anotar:
  - `Project URL`
  - `anon/public key`
  - `service_role key`
  - `project-ref`

### 3. Configurar arquivos locais

```sh
cp .env.example .env
cp supabase/functions/.env.example supabase/functions/.env.local
```

Preencher `.env`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-public-key>
```

Preencher `supabase/functions/.env.local`:

```env
GEMINI_API_KEY=<sua-chave-gemini>
```

### 4. Relinkar o repositorio, se necessario

O repositorio hoje esta linkado ao projeto de referencia `jasqctuzeznwdtbcuixn` em `supabase/config.toml`.

Se voce for operar com um projeto seu:

```sh
supabase link --project-ref <project-ref>
```

### 5. Aplicar o banco

```sh
supabase db push
```

Isso aplica as **19 migrations** versionadas no repositorio, incluindo:

- tabelas de documentos, chunks, metricas e analytics
- extensao `vector`
- funcoes `hybrid_search_chunks` e `check_rate_limit`
- policies e endurecimentos de acesso

### 6. Publicar as Edge Functions

```sh
supabase functions deploy chat
supabase functions deploy embed-chunks
supabase functions deploy get-usage-stats
supabase secrets set GEMINI_API_KEY=<sua-chave-gemini>
```

### 7. Configurar o Vercel

No dashboard do Vercel, conferir ou adicionar:

| Variavel | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `<anon-public-key>` |

Depois, publicar novo deploy.

### 8. Testar a conexao

- [ ] `npm run validate`
- [ ] `npm run dev`
- [ ] O frontend sai do modo de preparacao
- [ ] O chat responde sem erro
- [ ] `/admin` conclui autenticacao real
- [ ] Upload administrativo funciona
- [ ] `get-usage-stats` responde com JWT valido

### 9. Validar o pipeline RAG

Apos o primeiro upload real:

- [ ] `document_chunks` populado com embeddings
- [ ] `hybrid_search_chunks` retornando trechos relevantes
- [ ] O chat grounded cita referencias de forma coerente

Exemplos de verificacao:

```sql
SELECT id, document_id, chunk_index, embedding IS NOT NULL AS has_embedding
FROM document_chunks
ORDER BY created_at DESC
LIMIT 10;
```

```sql
SELECT *
FROM hybrid_search_chunks(
  '<embedding-json-768d>',
  'como criar documento no SEI',
  8
);
```

## Desenvolvimento local

```sh
supabase start
supabase functions serve --env-file supabase/functions/.env.local
npm run dev
```

## Variaveis de ambiente

### Frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Edge Functions

- `SUPABASE_URL` — injetada automaticamente
- `SUPABASE_SERVICE_ROLE_KEY` — injetada automaticamente
- `GEMINI_API_KEY` — configurada via `supabase secrets set`

## Observacoes operacionais

- O frontend nao precisa de `VITE_SUPABASE_PROJECT_ID` para funcionar.
- Sem as env vars do frontend, a CLARA entra em modo de preparacao.
- Sem usuario administrativo real no Supabase Auth, o admin nao fica operacional.
- Sem corpus inicial, o RAG continua estruturalmente pronto, mas ainda nao provado.
