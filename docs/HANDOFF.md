# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-02T07:45:21.786Z
- Atualizado por: CODEX @ HOME
- Branch de referência: `session/2026-04-02/HOME/CODEX/BLOCO-0-POST-MERGE`
- Commit de base oficial: `94677b6a6ec6aed8ab217fe5c2298ddd4c163322`
- Head da sessão: `94677b6a6ec6aed8ab217fe5c2298ddd4c163322`
- Último relatório: `docs/operational-reports/2026-04-02-block-0-main-integration.md`

## Estado atual resumido
- Fase atual: Continuidade integrada em main; preparação do BLOCO 1
- Bloco ativo: BLOCO 1 — RLS, auth admin e reconciliação operacional
- Status da sessão: `partial`
- Próxima ação recomendada: Atualizar a PR #13 sobre main, corrigir o bug do /admin para usuários sem sessão e revisar a estratégia de reconciliação das migrations antes de decidir o merge.

## Itens concluídos
- PR #12 mergeada em main no commit 94677b6a6ec6aed8ab217fe5c2298ddd4c163322
- BLOCO 0 marcado como integrado em docs/BLOCK_PLAN.md
- Estado remoto ajustado para refletir a continuidade oficial em main

## Itens pendentes
- Atualizar/rebasear a PR #13 sobre origin/main
- Corrigir o bug do /admin para usuários sem sessão na branch da PR #13
- Revisar e aceitar explicitamente a estratégia de reconciliação das migrations consolidadas

## Bloqueios externos
- Google OAuth do admin ainda pendente
- API do Gemini ainda instável para embeddings reais
- Corpus inicial curado ainda não carregado

## Notas operacionais
- Com a continuidade integrada em main, o próximo foco oficial do repositório passa a ser o BLOCO 1.
- A PR #13 continua exigindo atualização sobre a nova base antes de qualquer decisão de merge.

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
