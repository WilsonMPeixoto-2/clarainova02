# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-02T05:40:49.343Z
- Atualizado por: CODEX @ HOME
- Branch de referência: `session/2026-04-02/HOME/CODEX/BLOCO-0-CONTINUIDADE-PLUS`
- Commit de base oficial: `184276fa698f80acd522919e56e19cf8e66e1d49`
- Head da sessão: `67352fbdef0d4996637b3b3aaed3d6ec44cde85f`
- Último relatório: `docs/operational-reports/2026-04-02-block-0-continuity-hardening.md`

## Estado atual resumido
- Fase atual: Infraestrutura de continuidade reforçada e memória operacional
- Bloco ativo: BLOCO 0 — Continuidade reforçada e memória operacional
- Status da sessão: `partial`
- Próxima ação recomendada: Integrar a base de continuidade em main, atualizar a PR #13 sobre essa base e só então seguir para RLS/auth admin.

## Itens concluídos
- Plano canônico de blocos versionado em docs/BLOCK_PLAN.md
- Estado remoto canônico versionado em docs/REMOTE_STATE.md
- Preambulo obrigatório incorporado ao protocolo e ao prompt universal
- Automação de continuidade endurecida para exigir BLOCK_PLAN e REMOTE_STATE

## Itens pendentes
- Integrar a infraestrutura de continuidade em origin/main
- Atualizar/rebasear a PR #13 após a integração do bloco de continuidade

## Bloqueios externos
- Google OAuth do admin ainda pendente
- API do Gemini ainda instável para embeddings reais
- Corpus inicial curado ainda não carregado

## Notas operacionais
- Esta branch reforça a PR #12 sem substituir a necessidade de mergeá-la em main.
- A ordem de integração aceita segue sendo PR #12 antes da PR #13.

## Preambulo obrigatório para qualquer IA
1. tratar `origin/main` como única fonte oficial de verdade
2. ler, nesta ordem:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/MIGRATION_STATUS.md`
   - último relatório em `docs/operational-reports/`
3. depois confirmar:
   - bloco ativo
   - branch correta
   - itens concluídos
   - itens pendentes
   - próxima ação recomendada
4. complementar a leitura com:
   - `docs/BLOCK_PLAN.md`
   - `docs/REMOTE_STATE.md`
5. não continuar se houver divergência entre o contexto local e o contexto registrado no repositório sem explicitar essa divergência
6. trabalhar em branch de sessão, nunca direto em `main`
7. ao encerrar, deixar tudo commitado, pushado e documentado
