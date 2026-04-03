# Estado Remoto Canônico — CLARAINOVA02

## Última verificação consolidada
- Data: 2026-04-03
- Base local usada na verificação: `origin/main @ fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`
- Objetivo desta fotografia: evitar que mudanças feitas em dashboards, outra máquina ou outra ferramenta virem contexto implícito não versionado

## GitHub
- Repositório oficial: `https://github.com/WilsonMPeixoto-2/clarainova02.git`
- Branch oficial integrada: `origin/main`
- `origin/main` atualmente alinhada ao commit: `fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`
- Trabalho local em andamento fora de `main`:
  - nenhuma branch de sessão permanece aberta como fonte principal; o BLOCO 4A já foi integrado
- Observação de continuidade:
  - a trilha principal deixou de depender da PR `#13`; o hardening atual está sendo preparado diretamente a partir de `main` com migration incremental e endurecimento de borda
  - o BLOCO 4A já alterou a produção, e a próxima frente oficial passa a ser o BLOCO 4B: validação remota do corpus e smoke test grounded

## Vercel
- Projeto canônico: `clarainova02`
- URL oficial de produção: `https://clarainova02.vercel.app`
- Expectativa operacional atual:
  - a produção deve refletir o baseline publicado a partir de `main`, já com a pilha Gemini nova declarada no código
  - qualquer novo deploy manual precisa deixar rastro em relatório operacional e, se alterar o comportamento esperado, atualizar este arquivo
- Deploy canônico mais recente observado:
  - source: `git`
  - status: `READY`
  - deployment id: `dpl_6kyS1eZ3YnMPij1LMtu4DvV1qieZ`
  - commit publicado: `fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`
  - aliases observados:
    - `https://clarainova02.vercel.app`
    - `https://clarainova02-wilson-m-peixotos-projects.vercel.app`
    - `https://clarainova02-git-main-wilson-m-peixotos-projects.vercel.app`

## Supabase
- Projeto oficial: `jasqctuzeznwdtbcuixn`
- URL oficial: `https://jasqctuzeznwdtbcuixn.supabase.co`
- Observação: qualquer troca de projeto, ref ou credencial canônica deve ser registrada aqui no mesmo bloco em que ocorrer

## Edge Functions verificadas
- `chat`
  - status: `ACTIVE`
  - versão observada: `13`
  - última atualização observada: `2026-04-03 05:22:48 UTC`
- `embed-chunks`
  - status: `ACTIVE`
  - versão observada: `11`
  - última atualização observada: `2026-04-03 05:22:40 UTC`
- `get-usage-stats`
  - status: `ACTIVE`
  - versão observada: `10`
  - última atualização observada: `2026-04-02 22:49:33 UTC`

## Estado operacional externo conhecido
- Hardening Supabase / RLS:
  - status: `reconciliado nesta branch`
  - situação conhecida:
    - este ambiente já consulta o Postgres remoto oficial do projeto `jasqctuzeznwdtbcuixn`
    - as tabelas `ingestion_jobs`, `document_processing_events`, `chat_metrics`, `search_metrics` e `query_analytics` já estão com `RLS` habilitado e sem policies para `public`/`anon`
    - o banco remoto usa policies administrativas baseadas em `public.is_admin_user()` e na tabela `public.admin_users`
    - o repositório local agora foi alinhado à mesma cadeia canônica de migrations registrada no remoto:
      - `20260328230351_clara_foundation_tables_and_indexes.sql`
      - `20260329001517_clara_rls_policies_and_search_functions.sql`
      - `20260329001619_clara_check_rate_limit_function.sql`
      - `20260401213217_harden_admin_authorization.sql`
    - `supabase migration list` voltou a alinhar local e remoto sem versões faltantes
    - `supabase db push --dry-run` agora retorna `Remote database is up to date`
- Google OAuth do admin:
  - status: `pendente`
  - evidência conhecida: Supabase respondeu `Unsupported provider: provider is not enabled`
  - estado do código:
    - `AdminAuth.tsx` já chama `signInWithOAuth({ provider: "google" })`
    - o callback `/auth/callback` já está implementado
    - a interface pública mantém Google como rota em habilitação por decisão consciente
  - pendências externas conhecidas:
    - habilitar provider no Supabase
    - conferir `Client ID` e `Client Secret`
    - alinhar redirect URLs no Supabase e no Google Console
- Gemini / embeddings:
  - status: `parcialmente alinhado`
  - situação conhecida: o código integrado em `main` já declara a pilha Gemini nova, mas o corpus remoto ainda precisa de verificação de contaminação e smoke test grounded
  - implementação declarada no código:
    - geração: `gemini-3.1-flash-lite-preview` com fallback para `gemini-3.1-pro-preview`
    - embeddings: `gemini-embedding-2-preview`
    - dimensionalidade esperada: `768`
    - secret requerido nas functions: `GEMINI_API_KEY`
- Corpus inicial:
  - status: `não concluído`
  - situação conhecida:
    - existe 1 documento legado no remoto: `MODELO_DE_OFICIO_PDDE.pdf`
    - o remoto possui 2 chunks persistidos para esse documento
    - não há embeddings persistidos nesses chunks
    - os chunks ainda usam o formato legado com prefixo textual `[Fonte: ... | Página: ...]`
    - o chat público ainda responde com grounding lexical/fallback sobre esse documento, mas o contrato novo de embedding ainda não foi validado no banco remoto
    - a conta provisionada visível no formulário do admin autentica sessão, mas não coincide com o admin bootstrap ativo em `public.admin_users`; para o teste operacional desta fase deve ser usada a conta administrativa real

## Divergências remotas que exigem cuidado
- Google OAuth do admin continua fora do código e precisa ser confirmado diretamente no painel do Supabase/Google
- o corpus remoto atual não mostra mistura entre gerações de embedding, mas ainda depende de reprocessamento porque o único documento legado está sem embeddings e sem metadados novos

## Regras de atualização deste arquivo
- Atualize este arquivo sempre que mudar algo em:
  - GitHub (PR canônica, branch base, ordem de merge)
  - Vercel (deploy oficial, troca de projeto, env vars canônicas)
  - Supabase (project ref, providers de auth, funções publicadas, secrets ou modelo/provedor de embeddings)
- Nunca deixe uma mudança remota importante apenas em dashboard ou memória oral
