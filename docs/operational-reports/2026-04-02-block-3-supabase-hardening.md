# Relatório Operacional — BLOCO 3 Hardening Supabase e JWT administrativo

## Metadados
- Data: 2026-04-02
- Bloco: BLOCO 3 — Hardening Supabase, RLS e `verify_jwt`
- Branch: `session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING`
- Máquina: `WILSON-MP`
- Ferramenta: `CODEX`
- Commit de base: `86d3c18c8d95b0ad8f518863ac75da66a7826b55`
- Commit final: registrado no commit de encerramento desta sessão
- Status final: `reconciliado nesta branch`

## Contexto
Depois do BLOCO 2 integrado em `main`, a próxima frente prioritária voltou a ser segurança estrutural. A auditoria consolidada já apontava dois riscos altos e objetivos:

- policies públicas indevidas em tabelas operacionais/analíticas do Supabase
- `verify_jwt = false` nas functions administrativas `embed-chunks` e `get-usage-stats`

Ao mesmo tempo, o baseline operacional atual ainda depende de conta provisionada autenticada, sem um contrato versionado de `admin_users`. Por isso, o hardening desta rodada precisou ser incremental e compatível com o estado real do projeto.

## Objetivo do bloco
- fechar a reabertura pública de tabelas operacionais e analíticas sem alterar silenciosamente o modelo atual de acesso administrativo
- endurecer a borda das functions administrativas com verificação de JWT no gateway do Supabase
- registrar com precisão o que foi aplicado remotamente e reconciliar a cadeia local de migrations com o histórico canônico do projeto oficial

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
- não existia em `main` um histórico de migrations compatível com o que o Supabase oficial já registra como baseline canônico

## Ações executadas
- alterei `supabase/config.toml` para:
  - `embed-chunks verify_jwt = true`
  - `get-usage-stats verify_jwt = true`
  - manter `chat verify_jwt = false`
- republiquei no projeto oficial `jasqctuzeznwdtbcuixn`:
  - `embed-chunks` -> versão remota observada `7`
  - `get-usage-stats` -> versão remota observada `7`
- conectei este clone ao Postgres remoto oficial e validei o estado real das policies via `supabase db query`
- confirmei que o banco remoto já está sem policies para `public`/`anon` nas tabelas operacionais/analíticas analisadas
- confirmei que o ambiente remoto usa `public.is_admin_user()` apoiada em `public.admin_users`, artefatos ainda não versionados neste clone
- substituí a cadeia local antiga de 19 migrations incrementais por quatro migrations canônicas extraídas do próprio histórico remoto:
  - `20260328230351_clara_foundation_tables_and_indexes.sql`
  - `20260329001517_clara_rls_policies_and_search_functions.sql`
  - `20260329001619_clara_check_rate_limit_function.sql`
  - `20260401213217_harden_admin_authorization.sql`
- removi as duas migrations locais provisórias de reconciliação (`20260402112000` e `20260402113000`) porque o histórico remoto já possui baseline canônico mais fiel
- validei a reconciliação com:
  - `supabase migration list` agora alinhando local e remoto
  - `supabase db push --dry-run` retornando `Remote database is up to date`

## Arquivos alterados
- `supabase/config.toml`
- `supabase/functions/get-usage-stats/index.ts`
- `supabase/migrations/20260328230351_clara_foundation_tables_and_indexes.sql`
- `supabase/migrations/20260329001517_clara_rls_policies_and_search_functions.sql`
- `supabase/migrations/20260329001619_clara_check_rate_limit_function.sql`
- `supabase/migrations/20260401213217_harden_admin_authorization.sql`
- remoção das migrations incrementais antigas que não correspondiam mais ao histórico remoto
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
- `supabase db push --dry-run`

## Resultado do bloco
### Concluído
- o endurecimento de JWT na borda das functions administrativas foi aplicado no projeto oficial
- o Postgres remoto oficial foi acessado e o fechamento de `RLS` nessas tabelas foi confirmado em produção
- a cadeia local de migrations foi reconciliada com o histórico canônico registrado no Supabase oficial
- o repositório passou a refletir diretamente o contrato remoto de `public.admin_users` / `public.is_admin_user()`
- `supabase db push` voltou a ser seguro nesta branch do ponto de vista de histórico, pelo menos em modo `--dry-run`
- a continuidade oficial deixou de apontar para a linha antiga baseada na PR `#13`

### Não concluído / impossibilidades
- a branch ainda precisa ser integrada na linha principal para que `origin/main` passe a carregar essa cadeia canônica
- Google OAuth do admin e estabilidade do Gemini continuam fora do escopo resolvido neste bloco

### Riscos remanescentes
- a linha principal ainda não absorveu esta reconciliação
- Google OAuth do admin continua desabilitado no Supabase real
- embeddings reais continuam sujeitos à estabilidade externa do Gemini

## Próxima ação recomendada
Integrar a branch atual e, em seguida, abrir BLOCO 4 para Google OAuth do admin, Gemini e reprocessamento real de embeddings.

## Atualizações obrigatórias de continuidade
- [x] `docs/HANDOFF.md` atualizado
- [x] `.continuity/current-state.json` atualizado
- [ ] `.continuity/session-log.jsonl` atualizado
- [x] `docs/BLOCK_PLAN.md` atualizado
- [x] `docs/REMOTE_STATE.md` atualizado
- [x] `docs/MIGRATION_STATUS.md` revisado
