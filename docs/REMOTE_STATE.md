# Estado Remoto Canônico — CLARAINOVA02

## Última verificação consolidada
- Data: 2026-04-02
- Base local usada na verificação: `origin/main @ 94677b6a6ec6aed8ab217fe5c2298ddd4c163322`
- Objetivo desta fotografia: evitar que mudanças feitas em dashboards, outra máquina ou outra ferramenta virem contexto implícito não versionado

## GitHub
- Repositório oficial: `https://github.com/WilsonMPeixoto-2/clarainova02.git`
- Branch oficial integrada: `origin/main`
- `origin/main` atualmente alinhada ao commit: `94677b6a6ec6aed8ab217fe5c2298ddd4c163322`
- PRs abertas relevantes:
  - PR `#13` — RLS, auth admin e reconciliação de migrations
- PR já integrada:
  - PR `#12` — continuidade e automação mínima — mergeada em `2026-04-02T07:43:05Z`
- Dependência atual entre branches/PRs:
  - a PR `#13` ainda precisa ser atualizada para refletir a nova `main`
  - ordem aceita a partir deste ponto: atualizar a `#13`, revisar riscos e só então decidir o merge

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
  - versão observada: `6`
  - última atualização observada: `2026-04-01 21:33:47 UTC`
- `get-usage-stats`
  - status: `ACTIVE`
  - versão observada: `6`
  - última atualização observada: `2026-04-01 21:34:28 UTC`

## Estado operacional externo conhecido
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
- o estado remoto do Supabase já avançou além de `main` em algumas funções administrativas
- a PR `#13` ainda carrega trabalho baseado numa linha anterior à integração formal da continuidade
- por isso, nenhuma ferramenta deve assumir que a PR `#13` já está pronta para merge sem atualização sobre `main`

## Regras de atualização deste arquivo
- Atualize este arquivo sempre que mudar algo em:
  - GitHub (PR canônica, branch base, ordem de merge)
  - Vercel (deploy oficial, troca de projeto, env vars canônicas)
  - Supabase (project ref, providers de auth, funções publicadas, secrets ou modelo/provedor de embeddings)
- Nunca deixe uma mudança remota importante apenas em dashboard ou memória oral
