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

## Deploy na Vercel

**🚀 Status**: Pronto para deploy na Vercel!

### Quick Start

**Método 1: Via GitHub (Recomendado)**
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe este repositório
3. Configure as 3 variáveis de ambiente do Supabase
4. Clique em "Deploy"

**Método 2: Via CLI**
```sh
npm install -g vercel
vercel --prod
```

### Documentação Completa

Para instruções detalhadas, troubleshooting e configurações avançadas, consulte:
**📖 [Guia Completo de Deploy](./docs/DEPLOYMENT.md)**

### Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon key) do Supabase |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |

Configure no `.env` local ou nas configurações da Vercel.

## Licença

Projeto privado — todos os direitos reservados.
