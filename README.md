# CLARAINOVA02 — Assistente Inteligente com RAG

**CLARA** (Consultora Legal e Assistente de Respostas Automatizadas) e uma assistente de IA especializada, com frontend ja estabilizado e backend preparado para ser ligado a um projeto Supabase sob sua propria titularidade.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Motion |
| **Backend** | Supabase (projeto proprio) · Deno Edge Functions |
| **IA** | Google Gemini via `@google/genai` SDK · Embeddings `gemini-embedding-001` |
| **Banco Vetorial** | pgvector com índice **HNSW** (Hierarchical Navigable Small World) |
| **Busca** | Híbrida RRF (Reciprocal Rank Fusion) — semântica + full-text |
| **Ingestão** | `unpdf` (extração client-side) · LangChain Text Splitter · Rastreabilidade por página |

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  React App  │────▶│ Edge Function│────▶│  Gemini API   │
│  (Chat UI)  │◀────│  /chat       │◀────│  (streaming)  │
└─────────────┘     └──────┬───────┘     └───────────────┘
                           │
                    ┌──────▼───────┐
                    │   pgvector   │
                    │  HNSW Index  │
                    │ hybrid_search│
                    └──────────────┘
```

## Funcionalidades

- 💬 Chat com streaming em tempo real
- 📄 Ingestão de PDFs com rastreabilidade por página (`[Fonte: doc | Página: N]`)
- 🔍 Busca híbrida vetorial + full-text com RRF
- 📊 Painel administrativo com estatísticas de uso
- 🎨 Design premium com animações e partículas

## Desenvolvimento

```sh
npm install
npm run dev
```

## Bootstrap do Supabase proprio

1. Copie [.env.example](./.env.example) para `.env` e preencha `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Crie o projeto no Supabase com uma conta sua e rode `supabase link --project-ref <project-ref>` para substituir o placeholder em [supabase/config.toml](./supabase/config.toml).
3. Copie [supabase/functions/.env.example](./supabase/functions/.env.example) para `supabase/functions/.env.local` e preencha `GEMINI_API_KEY` para desenvolvimento local.
4. Aplique schema e policies com `supabase db push`.
5. Publique as Edge Functions `chat`, `embed-chunks` e `get-usage-stats`, e depois registre o secret `GEMINI_API_KEY` no projeto remoto.

Uma referencia operacional mais detalhada ficou em [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Licença

Projeto privado — todos os direitos reservados.
