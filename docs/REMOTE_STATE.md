# Estado Remoto Canônico — CLARAINOVA02

## Última verificação consolidada
- Data: 2026-04-04
- Base local usada na verificação: `origin/main @ 5c59b2169afff642871747b166286a43fc1348ea`
- Objetivo desta fotografia: evitar que mudanças feitas em dashboards, outra máquina ou outra ferramenta virem contexto implícito não versionado

## GitHub
- Repositório oficial: `https://github.com/WilsonMPeixoto-2/clarainova02.git`
- Branch oficial integrada: `origin/main`
- `origin/main` atualmente alinhada ao commit: `5c59b2169afff642871747b166286a43fc1348ea`
- Trabalho local em andamento fora de `main`:
  - nenhuma branch de sessão bloqueando a linha principal neste instante; o próximo trabalho pode reabrir uma branch nova a partir de `main`
- Observação de análise remota:
  - a branch paralela `origin/session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING` foi revisada e contém refinamentos úteis de chat/layout, mas não é candidata a merge integral
  - a branch `origin/copilot/analise-completa-codigos-e-layout` foi tratada apenas como fonte de leitura, não de integração
- Observação de continuidade:
  - a trilha principal deixou de depender da PR `#13`; o hardening atual segue diretamente a partir de `main`
  - o BLOCO 4C já está publicado em produção, o uplift paralelo do RAG já entrou na linha principal e o batch 1 de corpus governado do SEI.Rio já foi integrado

## Vercel
- Projeto canônico: `clarainova02`
- URL oficial de produção: `https://clarainova02.vercel.app`
- Expectativa operacional atual:
  - a produção deve refletir o baseline publicado a partir de `main`, já com a pilha Gemini nova declarada no código, a terceira rodada de polimento da janela do chat e o novo sistema visual do símbolo da CLARA
  - qualquer novo deploy manual precisa deixar rastro em relatório operacional e, se alterar o comportamento esperado, atualizar este arquivo
- Deploy canônico mais recente observado:
  - source: `git`
  - status: `READY`
  - deployment id: `dpl_ycURU2FVB1ABYuFRzdSckTo9K984`
  - commit publicado: `5c59b2169afff642871747b166286a43fc1348ea`
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
  - versão observada: `15`
  - última atualização observada: `2026-04-04 04:03:53 UTC`
- `embed-chunks`
  - status: `ACTIVE`
  - versão observada: `16`
  - última atualização observada: `2026-04-04 08:09:31 UTC`
- `get-usage-stats`
  - status: `ACTIVE`
  - versão observada: `11`
  - última atualização observada: `2026-04-03 07:33:32 UTC`

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
  - status: `RAG ampliado no código, frontend em produção e chat remoto republicado`
  - situação conhecida:
    - o `main` agora inclui um uplift paralelo do RAG com expansão de query, recuperação com janela maior, enriquecimento por chunks adjacentes, prompt sensível à qualidade da recuperação e UI grounded mais rica
    - a Edge Function remota `chat` já foi republicada com esse novo comportamento
    - `embed-chunks` não precisou de nova publicação nesta rodada específica
  - implementação declarada no código:
    - geração: `gemini-3.1-flash-lite-preview` com fallback para `gemini-3.1-pro-preview`
    - embeddings: `gemini-embedding-2-preview`
    - dimensionalidade esperada: `768`
    - secret requerido nas functions: `GEMINI_API_KEY`
    - expansão de query: `gemini-3.1-flash-lite-preview` com timeout de `3s`
    - recuperação híbrida: `match_count = 12`
    - telemetria nova: `rag_quality_score` e `expanded_query`
- Corpus inicial:
  - status: `núcleo local ativo em produção`
  - situação conhecida:
    - o corpus ativo já contém um núcleo local do SEI.Rio formado por decretos, resolução, guias, FAQs e termo de uso oficiais
    - o batch local ingerido inclui:
      - Decreto Rio nº 57.250/2025
      - Resolução CVL nº 237/2025
      - Guia do usuário interno – SEI.Rio
      - Guia de migração – SEI.Rio
      - Guia do usuário externo – SEI.Rio
      - FAQ do servidor – SEI.Rio
      - FAQ do cidadão – SEI.Rio
      - Termo de Uso e Aviso de Privacidade do SEI.Rio
    - o documento `SEI-Guia-do-usuario-Versao-final.pdf` segue ativo como cobertura operacional e pode competir em perguntas amplas, mas não substitui o núcleo local
    - o documento legado `MODELO_DE_OFICIO_PDDE.pdf` foi inativado por estar fora do escopo SEI
    - o Decreto Rio nº 55.615/2025 está fora do corpus ativo por captura ainda parcial
    - materiais `COBERTURA_P2` do PEN e `APOIO_P3` versionado já foram baixados para staging local, mas ainda não foram ingeridos no grounding principal
    - uploads futuros, sob o `main` atual, passam a usar chunking semântico com `sectionTitle` e prefixo automático `[Fonte: ... | Página: ...]` em `chunk.content`
    - a avaliação inicial do RAG sobre o núcleo local registrou `9/9` respostas `HTTP 200`, sem web fallback e com escopo exato
    - o próximo teste remoto objetivo continua sendo repetir o upload do mesmo PDF para validar a deduplicação na UI, enquanto a próxima frente de corpus é substituir o Decreto 55.615 por texto íntegro

## Divergências remotas que exigem cuidado
- Google OAuth do admin continua fora do código e precisa ser confirmado diretamente no painel do Supabase/Google
- o corpus remoto atual não mostra mistura entre gerações de embedding, mas ainda há um documento legado sem embeddings e sem metadados novos
- o uplift paralelo do RAG alterou a política de construção de chunks para uploads futuros; leituras antigas que assumiam `content` sempre limpo deixaram de valer

## Regras de atualização deste arquivo
- Atualize este arquivo sempre que mudar algo em:
  - GitHub (PR canônica, branch base, ordem de merge)
  - Vercel (deploy oficial, troca de projeto, env vars canônicas)
  - Supabase (project ref, providers de auth, funções publicadas, secrets ou modelo/provedor de embeddings)
- Nunca deixe uma mudança remota importante apenas em dashboard ou memória oral
