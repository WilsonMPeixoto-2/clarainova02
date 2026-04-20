# CLARAINOVA02 — Assistente institucional com RAG

CLARA é uma assistente digital voltada a dúvidas sobre uso do SEI-Rio e rotinas administrativas, com frontend público em React/Vite e backend em Supabase Edge Functions.

O projeto já opera como produto real, não como protótipo, e está em consolidação final para travamento de versão.

## Estado atual

- frontend público maduro, com home, FAQ, páginas legais e chat estruturado
- chat com histórico persistido, modos `Direto` e `Didático`, exportação em PDF, impressão, cópia e feedback
- backend RAG robusto com retrieval governado, fallbacks, structured generation, telemetry e caches
- `embedding_cache` e `chat_response_cache` ativos
- query expansion desligada intencionalmente no runtime atual
- baseline local principal: `npm run validate`

## Arquitetura resumida

```text
Browser
  -> Vercel (SPA React/Vite)
  -> Supabase Edge Function /chat
      -> Gemini Embedding API
      -> Gemini Generative API
      -> Supabase Postgres + pgvector
```

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, Motion |
| Backend | Supabase Edge Functions em Deno |
| IA | Google Gemini via `@google/genai` |
| Banco vetorial | PostgreSQL + pgvector |
| Busca | híbrida semântica + lexical |
| Ingestão | `unpdf`, LangChain Text Splitter e pipeline administrativa |

## Modelos no código atual

- geração principal do chat: `gemini-3.1-pro-preview`
- fallback gerativo: `gemini-3.1-flash-lite-preview`
- embedding: `gemini-embedding-2-preview`
- dimensionalidade vetorial: `768`

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

## Desenvolvimento local

```sh
npm install
npm run validate
npm run dev
```

Checks principais:

```sh
npm test
npm run build
npm run continuity:check
```

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
- `docs/cache-policy.md`
- `docs/response-cache-governance.md`
- `supabase/functions/chat/index.ts`
- `supabase/functions/chat/response-cache.ts`
- `src/hooks/useChatStore.tsx`
- `src/components/ChatSheet.tsx`
- `src/components/chat/ChatStructuredMessage.tsx`

## Licença

Projeto privado. Todos os direitos reservados.
