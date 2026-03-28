# Setup do Supabase Proprio

Este projeto ja nao depende do backend Lovable. O objetivo e ligar o codigo a um projeto Supabase controlado por voce.

## Checklist Completo de Conexao

### 1. Pre-requisitos

- [ ] Conta no Supabase (supabase.com)
- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Chave da API Google Gemini (`GEMINI_API_KEY`)
- [ ] Node 20+ e npm instalados

### 2. Criar o projeto Supabase

- [ ] Dashboard Supabase > New Project
- [ ] Regiao: escolher a mais proxima (ex: sa-east-1 para Brasil)
- [ ] Anotar: `Project URL`, `anon/public key`, `service_role key`, `project-ref`

### 3. Configurar arquivos locais

```sh
cp .env.example .env
cp supabase/functions/.env.example supabase/functions/.env.local
```

Preencher `.env`:
```
VITE_SUPABASE_PROJECT_ID=<project-ref>
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-public-key>
```

Preencher `supabase/functions/.env.local`:
```
GEMINI_API_KEY=<sua-chave-gemini>
```

### 4. Linkar e aplicar banco

```sh
supabase link --project-ref <project-ref>
supabase db push
```

Isso aplica as 19 migrations que criam:
- Tabelas: `documents`, `document_chunks`, `usage_logs`, `rate_limits`, `ingestion_jobs`, `document_processing_events`, `chat_metrics`, `search_metrics`, `query_analytics`
- Extensao: `vector` (pgvector, 768 dimensoes)
- Funcoes: `hybrid_search_chunks`, `check_rate_limit`
- Indices: IVFFlat para busca vetorial, GIN para full-text search (portugues)
- Storage bucket: `documents` (para PDFs)

### 5. Deploy das Edge Functions

```sh
supabase functions deploy chat
supabase functions deploy embed-chunks
supabase functions deploy get-usage-stats
supabase secrets set GEMINI_API_KEY=<sua-chave-gemini>
```

### 6. Configurar Vercel (producao)

No dashboard do Vercel (Settings > Environment Variables), adicionar:

| Variavel | Valor |
|----------|-------|
| `VITE_SUPABASE_PROJECT_ID` | `<project-ref>` |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `<anon-public-key>` |

Depois, fazer redeploy: Vercel Dashboard > Deployments > Redeploy (ultimo commit).

### 7. Testar a conexao

- [ ] Abrir clarainova02.vercel.app > chat deve sair do modo preview para online
- [ ] Enviar uma mensagem > deve retornar resposta do Gemini (mesmo sem documentos)
- [ ] Abrir /admin > login com Google deve funcionar
- [ ] Upload de PDF no admin > deve chunkar e gerar embeddings
- [ ] Nova pergunta no chat > deve buscar nos chunks carregados (RAG ativo)

### 8. Validacao do pipeline RAG

Apos o primeiro upload de PDF:

```sql
-- Verificar chunks com embeddings
SELECT id, document_id, chunk_index,
       length(content) as content_len,
       embedding IS NOT NULL as has_embedding
FROM document_chunks
ORDER BY created_at DESC LIMIT 10;

-- Testar busca hibrida
SELECT * FROM hybrid_search_chunks(
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

**Frontend** (Vite, publicas):
- `VITE_SUPABASE_URL` — URL do projeto
- `VITE_SUPABASE_PUBLISHABLE_KEY` — chave anonima (publica)
- `VITE_SUPABASE_PROJECT_ID` — referencia do projeto

**Edge Functions** (privadas, Deno runtime):
- `SUPABASE_URL` — injetada automaticamente pelo Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — injetada automaticamente
- `GEMINI_API_KEY` — configurada via `supabase secrets set`

## Seguranca (pos-bootstrap)

Apos confirmar que tudo funciona, endurecer:

- [ ] Restringir RLS: remover policies publicas de INSERT/UPDATE em `documents` e `document_chunks`
- [ ] Adicionar policy: apenas usuarios autenticados podem inserir
- [ ] Habilitar `verify_jwt = true` nas Edge Functions
- [ ] Revisar bucket `documents`: restringir upload a usuarios autenticados
- [ ] Configurar Google OAuth no Supabase (Authentication > Providers > Google)
- [ ] Adicionar redirect URLs no Google Cloud Console para OAuth
