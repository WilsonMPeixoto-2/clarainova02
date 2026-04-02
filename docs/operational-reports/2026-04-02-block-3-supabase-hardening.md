# Relatório Operacional — BLOCO 3 Hardening Supabase e JWT administrativo

## Metadados
- Data: 2026-04-02
- Bloco: BLOCO 3 — Hardening Supabase, RLS e `verify_jwt`
- Branch: `session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING`
- Máquina: `WILSON-MP`
- Ferramenta: `CODEX`
- Commit de base: `86d3c18c8d95b0ad8f518863ac75da66a7826b55`
- Commit final: registrado no commit de encerramento desta sessão
- Status final: `partial`

## Contexto
Depois do BLOCO 2 integrado em `main`, a próxima frente prioritária voltou a ser segurança estrutural. A auditoria consolidada já apontava dois riscos altos e objetivos:

- policies públicas indevidas em tabelas operacionais/analíticas do Supabase
- `verify_jwt = false` nas functions administrativas `embed-chunks` e `get-usage-stats`

Ao mesmo tempo, o baseline operacional atual ainda depende de conta provisionada autenticada, sem um contrato versionado de `admin_users`. Por isso, o hardening desta rodada precisou ser incremental e compatível com o estado real do projeto.

## Objetivo do bloco
- fechar a reabertura pública de tabelas operacionais e analíticas sem alterar silenciosamente o modelo atual de acesso administrativo
- endurecer a borda das functions administrativas com verificação de JWT no gateway do Supabase
- registrar com precisão o que foi aplicado remotamente e o que ainda depende de credencial de banco

## Arquivos lidos antes de editar
- `.continuity/current-state.json`
- `docs/HANDOFF.md`
- `docs/MIGRATION_STATUS.md`
- `docs/operational-reports/2026-04-02-block-2-prelaunch-polish.md`
- `docs/BLOCK_PLAN.md`
- `docs/REMOTE_STATE.md`
- `supabase/config.toml`
- `supabase/functions/embed-chunks/index.ts`
- `supabase/functions/get-usage-stats/index.ts`
- `supabase/functions/chat/index.ts`
- `supabase/migrations/20260315170000_ingestion_governance.sql`
- `supabase/migrations/20260316112905_65adc4f0-434c-4838-af94-9e7ab3316760.sql`

## Diagnóstico técnico
- a migration `20260315170000_ingestion_governance.sql` já havia criado policies autenticadas razoáveis para `ingestion_jobs`, `document_processing_events`, `search_metrics`, `chat_metrics` e `query_analytics`
- a migration `20260316112905_65adc4f0-434c-4838-af94-9e7ab3316760.sql` somou policies `TO public` por cima desse baseline, reabrindo acesso indevido
- `embed-chunks` e `get-usage-stats` continuavam com `verify_jwt = false`, apesar de exigirem autenticação manual no código
- não existe em `main` um contrato versionado de papéis administrativos (`admin_users`) que permita endurecer agora para admin-only sem risco de quebrar a conta provisionada usada na operação real

## Ações executadas
- alterei `supabase/config.toml` para:
  - `embed-chunks verify_jwt = true`
  - `get-usage-stats verify_jwt = true`
  - manter `chat verify_jwt = false`
- criei a migration `supabase/migrations/20260402113000_harden_operational_analytics_access.sql` para:
  - remover as policies públicas de `ingestion_jobs`
  - remover as policies públicas de `document_processing_events`
  - remover as policies públicas de `chat_metrics`
  - remover as policies públicas de `search_metrics`
  - remover as policies públicas de `query_analytics`
  - reafirmar policies autenticadas compatíveis com o estado atual do projeto
- republiquei no projeto oficial `jasqctuzeznwdtbcuixn`:
  - `embed-chunks` -> versão remota observada `7`
  - `get-usage-stats` -> versão remota observada `7`
