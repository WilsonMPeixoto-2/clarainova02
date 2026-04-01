# Relatorio Operacional - BLOCO 1 Endurecimento de Autorizacao Administrativa

## Metadados
- Data: 2026-04-01
- Bloco: BLOCO 1 - RLS / policies
- Branch: `session/2026-04-01/C04-084/CODEX/BLOCO-1-RLS`
- Maquina: `C04-084`
- Ferramenta: `CODEX`
- Commit de base: `3df686c`
- Status final: `partial`

## Contexto
Depois de reconciliar a linha historica de migrations com o projeto remoto, ainda permanecia o principal risco operacional do painel: qualquer usuario autenticado podia atuar sobre documentos, chunks, ingestao, storage e metricas administrativas.

O frontend dizia "conta administrativa", mas o banco e as Edge Functions tratavam `authenticated` como suficiente.

## Objetivo do bloco
- Versionar uma primitiva explicita de autorizacao administrativa no banco.
- Fazer o painel `/admin` verificar essa autorizacao, e nao apenas a existencia de sessao.
- Endurecer as Edge Functions administrativas para rejeitar contas autenticadas sem permissao.
- Trocar as policies amplas de `authenticated` por policies admin-only.

## Arquivos lidos
- `src/components/AdminAuth.tsx`
- `src/pages/Admin.tsx`
- `src/lib/admin-auth.ts`
- `src/integrations/supabase/types.ts`
- `supabase/config.toml`
- `supabase/functions/embed-chunks/index.ts`
- `supabase/functions/get-usage-stats/index.ts`
- `docs/MIGRATION_STATUS.md`
- `docs/HANDOFF.md`
- `pg_policies` do projeto remoto via Supabase MCP

## Acoes executadas
1. Foi confirmada no banco remoto a existencia de policies permissivas do tipo `TO authenticated USING (true)` sobre tabelas administrativas e sobre `storage.objects` do bucket `documents`.
2. Foi criada a migration `20260401193000_harden_admin_authorization.sql`, que:
   - cria `public.admin_users` como fonte canonica de autorizacao administrativa
   - cria `public.is_admin_user(...)` para uso no app e nas policies
   - remove as policies permissivas antigas
   - recria as policies para permitir acesso apenas a administradores explicitamente concedidos
3. `supabase/config.toml` passou a marcar `embed-chunks` e `get-usage-stats` com `verify_jwt = true`.
4. Foi criado um helper compartilhado em `supabase/functions/_shared/admin-access.ts` para:
   - revalidar o JWT recebido
   - consultar `admin_users`
   - distinguir `401`, `403` e falha interna de lookup
5. As Edge Functions `embed-chunks` e `get-usage-stats` passaram a exigir permissao administrativa, nao apenas sessao autenticada.
6. O `AdminAuth` do frontend passou a consultar `rpc('is_admin_user')` e a bloquear a entrada no painel quando a conta existe, mas ainda nao foi autorizada.
7. Os tipos do Supabase no frontend foram atualizados para refletir `admin_users` e `is_admin_user`.
8. Foi adicionada cobertura pequena de teste para a nova copia de autorizacao administrativa.

## Resultado do bloco
### Concluido
- O repositorio agora tem uma primitiva versionada de admin autorizado.
- O painel deixou de confiar apenas em sessao autenticada para liberar `/admin`.
- As Edge Functions administrativas deixaram de aceitar qualquer usuario autenticado.
- A proxima migration de deploy ja carrega a troca de policies para admin-only.

### Nao concluido
- A migration ainda nao foi aplicada no projeto remoto.
- O primeiro admin ainda nao foi provisionado em `public.admin_users`.
- As funcoes remotas endurecidas ainda nao foram publicadas no ambiente operacional.

## Validacoes executadas
- `npm run validate`

## Observacao operacional importante
Como a concessao inicial de admin precisa ser deliberada, o primeiro registro em `public.admin_users` nao foi automatizado.

Provisionamento esperado apos aplicar a migration:

```sql
insert into public.admin_users (user_id, granted_by, notes)
select id, null, 'Bootstrap admin'
from auth.users
where email = 'SEU_EMAIL_ADMIN_AQUI';
```

Se a conta ja existir em `auth.users`, esse passo passa a liberar o painel, as leituras administrativas e as Edge Functions protegidas.

## Proxima acao recomendada
Aplicar a migration no projeto Supabase oficial, provisionar explicitamente o primeiro admin em `public.admin_users`, publicar as Edge Functions endurecidas e validar o painel com:
- uma conta autorizada
- uma conta autenticada sem autorizacao administrativa
