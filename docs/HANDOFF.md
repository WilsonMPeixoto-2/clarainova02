# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-01 00:00 UTC
- Atualizado por: ChatGPT (protocolo inicial)
- Branch de referência: `setup/continuity-protocol`
- Commit de base: `2a2cf9ab26b90c6b28cc685b2c13bff2cd10f3f9`

## Estado atual resumido
- O projeto já tem frontend público, chat estruturado, admin e pipeline RAG preparados.
- As prioridades técnicas imediatas continuam sendo:
  1. segurança de banco (RLS / policies)
  2. estratégia explícita de autenticação das Edge Functions administrativas
  3. acessibilidade do menu móvel
  4. memória oficial e continuidade entre máquinas/ferramentas
- Dependências externas ainda pendentes:
  - Google OAuth do admin
  - estabilidade operacional da API do Gemini
  - primeira carga curada do corpus real

## Último bloco concluído
- Bloco: `SETUP — Protocolo de continuidade`
- Status: `em preparação`

## O que está concluído
- Estrutura inicial de continuidade criada no repositório:
  - `docs/HANDOFF.md`
  - `.continuity/current-state.json`
  - `.continuity/session-log.jsonl`
  - `docs/CONTINUITY_PROTOCOL.md`
  - `docs/operational-reports/TEMPLATE.md`

## O que está pendente
- Integrar essas convenções ao fluxo real de trabalho diário
- Atualizar `docs/MIGRATION_STATUS.md` para refletir explicitamente o protocolo
- Eventualmente adicionar automações/checklists locais para abertura e fechamento de sessão

## Próxima ação recomendada
1. Revisar e mergear esta PR de protocolo de continuidade
2. A partir dela, exigir que toda sessão de trabalho atualize:
   - `docs/HANDOFF.md`
   - `.continuity/current-state.json`
   - `.continuity/session-log.jsonl`
   - relatório em `docs/operational-reports/`
3. Iniciar o próximo bloco técnico: **RLS / policies**

## Regras rápidas para qualquer ferramenta
Antes de trabalhar neste projeto, sempre:
1. fazer `git fetch origin --prune`
2. tratar `origin/main` como verdade oficial
3. ler:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/MIGRATION_STATUS.md`
   - último relatório em `docs/operational-reports/`
4. trabalhar em branch de sessão, nunca direto em `main`
5. ao encerrar, deixar tudo commitado, pushado e documentado
