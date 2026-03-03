# CLARAINOVA02 — Assistente Inteligente com RAG

**CLARA** (Consultora Legal e Assistente de Respostas Automatizadas) é uma assistente de IA especializada, construída com arquitetura RAG (Retrieval-Augmented Generation) de última geração.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Framer Motion |
| **Backend** | Lovable Cloud (Supabase) · Deno 2 Edge Functions |
| **IA** | Google Gemini via `@google/genai` SDK · Embeddings `text-embedding-004` |
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

## Licença

Projeto privado — todos os direitos reservados.
