# Estado Remoto Canônico — CLARAINOVA02

## Última verificação consolidada
- Data: 2026-04-05
- Base local usada na verificação: `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET @ f95273f1c0cfd2be456602d559f4dcf6528f194c`
- Objetivo desta fotografia: evitar que mudanças feitas em dashboards, outra máquina ou outra ferramenta virem contexto implícito não versionado

## GitHub
- Repositório oficial: `https://github.com/WilsonMPeixoto-2/clarainova02.git`
- Branch oficial integrada: `origin/main`
- `origin/main` atualmente alinhada ao commit local preparado para publicação: `6770c85d62dd8d01fa1b7324fac03a88bdb6d099`
- Trabalho local em andamento fora de `main`:
  - branch ativa de sessão: `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
  - a branch de sessão foi publicada em `origin` até o commit `f95273f1c0cfd2be456602d559f4dcf6528f194c`
  - a linha principal continua íntegra em `main`, mas a produção foi manualmente atualizada a partir da branch de sessão
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
  - a produção agora reflete manualmente o pacote `R4B` publicado a partir da branch `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET` no commit `f95273f1c0cfd2be456602d559f4dcf6528f194c`
  - isso inclui budget real por request, telemetria por estágio em `chat_metrics.metadata_json`, follow-up contextualizado no retrieval, breakdown explícito de prompt/histórico, retorno de `request_id` na `chat`, `submit-chat-feedback` e o dashboard admin de gaps alimentado por `get-usage-stats`
  - `origin/main` continua sendo a fonte oficial integrada, então existe divergência intencional e documentada entre `main` e a produção até a próxima reconciliação
  - qualquer novo deploy manual precisa deixar rastro em relatório operacional e, se alterar o comportamento esperado, atualizar este arquivo
- Deploy canônico mais recente observado:
  - source: `manual_cli`
  - status: `READY`
  - deployment id: `dpl_J37W4zYAhPYbK53B5aVvpaeqnTJX`
  - commit publicado: `f95273f1c0cfd2be456602d559f4dcf6528f194c`
  - inspector: `https://vercel.com/wilson-m-peixotos-projects/clarainova02/J37W4zYAhPYbK53B5aVvpaeqnTJX`
  - aliases observados:
    - `https://clarainova02.vercel.app`
    - `https://clarainova02-7z0u4vb0l-wilson-m-peixotos-projects.vercel.app`

## Supabase
- Projeto oficial: `jasqctuzeznwdtbcuixn`
- URL oficial: `https://jasqctuzeznwdtbcuixn.supabase.co`
- Observação: qualquer troca de projeto, ref ou credencial canônica deve ser registrada aqui no mesmo bloco em que ocorrer

## Edge Functions verificadas
- `chat`
  - status: `ACTIVE`
  - versão observada: `28`
  - última atualização observada: `2026-04-05 11:00:49 UTC`
- `submit-chat-feedback`
  - status: `ACTIVE`
  - versão observada: `1`
  - última atualização observada: `2026-04-05 11:14:19 UTC`
- `embed-chunks`
  - status: `ACTIVE`
  - versão observada: `17`
  - última atualização observada: `2026-04-05 06:29:43 UTC`
- `get-usage-stats`
  - status: `ACTIVE`
  - versão observada: `12`
  - última atualização observada: `2026-04-05 11:26:14 UTC`

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
  - status: `pacote R0-R2 publicado, regressão pós-publicação corrigida, R3A-R3C já publicados, R4A feedback loop em produção e R4B dashboard admin de gaps também publicado`
  - situação conhecida:
    - a Edge Function remota `chat` já foi republicada na versão `28` com follow-up contextualizado no retrieval, suporte a `contextSummary` vindo do chat web, budget real, métricas por estágio, breakdown explícito de prompt/histórico e retorno de `X-Clara-Request-Id`
    - a nova Edge Function remota `submit-chat-feedback` já está ativa na versão `1`
    - a Edge Function remota `embed-chunks` já foi republicada na versão `17` com o contrato textual assimétrico de embeddings introduzido em `R2`
    - a produção web foi atualizada manualmente por Vercel CLI com o pacote do repositório até o commit `f95273f`
    - a migration remota `20260405121500_add_query_feedback_fields.sql` já foi aplicada e abriu o contrato de feedback em `query_analytics`
    - a Edge Function remota `get-usage-stats` já foi republicada na versão `12`, com agrupamento por `topic_label`, lacunas recentes e sinais de baixa confiança / feedback negativo
    - a migration remota `20260404084500_refine_hybrid_search_for_governed_corpus.sql` já foi aplicada e alinhou `hybrid_search_chunks` ao corpus governado por `título`, `origem`, `versão` e `section_title`
    - a migration remota `20260404134500_add_targeted_chunk_retrieval.sql` também já está aplicada no projeto oficial
    - a migration remota `20260405114000_normalize_term_document_metadata.sql` normalizou o `document_kind` do `Termo de Uso` para `termo`
  - implementação declarada no código:
    - geração: roteamento entre `gemini-3.1-flash-lite-preview` e `gemini-3.1-pro-preview` por complexidade, com `thinkingLevel` e temperatura dinâmica
    - embeddings: `gemini-embedding-2-preview`
    - dimensionalidade esperada: `768`
    - secret requerido nas functions: `GEMINI_API_KEY`
    - expansão de query: `gemini-3.1-flash-lite-preview` com timeout de `3s`
    - recuperação híbrida: `match_count = 12`
    - telemetria nova: `rag_quality_score`, `expanded_query`, breakdown explícito de `prompt_tokens_*` / `history_*` e feedback explícito do usuário em `query_analytics`
    - source-target routing: perguntas que nomeiam explicitamente nota oficial, wiki, UFSCar ou manual PEN agora passam por recuperação em dois estágios (`hybrid_search_chunks` + `fetch_targeted_chunks`)
    - contrato atual de embedding: framing textual explícito para query/documento, com `taskType` e `title` preservados como pistas complementares de API
