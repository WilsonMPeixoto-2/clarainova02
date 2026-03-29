# Status da Migracao — Supabase Proprio

Ultima atualizacao: 2026-03-29

## Resumo executivo

| Fase | Status |
|---|---|
| Migracao estrutural (banco, functions, config) | Concluida |
| Desacoplamento do Lovable | Praticamente completo |
| Validacao end-to-end | Pendente |

**O backend existe, mas ainda nao esta provado em uso.**

---

## Projeto Supabase

- **Project ID:** jasqctuzeznwdtbcuixn
- **URL:** https://jasqctuzeznwdtbcuixn.supabase.co
- **Regiao:** padrao

---

## O que foi feito

### Banco de dados

3 migrations consolidadas aplicadas (originadas de 19 incrementais):

- `clara_foundation_tables_and_indexes` — extensoes, 9 tabelas, indexes, triggers, storage
- `clara_rls_policies_and_search_functions` — RLS em 9 tabelas, 21 policies, hybrid_search_chunks v7
- `clara_check_rate_limit_function` — rate limiting por IP

Extensoes: vector 0.8.0, pgcrypto 1.3
Funcoes: hybrid_search_chunks (RRF + authority metadata), check_rate_limit (sliding window), set_updated_at
Storage: bucket `documents` (privado, 3 policies authenticated)

### Edge Functions

| Funcao | JWT | Status | Invocada |
|---|---|---|---|
| chat | false (publico) | ACTIVE | Nao |
| embed-chunks | true (admin) | ACTIVE | Nao |
| get-usage-stats | true (admin) | ACTIVE | Nao |

### Configuracao

| Item | Status |
|---|---|
| .env local | Criado com keys reais |
| Vercel env vars (production) | VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY setadas |
| Redeploy Vercel | Pendente |

### Desacoplamento do Lovable

- Nenhuma key antiga no codigo-fonte
- Nenhum endpoint residual
- Nenhum pacote Lovable
- Supabase client le de env vars (nenhum valor hardcoded)
- Unico residuo: mock URL em src/test/chat-api.test.ts:7 (nao afeta producao)

---

## Bloqueadores imediatos (em ordem)

### 1. GEMINI_API_KEY

Secret no Supabase para Edge Functions chat e embed-chunks.
Sem ela: chat responde erro 500, embeddings nao sao gerados.

### 2. Auth admin

Nenhum usuario criado no Supabase Auth.
Sem ele: admin panel nao funciona, upload autenticado bloqueado, JWT nas rotas admin nao valida.

### 3. Redeploy Vercel

Build em producao usa valores anteriores.
Sem ele: site em producao nao conecta ao Supabase novo.

---

## Checklist de validacao

### Fase 1 — Vinculo basico
- [ ] npm run dev local — frontend inicia sem erro
- [ ] hasSupabaseConfig = true no console
- [ ] SELECT simples em documents retorna [] sem erro

### Fase 2 — Fluxo RAG completo
- [ ] GEMINI_API_KEY setada no Supabase
- [ ] Upload de 1 PDF de teste via admin
- [ ] document_chunks populado com embeddings
- [ ] hybrid_search_chunks retorna resultados
- [ ] Chat responde com referencias documentais

### Fase 3 — Seguranca
- [ ] Query com anon key bloqueada (RLS)
- [ ] Login admin funciona
- [ ] embed-chunks sem JWT retorna 401
- [ ] Rate limit bloqueia apos 15 requests/min
- [ ] Storage: upload sem auth negado

### Fase 4 — Producao
- [ ] Redeploy Vercel com envs corretas
- [ ] Chat em producao funciona
- [ ] Metricas registradas (chat_metrics, search_metrics, query_analytics)

---

## Proxima fase (apos validacao)

Conforme docs/migracao-supabase-proprio.md:

1. Auth administrativa com Google (desktop)
2. Passkeys/WebAuthn para mobile
3. Upload resumable
4. Ingestao de base documental completa
