# Status da Migracao — Baseline e Supabase Proprio

Ultima atualizacao: 2026-03-30

## Resumo executivo

| Frente | Status |
|---|---|
| Baseline local do repositorio | Verificada |
| Migracao estrutural para Supabase | Concluida |
| Desacoplamento do Lovable | Praticamente completo |
| Validacao operacional end-to-end | Pendente |

**O codigo atual ja passa em `npm run validate` e `npm run build`, mas a prova operacional do backend, do corpus e da publicacao em producao ainda depende de configuracao real.**

---

## Projeto Supabase de referencia

- **Project ID:** `jasqctuzeznwdtbcuixn`
- **URL:** `https://jasqctuzeznwdtbcuixn.supabase.co`
- **Funcao no repositorio:** referencia usada durante a migracao

> O repositorio pode ser relinkado para outro projeto com `supabase link --project-ref <project-ref>`.

---

## Baseline local verificada

- **Node:** `24.14.0` (arquivos `.node-version` e `.nvmrc`)
- **Checagem padrao:** `npm run validate`
- **Resultado atual da baseline:**
  - `npm run typecheck` OK
  - `npm run lint` OK
  - `npm test` OK
  - `npm run build` OK

---

## O que o repositorio materializa hoje

### Frontend

- Chat publico com renderizacao estruturada
- Fluxo de exportacao em PDF
- Area administrativa preparada
- Fallback para modo de preparacao quando o Supabase nao esta configurado no ambiente

### Backend Supabase

- **19 migrations** versionadas em `supabase/migrations`
- **3 Edge Functions** versionadas em `supabase/functions`
  - `chat`
  - `embed-chunks`
  - `get-usage-stats`
- `supabase/config.toml` ja linkado ao projeto de referencia

### Auth e seguranca

- `chat` segue publico (`verify_jwt = false`)
- `embed-chunks` e `get-usage-stats` exigem JWT (`verify_jwt = true`)
- A camada administrativa ainda depende de usuario real no Supabase Auth para operacao completa

### Desacoplamento do Lovable

- Nenhuma key Lovable no frontend versionado
- Nenhum endpoint Lovable ativo no runtime
- Nenhum pacote Lovable em `package.json`
- Residuo conhecido: mencao textual a `lovable` em regra de grounding em `supabase/functions/chat/knowledge.ts`

---

## Configuracao versionada

| Item versionado | Estado no repositorio |
|---|---|
| `.env.example` | Atualizado com as env vars reais usadas pelo frontend |
| `SUPABASE_SETUP.md` | Guia operacional do bootstrap |
| `README.md` | Alinhado ao baseline atual |
| `vercel.json` | Configurado para SPA com rewrite para `index.html` |

> Segredos locais, usuarios administrativos e env vars reais do Vercel nao sao inferidos a partir do repositorio e devem ser conferidos no ambiente operacional.

---

## Bloqueadores operacionais imediatos

### 1. `GEMINI_API_KEY`

Secret necessario no projeto Supabase para as Edge Functions `chat` e `embed-chunks`.

Sem ela:

- o chat nao completa respostas grounded no backend
- embeddings reais nao sao gerados

### 2. Auth administrativa real

E necessario haver usuario ou provedor configurado no Supabase Auth.

Sem isso:

- `/admin` nao conclui o fluxo real de autenticacao
- uploads autenticados e metricas administrativas ficam indisponiveis

### 3. Corpus inicial e ingestao

O pipeline existe e a governanca inicial do corpus ja foi materializada no admin e na documentacao operacional. O que ainda falta e a carga real dos primeiros documentos para provar o RAG.

Sem isso:

- `document_chunks` permanece vazio ou insuficiente
- `hybrid_search_chunks` nao prova recuperacao relevante

### 4. Publicacao do baseline atual

O baseline local ja compila, testa e builda, mas ainda precisa ser publicado em um novo deploy para refletir esse estado na producao.

---

## Checklist de validacao

### Fase 0 — Baseline do repositorio

- [x] `npm run validate`
- [x] `npm run build`
- [x] Documentacao interna alinhada ao estado real do codigo

### Fase 1 — Vinculo basico com Supabase

- [ ] `.env` preenchido com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `hasSupabaseConfig = true` no frontend
- [ ] Projeto certo linkado via `supabase link`
- [ ] `supabase db push` aplicado sem erro

### Fase 2 — Operacao administrativa

- [ ] Login administrativo funcional
- [ ] `get-usage-stats` acessivel com JWT valido
- [ ] Upload autenticado de documento funcional

### Fase 3 — Fluxo RAG completo

- [ ] `GEMINI_API_KEY` configurada no projeto remoto
- [ ] Ingestao de ao menos 1 PDF real
- [ ] `document_chunks` populado com embeddings
- [ ] `hybrid_search_chunks` retornando resultados uteis
- [ ] Chat grounded respondendo com referencias

### Fase 4 — Producao

- [ ] Env vars conferidas no Vercel
- [ ] Novo deploy publicado
- [ ] Produção refletindo o baseline atual

---

## Proxima fase recomendada

1. Fechar o contrato funcional do chat (`Direto` / `Didatico`)
2. Polir estrutura e legibilidade do chat
3. Revisar mensagens, excecoes e tom conversacional
4. Ingerir o corpus minimo viavel seguindo a politica de governanca ja definida