- conectei este clone ao Postgres remoto oficial e validei o estado real das policies via `supabase db query`
- confirmei que o banco remoto já está sem policies para `public`/`anon` nas tabelas operacionais/analíticas analisadas
- confirmei que o ambiente remoto usa `public.is_admin_user()` apoiada em `public.admin_users`, artefatos ainda não versionados neste clone
- reescrevi a migration `20260402113000_harden_operational_analytics_access.sql` para:
  - fechar acesso público em qualquer ambiente
  - espelhar o estado admin-only quando `is_admin_user()` existir
  - preservar apenas o baseline autenticado em ambientes onde esse helper ainda não exista
- versionei no repositório o contrato remoto de `public.admin_users` e `public.is_admin_user()` em `20260402112000_version_admin_users_contract.sql`

## Arquivos alterados
- `supabase/config.toml`
- `supabase/functions/get-usage-stats/index.ts`
- `supabase/migrations/20260402112000_version_admin_users_contract.sql`
- `supabase/migrations/20260402113000_harden_operational_analytics_access.sql`
- `docs/BLOCK_PLAN.md`
- `docs/REMOTE_STATE.md`
- `docs/MIGRATION_STATUS.md`
- `docs/operational-reports/2026-04-02-block-3-supabase-hardening.md`

## Validações executadas
- `npm run validate`
- `supabase projects list`
- `supabase functions deploy embed-chunks --project-ref jasqctuzeznwdtbcuixn --use-api`
- `supabase functions deploy get-usage-stats --project-ref jasqctuzeznwdtbcuixn --use-api`
- `supabase functions list --project-ref jasqctuzeznwdtbcuixn`
- `supabase db query "select current_user, current_database();" --linked`
- `supabase db query` em `pg_policies` para `ingestion_jobs`, `document_processing_events`, `chat_metrics`, `search_metrics` e `query_analytics`
- `supabase db query` em `pg_proc` para `public.is_admin_user()`
- `supabase db query` em `information_schema.tables` para `public.admin_users`
- `supabase migration list`

## Resultado do bloco
### Concluído
- o endurecimento de JWT na borda das functions administrativas foi aplicado no projeto oficial
- o Postgres remoto oficial foi acessado e o fechamento de `RLS` nessas tabelas foi confirmado em produção
- a correção de `RLS` ficou pronta, versionada e isolada em migration incremental compatível com o estado remoto mais seguro
- o repositório passou a conhecer o contrato remoto de `public.admin_users` / `public.is_admin_user()`
- a continuidade oficial deixou de apontar para a linha antiga baseada na PR `#13`

### Não concluído / impossibilidades
- a cadeia de migrations local continua divergente da cadeia remota, então `supabase db push` continua impróprio neste clone
- a divergencia confirmada por `supabase migration list` inclui:
  - versoes remotas sem arquivo local correspondente:
    - `20260328230351`
    - `20260329001517`
    - `20260329001619`
    - `20260401213217`
  - historico remoto que nao reconhece como aplicadas as migrations locais versionadas neste clone, apesar de o schema real ja refletir parte relevante delas

### Riscos remanescentes
- o repositório ainda não reproduz integralmente o modelo administrativo do Supabase oficial
- um `db push` sem reconciliação de histórico pode sobrescrever um estado de banco já mais seguro do que o diretório local

## Próxima ação recomendada
Reconciliar conscientemente a cadeia de migrations local/remota antes de qualquer `db push`; depois disso, verificar novamente o admin e só então seguir para Google OAuth, Gemini e corpus real.

## Atualizações obrigatórias de continuidade
- [ ] `docs/HANDOFF.md` atualizado
- [ ] `.continuity/current-state.json` atualizado
- [ ] `.continuity/session-log.jsonl` atualizado
- [x] `docs/BLOCK_PLAN.md` atualizado
- [x] `docs/REMOTE_STATE.md` atualizado
- [x] `docs/MIGRATION_STATUS.md` revisado
