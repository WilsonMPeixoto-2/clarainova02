# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: `2026-04-21T03:53:39.0809145Z`
- Atualizado por: `CODEX @ WILSON-MP`
- Branch de trabalho: `main`
- `origin/main` atual: `55c563e0e72e664b49b3e21aa0ebe6c5b1f1f3d1`
- Último relatório: `docs/operational-reports/2026-04-20-conceptual-didatic-and-reference-cleanup.md`

## Estado atual resumido
- O produto está tecnicamente forte, com frontend público e chat maduros.
- O backend RAG continua robusto, com `gemini-3.1-pro-preview` como primário, `gemini-3.1-flash-lite-preview` como fallback, retrieval governado, repair chain e caches ativos.
- A query expansion segue desligada intencionalmente no runtime atual.
- O corpus remoto auditado está saudável: `23` documentos totais, `17` ativos, `23` processados e `289/289` chunks ativos com embedding.
- O housekeeping final remoto foi concluído no projeto vinculado: leftovers removidos, `set_updated_at` endurecida e comentários operacionais adicionados aos caches.
- A rodada anterior já havia melhorado o backend: follow-up lexical/semântico separado, packing mais hierarquizado, `direto` menos truncado e quality gate textual/editorial com repair.
- Nesta rodada curta, o defeito residual do `didatico` conceitual foi corrigido no fallback: perguntas conceituais passaram a sair como `explicacao`, sem etapas artificiais, com resumo limpo e sem observações procedimentais indevidas.
- A verificação remota final do caso `bloco de assinatura` confirmou `modoResposta: "explicacao"`, `stepCount: 0`, `observacoes: []` e subtítulos de referência limpos.
- `npm run validate` passou após as mudanças desta rodada.
- O próximo bloco correto passou a ser o polimento editorial/visual da aba do chat, agora sobre um backend conceitual mais estável.

## Pendências reais
1. Iniciar a rodada de polimento editorial/visual da aba do chat em cima deste baseline já consolidado.
2. Revisar composer, tipografia, hierarquia, destaque de modos e navegação de respostas longas.
3. Ampliar, quando fizer sentido, a bateria de perguntas conceituais reais para confirmar o novo padrão em mais casos.

## Bloqueios externos
- Google OAuth administrativo continua dependente de configuração externa.
- Os modelos Gemini de geração ainda estão em `preview`.
- Leaked Password Protection do Supabase Auth segue desabilitado no ambiente remoto.

## Próxima ação recomendada
1. Abrir a frente de polimento editorial/visual da aba do chat.
2. Priorizar composer, legibilidade, contraste, hierarquia de resposta e revisão dos accordions/etapas.

## Preambulo obrigatório para qualquer IA
1. Tratar `origin/main` como única fonte oficial de verdade.
2. Ler, nesta ordem:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/MIGRATION_STATUS.md`
   - relatório mais recente em `docs/operational-reports/`
3. Confirmar explicitamente:
   - `origin/main` atual
   - branch ativa
   - estado resumido
   - pendências reais
   - próxima ação
4. Complementar a leitura com:
   - `docs/BLOCK_PLAN.md`
   - `docs/REMOTE_STATE.md`
