# CLARA

CLARA e uma ferramenta web de apoio ao uso do SEI-Rio e a rotinas administrativas. A interface publica prioriza consultas operacionais sobre documentos, assinatura, tramitacao e conferencia de etapas. O backend versionado no repositorio prepara uma base RAG com Supabase, embeddings e telemetria, mas a ligacao ao projeto remoto correto do Supabase ainda esta em regularizacao.

## Stack atual

- React 19
- TypeScript 5
- Vite 8
- Tailwind CSS 4
- Motion
- Supabase Edge Functions
- Google Gemini via `@google/genai`

## O que existe no repositorio

- frontend publicado na Vercel;
- pagina inicial institucional, chat e area administrativa;
- migrations e edge functions versionadas em [`supabase`](./supabase);
- ingestao de PDFs no admin com `unpdf` e `@langchain/textsplitters`;
- testes unitarios voltados ao grounding e ao comportamento do chat.

## Principios de backend

- analytics de produto e qualidade, sem rastreamento pessoal do usuario do chat;
- prioridade para metricas agregadas, ambiguidade, feedback e consumo de API;
- area admin pensada para evoluir para Google login no desktop e passkeys no celular;
- ingestao de PDFs simples no uso, mas preparada para crescer com upload robusto e leitura complementar.

O detalhamento dessas decisoes esta em [`docs/backend-principios-clara.md`](./docs/backend-principios-clara.md).

## Scripts

```bash
npm install
npm run dev
npm run check
npm run deploy:stack
npm run deploy:stack:prod
npm run typecheck
npm run lint
npm test
npm run build
```

## Scripts de backend local

O projeto agora inclui o Supabase CLI como dependencia de desenvolvimento, para padronizar os comandos em qualquer maquina:

```bash
npm run supabase:login
npm run supabase:link
npm run supabase:db:push
npm run supabase:functions:deploy:chat
npm run supabase:functions:deploy:embed
npm run supabase:functions:deploy:stats
```

## Deploy unificado

Quando o projeto ja estiver vinculado ao seu Supabase e a Vercel ja estiver autenticada, voce pode usar um fluxo unico:

```bash
npm run deploy:stack
```

Para publicar em producao:

```bash
npm run deploy:stack:prod
```

Flags uteis:

```bash
node scripts/deploy-stack.mjs --prod --skip-check
node scripts/deploy-stack.mjs --skip-db-push
node scripts/deploy-stack.mjs --skip-functions
node scripts/deploy-stack.mjs --skip-vercel
```

Esse script:
- roda `npm run check` por padrao;
- aplica migrations com `supabase db push --include-all`;
- publica `chat`, `embed-chunks` e `get-usage-stats`;
- sincroniza configuracao local da Vercel com `vercel pull`;
- faz o deploy preview ou producao.

## Ambiente

Use um arquivo `.env` local com:

```env
VITE_SUPABASE_PUBLISHABLE_KEY="sua_publishable_key"
VITE_SUPABASE_URL="https://seu_project_ref.supabase.co"
```

O exemplo versionado esta em [`.env.example`](./.env.example).

Observacao: o chat nao deve mais entrar em modo mock silencioso em producao. Se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` estiverem ausentes, a interface passa a exibir erro de configuracao em vez de inventar respostas.

## Estrutura principal

- [`src`](./src): frontend React
- [`public`](./public): assets estaticos
- [`supabase/migrations`](./supabase/migrations): schema versionado
- [`supabase/functions`](./supabase/functions): edge functions
- [`docs`](./docs): guias operacionais do projeto

## Estado atual

O frontend esta estabilizado em Node 24 + Vite 8 e publicado em producao. A proxima fase tecnica prevista e concluir a conexao com o projeto Supabase correto para aplicar as migrations mais recentes e validar o RAG remoto ponta a ponta.
