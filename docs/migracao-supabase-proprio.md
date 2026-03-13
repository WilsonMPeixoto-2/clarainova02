# Migracao Para Supabase Proprio

Este guia tira o `clarainova02` do backend gerenciado pelo Lovable e coloca o projeto sob um Supabase da sua conta.

## O que ja esta pronto neste repositorio

- Frontend publicado de forma independente na Vercel.
- Migrations versionadas em [`supabase/migrations`](C:/Users/02790830/OneDrive%20-%20Secretaria%20Municipal%20de%20Educa%C3%A7%C3%A3o%20da%20Cidade%20do%20Rio%20de%20Janeiro/Documents/Playground/clarainova02/supabase/migrations).
- Edge Functions em [`supabase/functions`](C:/Users/02790830/OneDrive%20-%20Secretaria%20Municipal%20de%20Educa%C3%A7%C3%A3o%20da%20Cidade%20do%20Rio%20de%20Janeiro/Documents/Playground/clarainova02/supabase/functions).
- Correcao mais recente do fluxo `knowledge-base first` no chat, ja commitada no `main`.

## O que NAO migra automaticamente

- Dados que hoje estao no banco gerenciado pelo Lovable.
- Arquivos PDF que estejam apenas no bucket remoto do projeto atual.
- Secrets customizados que existiam no ambiente gerenciado.

Se voce nao tiver copia local dos PDFs usados como base de conhecimento, sera preciso recuperar esses arquivos manualmente antes ou depois da migracao.

## Pre-requisitos

1. Criar uma conta em [Supabase](https://supabase.com).
2. Criar um projeto novo.
3. Anotar estes dados do projeto novo:
   - `project ref`
   - senha do banco
   - `Project URL`
   - `anon/publishable key`
4. Ter login no Vercel e no GitHub.

## Passo 1: instalar e autenticar o Supabase CLI

No PowerShell:

```powershell
npx supabase --version
npx supabase login
```

Se preferir usar token:

```powershell
npx supabase login --token SEU_SUPABASE_ACCESS_TOKEN
```

## Passo 2: linkar este repositorio ao projeto novo

No diretorio do projeto:

```powershell
cd "C:\Users\02790830\OneDrive - Secretaria Municipal de Educação da Cidade do Rio de Janeiro\Documents\Playground\clarainova02"
npx supabase link --project-ref SEU_PROJECT_REF -p SUA_SENHA_DO_BANCO
```

O CLI passa a usar o projeto novo como destino padrao para `db push` e `functions deploy`.

## Passo 3: aplicar todas as migrations

Este repositorio tem 10 migrations em [`supabase/migrations`](C:/Users/02790830/OneDrive%20-%20Secretaria%20Municipal%20de%20Educa%C3%A7%C3%A3o%20da%20Cidade%20do%20Rio%20de%20Janeiro/Documents/Playground/clarainova02/supabase/migrations), incluindo a correcao do `hybrid_search_chunks`.

Execute:

```powershell
npx supabase db push --include-all
```

Se preferir explicitar a senha do banco sem prompt:

```powershell
$env:SUPABASE_DB_PASSWORD="SUA_SENHA_DO_BANCO"
npx supabase db push --include-all
```

## Passo 4: configurar os secrets das Edge Functions

Este projeto usa os seguintes segredos nas functions:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Pelas docs oficiais do Supabase, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` ficam disponiveis por padrao em Edge Functions hospedadas no Supabase. O segredo customizado que voce precisa garantir manualmente aqui e o `GEMINI_API_KEY`. Fonte: [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets).

Defina o segredo customizado:

```powershell
npx supabase secrets set GEMINI_API_KEY=SUA_CHAVE_DO_GEMINI
```

Se quiser confirmar:

```powershell
npx supabase secrets list
```

## Passo 5: publicar as Edge Functions

Este projeto usa estas functions:

- `chat`
- `embed-chunks`
- `get-usage-stats`

Publique:

```powershell
npx supabase functions deploy chat
npx supabase functions deploy embed-chunks
npx supabase functions deploy get-usage-stats
```

## Passo 6: atualizar o frontend para o novo projeto

O frontend le estas variaveis em [`src/integrations/supabase/client.ts`](C:/Users/02790830/OneDrive%20-%20Secretaria%20Municipal%20de%20Educa%C3%A7%C3%A3o%20da%20Cidade%20do%20Rio%20de%20Janeiro/Documents/Playground/clarainova02/src/integrations/supabase/client.ts#L4):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Mantenha tambem:

- `VITE_SUPABASE_PROJECT_ID`

Atualize o `.env` local com os dados do projeto novo:

```env
VITE_SUPABASE_PROJECT_ID="NOVO_PROJECT_REF"
VITE_SUPABASE_PUBLISHABLE_KEY="NOVA_ANON_KEY"
VITE_SUPABASE_URL="https://NOVO_PROJECT_REF.supabase.co"
```

## Passo 7: atualizar as variaveis no Vercel

No projeto `clarainova02` na Vercel, ajuste:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Se quiser fazer pelo CLI:

```powershell
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_SUPABASE_PROJECT_ID
```

Depois gere um preview:

```powershell
vercel deploy --yes
```

E, quando estiver tudo validado, publique em producao:

```powershell
vercel --prod
```

## Passo 8: reingestar a base de conhecimento

Como o backend do Lovable nao esta sob seu controle direto, trate a migracao como uma nova implantacao de banco.

Checklist:

1. Entrar na area admin do projeto publicado.
2. Reenviar os PDFs da base.
3. Confirmar que os documentos ficam com status processado.
4. Conferir se a tabela `document_chunks` recebeu embeddings.
5. Testar 3 ou 4 perguntas cuja resposta voce ja conhece.

## Passo 9: smoke test do RAG

Depois da migracao, valide nesta ordem:

1. O site abre normalmente.
2. O chat responde sem erro 500.
3. Perguntas conhecidas retornam citacao de documento.
4. O comportamento de fallback so acontece quando a base nao cobre a pergunta.
5. O painel de uso registra `embedding_query`.

## Comandos de referencia

```powershell
npx supabase link --project-ref SEU_PROJECT_REF -p SUA_SENHA_DO_BANCO
npx supabase db push --include-all
npx supabase secrets set GEMINI_API_KEY=SUA_CHAVE_DO_GEMINI
npx supabase functions deploy chat
npx supabase functions deploy embed-chunks
npx supabase functions deploy get-usage-stats
vercel deploy --yes
vercel --prod
```

## Observacoes importantes

- A correcao do RAG ja esta no codigo. O que falta e publicar esse backend em um Supabase sob seu controle.
- O `service_role` nunca deve ir para o frontend, para o GitHub ou para chats.
- A chave `anon/publishable` pode ir no frontend; o `service_role` nao.

## Fontes oficiais usadas neste guia

- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/supabase-secrets.)