- Corpus inicial:
  - status: `núcleo local, cobertura PEN e apoio versionado ativos`
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
    - materiais `COBERTURA_P2` do PEN já foram ingeridos com precedência editorial inferior ao núcleo SEI.Rio
    - materiais `APOIO_P3` versionado já foram ingeridos com `topic_scope = interface_update` e peso reduzido
    - uploads futuros, sob o pacote `R2` já publicado nas functions, voltam a usar chunking semântico com `sectionTitle` e `chunk.content` limpo, preservando fonte/página em metadados estruturados
    - a avaliação inicial do RAG sobre o núcleo local registrou `9/9` respostas `HTTP 200`, sem web fallback e com escopo exato
    - a avaliação ampliada do lote 3 registrou `16/16` respostas `HTTP 200`, `16/16` sem web fallback, `15/16` com `answerScopeMatch = exact` e `13/16` com a referência esperada explicitamente presente
    - o corpus remoto foi auditado e limpo: o guia legado de `88` chunks virou `NUCLEO_P1`, a versão governada inferior foi desativada e o `MODELO_DE_OFICIO_PDDE.pdf` saiu do corpus ativo
    - o `topic_scope` do Termo de Uso foi corrigido para `sei_rio_termo` e o `document_kind` remoto agora está normalizado para `termo`
    - a avaliação batch 3 pós source-routing registrou `16/16` perfeito em todas as métricas principais
    - o benchmark canônico remoto pós-publicação do `R4A` ficou green:
      - `Didático`: `16/16 expectedAllMet`, `15/16 scopeExact`, `avgFinalConfidence 0.9906`
      - `Direto`: `16/16 expectedAllMet`, `16/16 scopeExact`, `avgFinalConfidence 1.0`
    - o benchmark canônico executado logo após o `R4B` entrou em drift severo, apesar de o pacote publicado ter sido admin-only:
      - `Didático`: `scopeExact 0/16`, `expectedAllMet 1/16`, `avgFinalConfidence 0.59`
      - `Direto`: `scopeExact 0/16`, `expectedAllMet 1/16`, `avgFinalConfidence 0.59`
      - sintoma dominante: respostas desviando para `Guia documental localizado` e concentrando citações no Decreto Rio nº 57.250
    - a prova de ponta a ponta do feedback foi validada em produção com `request_id` retornado no header da `chat`, `submit-chat-feedback` respondendo `ok = true` e persistência confirmada em `query_analytics`
    - a próxima frente de corpus é substituir o Decreto `55.615` por texto íntegro oficial e ampliar a bateria manual

## Divergências remotas que exigem cuidado
- a produção web e as functions `chat` / `embed-chunks` / `submit-chat-feedback` / `get-usage-stats` estão à frente de `origin/main`, porque os deploys manuais de `2026-04-05` partiram da branch de sessão e o último deles publicou `f95273f`
- Google OAuth do admin continua fora do código e precisa ser confirmado diretamente no painel do Supabase/Google
- o corpus remoto atual não mostra mistura entre gerações de embedding, mas ainda há um documento legado sem embeddings e sem metadados novos
- o histórico documental anterior ainda contém leituras que assumiam prefixo textual em `chunk.content`; sob `R2`, o fluxo novo voltou a separar conteúdo vetorial limpo e metadado de citação
- o source-target routing precisa ser monitorado para evitar overboost quando a fonte nomeada estiver semanticamente fraca ou tangencial

## Regras de atualização deste arquivo
- Atualize este arquivo sempre que mudar algo em:
  - GitHub (PR canônica, branch base, ordem de merge)
  - Vercel (deploy oficial, troca de projeto, env vars canônicas)
  - Supabase (project ref, providers de auth, funções publicadas, secrets ou modelo/provedor de embeddings)
- Nunca deixe uma mudança remota importante apenas em dashboard ou memória oral
