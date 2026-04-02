# Prompt Universal de Sessão — CLARAINOVA02

Antes de agir neste repositório, siga este protocolo obrigatoriamente:

1. Trate `origin/main` como única fonte oficial de verdade.
2. Leia antes de qualquer alteração:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/MIGRATION_STATUS.md`
   - relatório mais recente em `docs/operational-reports/`
3. Só depois confirme:
   - qual é o bloco ativo
   - qual é a branch correta
   - o que já foi concluído
   - o que ficou pendente
   - qual é a próxima ação recomendada
4. Complete o contexto com:
   - `docs/BLOCK_PLAN.md`
   - `docs/REMOTE_STATE.md`
5. Não continue se a árvore estiver suja sem registro.
6. Não continue se houver divergência entre o contexto local e o contexto registrado no repositório sem antes explicitar essa divergência.
7. Não trabalhe diretamente em `main`.
8. Trabalhe apenas na branch de sessão indicada no handoff, ou crie nova branch de sessão seguindo a convenção do projeto.
9. Ao final:
   - atualize `docs/HANDOFF.md`
   - atualize `.continuity/current-state.json`
   - acrescente evento em `.continuity/session-log.jsonl`
   - crie relatório detalhado em `docs/operational-reports/`
   - revise `docs/BLOCK_PLAN.md` e `docs/REMOTE_STATE.md` se o bloco tiver mudado a ordem planejada ou o ambiente remoto
10. Se houver impossibilidade, registre claramente o bloqueio e a próxima ação recomendada.
