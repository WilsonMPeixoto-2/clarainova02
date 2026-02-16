# Plano: Criar seu próprio Supabase para o projeto ClaraInova

## Objetivo

Criar uma conta pessoal no Supabase (100% sua) e configurar o backend do ClaraInova para funcionar independente do Lovable.

---

## Passo 1 — Criar conta no Supabase

- Acessar **supabase.com** e criar conta gratuita (pode usar login com GitHub)
- Criar um **novo projeto** — escolher nome (ex: "clarainova"), senha do banco de dados, e região (São Paulo se disponível)
- Anotar as credenciais que o Supabase gera: **Project URL** e **Anon Key** (ficam em Settings > API)

## Passo 2 — Aplicar o schema do banco de dados

- No seu repositório GitHub, localizar a pasta `supabase/migrations/`
- Esses arquivos SQL contêm toda a estrutura do banco (tabelas, políticas RLS, triggers)
- Ir no **SQL Editor** do Supabase Dashboard e executar cada arquivo de migration na ordem cronológica (os nomes começam com data/hora)
- Isso recria todas as tabelas, permissões e configurações que o projeto usava

## Passo 3 — Configurar Storage (para PDFs)

- No Supabase Dashboard, ir em **Storage**
- Se as migrations já criarem os buckets, eles aparecerão automaticamente após o Passo 2
- Caso contrário, criar manualmente um bucket (ex: "documents") e definir se é público ou privado
- Configurar políticas de acesso (quem pode fazer upload, quem pode ler)

## Passo 4 — Deploy das Edge Functions (Chat com IA)

- No repositório GitHub, localizar `supabase/functions/` — ali estará a função do chat (provavelmente `clara-chat` ou similar)
- Instalar o **Supabase CLI** no seu computador (`npm install -g supabase`)
- Fazer login com `supabase login`
- Linkar ao projeto com `supabase link --project-ref SEU_PROJECT_ID`
- Deploy das functions com `supabase functions deploy nome-da-funcao`

## Passo 5 — Configurar a chave da API do Google Gemini

- No Supabase Dashboard, ir em **Settings > Edge Functions > Secrets**
- Adicionar sua chave como secret (ex: `GOOGLE_GEMINI_API_KEY` com o valor da sua chave)
- Verificar no código da Edge Function qual nome de variável ela espera e ajustar se necessário
- Isso garante que **sua chave** é usada diretamente, sem intermediários

## Passo 6 — Conectar o frontend ao novo Supabase

- No seu projeto no Codex CLI, atualizar as variáveis de ambiente:
  - `VITE_SUPABASE_URL` → URL do seu novo projeto Supabase
  - `VITE_SUPABASE_ANON_KEY` → Anon Key do seu novo projeto
- Essas variáveis ficam geralmente em um arquivo `.env` ou `.env.local` na raiz do projeto

## Passo 7 — Testar tudo

- Rodar o frontend localmente (`npm run dev`)
- Testar o chat com IA para confirmar que usa sua chave Gemini
- Testar upload de PDFs para confirmar que o Storage funciona
- Verificar se os dados do banco aparecem corretamente

---

## Resultado Final

Você terá um backend **100% seu**, com conta própria no Supabase, controle total sobre banco de dados, storage e API keys. O [https://clarainova.vercel.app/](https://clarainova.vercel.app/)

projeto poderá ser hospedado em qualquer lugar (Vercel, Netlify, etc.) sem depender do Lovable.