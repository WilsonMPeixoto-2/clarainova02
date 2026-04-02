# Estado Remoto Canônico — CLARAINOVA02

## Última verificação consolidada
- Data: 2026-04-02
- Base local usada na verificação: `origin/main @ 86d3c18c8d95b0ad8f518863ac75da66a7826b55`
- Objetivo desta fotografia: evitar que mudanças feitas em dashboards, outra máquina ou outra ferramenta virem contexto implícito não versionado

## GitHub
- Repositório oficial: `https://github.com/WilsonMPeixoto-2/clarainova02.git`
- Branch oficial integrada: `origin/main`
- `origin/main` atualmente alinhada ao commit: `86d3c18c8d95b0ad8f518863ac75da66a7826b55`
- Trabalho local em andamento fora de `main`:
  - branch de sessão `session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING`
- Observação de continuidade:
  - a trilha principal deixou de depender da PR `#13`; o hardening atual está sendo preparado diretamente a partir de `main` com migration incremental e endurecimento de borda

## Vercel
- Projeto canônico: `clarainova02`
- URL oficial de produção: `https://clarainova02.vercel.app`
- Expectativa operacional atual:
  - a produção deve refletir o baseline publicado a partir de `main`
  - qualquer novo deploy manual precisa deixar rastro em relatório operacional e, se alterar o comportamento esperado, atualizar este arquivo

## Supabase
- Projeto oficial: `jasqctuzeznwdtbcuixn`
- URL oficial: `https://jasqctuzeznwdtbcuixn.supabase.co`
- Observação: qualquer troca de projeto, ref ou credencial canônica deve ser registrada aqui no mesmo bloco em que ocorrer

## Edge Functions verificadas
- `chat`
  - status: `ACTIVE`
  - versão observada: `9`
  - última atualização observada: `2026-04-01 06:51:26 UTC`
- `embed-chunks`
  - status: `ACTIVE`
  - versão observada: `7`
  - última atualização observada: `2026-04-02 20:48:47 UTC`
- `get-usage-stats`
  - status: `ACTIVE`
  - versão observada: `7`
  - última atualização observada: `2026-04-02 20:49:53 UTC`

## Estado operacional externo conhecido
- Hardening Supabase / RLS:
  - status: `em andamento`
  - situação conhecida:
    - este ambiente já consulta o Postgres remoto oficial do projeto `jasqctuzeznwdtbcuixn`
    - as tabelas `ingestion_jobs`, `document_processing_events`, `chat_metrics`, `search_metrics` e `query_analytics` já estão com `RLS` habilitado e sem policies para `public`/`anon`
    - o banco remoto usa policies administrativas baseadas em `public.is_admin_user()` e na tabela `public.admin_users`
    - o repositório local já passou a versionar esse contrato em `20260402112000_version_admin_users_contract.sql`
    - a migration local `20260402113000_harden_operational_analytics_access.sql` foi ajustada para não regredir esse estado mais seguro quando o helper existir
    - `supabase db push` continua inseguro neste clone porque o histórico remoto de migrations diverge fortemente do diretório local
    - `supabase migration list` mostrou quatro versões remotas sem arquivo local correspondente:
      - `20260328230351`
      - `20260329001517`
      - `20260329001619`
      - `20260401213217`
    - a mesma consulta também mostrou que as migrations locais versionadas neste clone ainda não aparecem como aplicadas no histórico remoto, apesar de o schema real já conter parte importante desse estado
- Google OAuth do admin:
  - status: `pendente`
  - evidência conhecida: Supabase respondeu `Unsupported provider: provider is not enabled`
- Gemini / embeddings:
  - status: `instável`
  - situação conhecida: embeddings reais continuam sujeitos a indisponibilidade/quota do provedor
  - implementação declarada no código: `gemini-embedding-001`
- Corpus inicial:
  - status: `não concluído`
  - situação conhecida: existe prova operacional com 1 PDF, mas não há lote curado inicial fechado

## Divergências remotas que exigem cuidado
- o endurecimento de `verify_jwt` nas functions administrativas já foi publicado e o fechamento de `RLS` foi confirmado no banco remoto, mas o contrato de `admin_users`/`is_admin_user()` ainda não está versionado neste clone
- o banco remoto contém versões de migration ausentes no diretório local e, ao mesmo tempo, não reconhece como aplicadas as migrations locais deste clone; qualquer `db push` cego pode sobrescrever um estado já mais seguro
- Google OAuth do admin continua fora do código e precisa ser confirmado diretamente no painel do Supabase/Google
- embeddings reais continuam sujeitos à estabilidade externa do Gemini

## Regras de atualização deste arquivo
- Atualize este arquivo sempre que mudar algo em:
  - GitHub (PR canônica, branch base, ordem de merge)
  - Vercel (deploy oficial, troca de projeto, env vars canônicas)
  - Supabase (project ref, providers de auth, funções publicadas, secrets ou modelo/provedor de embeddings)
- Nunca deixe uma mudança remota importante apenas em dashboard ou memória oral
