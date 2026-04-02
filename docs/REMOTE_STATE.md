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
    - migration `20260402113000_harden_operational_analytics_access.sql` preparada localmente
    - este ambiente não possui senha de Postgres nem projeto linkado para `supabase db push`
    - a aplicação remota da migration continua pendente de um ambiente com credencial de banco
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
- o endurecimento de `verify_jwt` nas functions administrativas já foi publicado, mas o fechamento de `RLS` ainda depende de aplicar a migration no banco remoto
- Google OAuth do admin continua fora do código e precisa ser confirmado diretamente no painel do Supabase/Google
- embeddings reais continuam sujeitos à estabilidade externa do Gemini

## Regras de atualização deste arquivo
- Atualize este arquivo sempre que mudar algo em:
  - GitHub (PR canônica, branch base, ordem de merge)
  - Vercel (deploy oficial, troca de projeto, env vars canônicas)
  - Supabase (project ref, providers de auth, funções publicadas, secrets ou modelo/provedor de embeddings)
- Nunca deixe uma mudança remota importante apenas em dashboard ou memória oral
