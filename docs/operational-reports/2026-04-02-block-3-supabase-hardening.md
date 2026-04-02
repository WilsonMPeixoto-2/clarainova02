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

## Arquivos alterados
- `supabase/config.toml`
- `supabase/functions/get-usage-stats/index.ts`
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

## Resultado do bloco
### Concluído
- o endurecimento de JWT na borda das functions administrativas foi aplicado no projeto oficial
- a correção de `RLS` ficou pronta, versionada e isolada em migration incremental
- a continuidade oficial deixou de apontar para a linha antiga baseada na PR `#13`

### Não concluído / impossibilidades
- a migration de banco ainda não foi aplicada no Supabase remoto
- este ambiente não possui `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL` ou projeto local linkado para executar `supabase db push`

### Riscos remanescentes
- enquanto a migration não chegar ao banco oficial, as tabelas operacionais/analíticas continuam expostas segundo o estado remoto atual
- o projeto ainda não possui um modelo versionado de `admin_users` para endurecer a autorização além do simples estado autenticado

## Próxima ação recomendada
Aplicar a migration `20260402113000_harden_operational_analytics_access.sql` em um ambiente com credencial de banco do projeto `jasqctuzeznwdtbcuixn`, verificar o comportamento do admin após o fechamento das policies públicas e só então seguir para Google OAuth, Gemini e corpus real.

## Atualizações obrigatórias de continuidade
- [ ] `docs/HANDOFF.md` atualizado
- [ ] `.continuity/current-state.json` atualizado
- [ ] `.continuity/session-log.jsonl` atualizado
- [x] `docs/BLOCK_PLAN.md` atualizado
- [x] `docs/REMOTE_STATE.md` atualizado
- [x] `docs/MIGRATION_STATUS.md` revisado
