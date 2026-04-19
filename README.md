# CLARAINOVA02

CLARA é uma assistente digital voltada a dúvidas sobre uso do SEI-Rio e rotinas administrativas, com frontend público em React/Vite e backend em Supabase Edge Functions.

O projeto já opera como produto real e não como protótipo, mas ainda está em fase final de consolidação pré-`v1.0`.

## Estado atual real

- `origin/main` auditado em `6426b33ceaa0d08336a23daad03c0fcba2f2514a`
- frontend público maduro, com home, FAQ, páginas legais e chat estruturado
- chat com histórico persistido, modos `Direto` e `Didático`, exportação em PDF, impressão, cópia e feedback
- backend RAG robusto com retrieval governado, fallbacks, structured generation e telemetria
- `response cache` ativo e `embedding cache` ativo
- query expansion **desligada intencionalmente** no runtime atual
- corpus remoto ativo saudável, mas com fechamento operacional ainda pendente em alguns pontos de governança

## Arquitetura resumida

```text
Browser
  -> Vercel (SPA React/Vite)
  -> Supabase Edge Function /chat
      -> Gemini Embedding API
      -> Gemini Generative API
      -> Supabase Postgres + pgvector
```

Camadas principais:

- frontend público: `src/`
- chat state/store: `src/hooks/useChatStore.tsx`
- shell do chat: `src/components/ChatSheet.tsx`
- resposta estruturada: `src/components/chat/ChatStructuredMessage.tsx`
- backend do chat: `supabase/functions/chat/index.ts`
- cache de respostas: `supabase/functions/chat/response-cache.ts`
- feedback do chat: `supabase/functions/submit-chat-feedback/index.ts`
- métricas administrativas: `supabase/functions/get-usage-stats/index.ts`

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, Motion |
| Backend | Supabase Edge Functions em Deno |
| IA | Google Gemini via `@google/genai` |
| Banco vetorial | PostgreSQL + pgvector |
| Busca | híbrida semântica + lexical |
| Ingestão | `unpdf`, LangChain Text Splitter e pipeline administrativa |

## Funcionalidades públicas já implementadas

- home pública com hero, funcionalidades, FAQ e transparência institucional
- abertura do chat por CTA direto e por query string
- respostas estruturadas com resumo, etapas, observações e referências
- distinção de modo `Direto` e `Didático`
- cópia de resposta
- exportação em PDF
- impressão da sessão
- feedback positivo/negativo com persistência no backend
- persistência local do histórico e da preferência de modo
- adaptação cuidadosa para mobile e desktop

## Backend e RAG: estado honesto

### Modelos Gemini no código atual

- geração primária do chat: `gemini-3.1-pro-preview`
- fallback gerativo: `gemini-3.1-flash-lite-preview`
- embedding: `gemini-embedding-2-preview`
- dimensionalidade vetorial atual: `768`

### Comportamentos confirmados no runtime atual

- structured generation com `responseMimeType: 'application/json'`
- retrieval híbrido governado com filtros de fonte, escopo e documento
- source-target routing
- leakage detection e repair
- emergency playbooks para fallback grounded
- `embedding_cache`
- `chat_response_cache`

### Pontos importantes

- a query expansion está desligada no código atual para evitar deriva semântica
- o `response cache` tem TTL curto de `24h`
- o cache já funciona, mas sua governança ainda precisa de formalização explícita
- o caminho de `cache hit` ainda não registra telemetria equivalente ao caminho de resposta nova

## Estado operacional remoto conhecido

Com base na auditoria independente de `2026-04-19`:

- `23` documentos totais no remoto
- `17` documentos ativos
- `23` documentos processados
- `289/289` chunks ativos com embedding
- `12` chats respondidos nos últimos `14` dias
- latência média recente: `26435 ms`

Isso indica um ambiente remoto funcional e mais saudável do que a continuidade antiga sugeria, mas ainda não totalmente encerrado do ponto de vista de governança.

## Pendências reais

- Google OAuth administrativo ainda depende de configuração externa
- modelos Gemini de geração ainda estão em `preview`
- `README`, continuidade e narrativa operacional exigiram reconciliação recente
- `npm run validate` ainda não está totalmente green no momento desta atualização
- o Supabase remoto ainda carrega leftovers de template (`users`, `posts`, `comments`)
- a política operacional do `response cache` ainda precisa ser formalizada

## Desenvolvimento local

```sh
npm install
npm test
npm run build
npm run dev
```

Checks principais:

```sh
npm run validate
npm run build
```

Observação importante:

- nesta revisão documental, `npm test` e `npm run build` passaram
- `npm run validate` ainda falha no lint até a correção do `no-explicit-any` em `supabase/functions/chat/index.ts`

## Ambiente e bootstrap

1. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Copie `supabase/functions/.env.example` para `supabase/functions/.env.local` e preencha `GEMINI_API_KEY`.
3. Linke o projeto Supabase desejado com `supabase link --project-ref <project-ref>`.
4. Rode `supabase db push`.
5. Publique as Edge Functions necessárias.
6. Confira as env vars do Vercel antes de qualquer deploy público.

## Arquivos importantes para continuidade

- `.continuity/current-state.json`
- `.continuity/session-log.jsonl`
- `docs/HANDOFF.md`
- `docs/MIGRATION_STATUS.md`
- `docs/operational-reports/`
- `supabase/functions/chat/index.ts`
- `supabase/functions/chat/response-cache.ts`
- `src/hooks/useChatStore.tsx`
- `src/components/ChatSheet.tsx`
- `src/components/chat/ChatStructuredMessage.tsx`

## Licença

Projeto privado. Todos os direitos reservados.
