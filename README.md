# CLARAINOVA02 — Assistente Inteligente com RAG

**CLARA** (Consultora Legal e Assistente de Respostas Automatizadas) e uma assistente de IA especializada para fluxos documentais e orientacao institucional, com frontend publico em React e backend preparado para operacao grounded via Supabase.

## Status atual do repositorio

- Baseline local verificada em Node `24.14.1`
- Checagem padrao do projeto: `npm run validate`
- Build de producao validado localmente com `npm run build`
- O frontend funciona mesmo sem Supabase, entrando em modo de preparacao
- Admin, ingestao, metricas e RAG grounded dependem do Supabase real, auth administrativa, corpus inicial curado e estabilidade do provedor Gemini
- Termos de Uso, Politica de Privacidade e metadados publicos foram alinhados ao estado real do produto, com autoria, provedores e limites operacionais explicitados

## Stack tecnologica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion |
| **Backend** | Supabase · Edge Functions em Deno |
| **IA** | Google Gemini via `@google/genai` |
| **Banco vetorial** | Postgres + pgvector |
| **Busca** | Hibrida semantica + lexical com `hybrid_search_chunks` |
| **Ingestao** | `unpdf` + LangChain Text Splitter + pipeline administrativa |

## O que ja esta ativo no codigo

- Interface publica da CLARA com home, FAQ e fluxo de chat
- Renderizacao estruturada da resposta no frontend
- Exportacao de conversa em PDF
- Shell administrativa com autenticacao e callback preparados
- Perfil de governanca documental no admin para classificar escopo, autoridade, peso e prioridade antes da ingestao
- Fallback de modo de preparacao quando `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` nao estao definidos

## O que depende de configuracao operacional

- Google OAuth do admin no projeto Supabase real
- Primeira carga curada de documentos aderentes ao SEI-Rio
- Embeddings reais estaveis no provedor Gemini
- Metricas agregadas vindas das Edge Functions

## Identidade publica e governanca atual

- A autoria tecnica e a manutencao inicial do ambiente publico sao identificadas como `Wilson M. Peixoto`
- O site explicita que a CLARA e projeto autoral em maturacao e nao canal institucional oficial por si so
- `Termos de Uso`, `Politica de Privacidade` e metadados publicos foram revisados para refletir o comportamento real do produto
- O chat publico hoje trabalha com entrada textual; imagens e prints ainda nao fazem parte da interface publicada
- A presenca externa usa Open Graph dedicado, manifesto PWA e exportacao de sessao em PDF com branding proprio

## Desenvolvimento

```sh
npm install
npm run validate
npm run dev
```

Arquivos de referencia para ambiente:

- [docs/MIGRATION_STATUS.md](./docs/MIGRATION_STATUS.md)
- [docs/corpus-governance.md](./docs/corpus-governance.md)
- [docs/corpus-ingestion-playbook.md](./docs/corpus-ingestion-playbook.md)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [supabase/config.toml](./supabase/config.toml)

## Bootstrap do Supabase proprio

1. Copie [.env.example](./.env.example) para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. O repositorio hoje esta linkado a um projeto Supabase de referencia da migracao. Se voce for assumir a operacao com um projeto seu, relinque com `supabase link --project-ref <project-ref>`.
3. Copie `supabase/functions/.env.example` para `supabase/functions/.env.local` e preencha `GEMINI_API_KEY` para desenvolvimento local.
4. Rode `supabase db push` para aplicar as migrations no projeto vinculado.
5. Publique as Edge Functions `chat`, `embed-chunks` e `get-usage-stats`, e depois registre o secret `GEMINI_API_KEY` no projeto remoto.
6. Confira as env vars do Vercel e faca um novo deploy para publicar o baseline atual.

## Licenca

Projeto privado — todos os direitos reservados.
