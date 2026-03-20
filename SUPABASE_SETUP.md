# Setup do Supabase Proprio

Este projeto ja nao deve depender do backend gerido pelo Lovable. O objetivo daqui em diante e ligar o codigo atual a um projeto Supabase controlado por voce.

## Preflight

- Supabase CLI instalado
- Conta propria no Supabase
- Chave `GEMINI_API_KEY`
- Node atual compativel com o frontend local

## Arquivos locais

1. Copie [.env.example](./.env.example) para `.env`
2. Preencha:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

3. Copie [supabase/functions/.env.example](./supabase/functions/.env.example) para `supabase/functions/.env.local`
4. Preencha:
   - `GEMINI_API_KEY`

## Criar e ligar o projeto

1. Crie um novo projeto no dashboard do Supabase
2. Ligue o repositório ao projeto:

```sh
supabase link --project-ref <project-ref>
```

3. Confirme que [supabase/config.toml](./supabase/config.toml) foi atualizado com o `project_id` real

## Aplicar banco e functions

```sh
supabase db push
supabase functions deploy chat
supabase functions deploy embed-chunks
supabase functions deploy get-usage-stats
supabase secrets set GEMINI_API_KEY=...
```

## Desenvolvimento local

```sh
supabase start
supabase functions serve --env-file supabase/functions/.env.local
```

O frontend usa:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

As Edge Functions usam:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Os dois primeiros sao fornecidos pelo Supabase. O terceiro precisa ser definido por voce.

## Observacoes de seguranca

- O `.env` antigo estava versionado; daqui em diante ele deve permanecer apenas local.
- O backend atual ainda usa policies publicas para `documents`, `document_chunks` e bucket `documents`, alem de `verify_jwt = false` nas functions. Isso facilita o bootstrap, mas deve ser endurecido depois que o novo projeto estiver de pe.
- A auth atual protege apenas a interface admin. Ela nao deve ser tratada como endurecimento final do backend.
