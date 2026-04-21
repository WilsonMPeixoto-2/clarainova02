# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: `2026-04-21T05:41:58.7776840Z`
- Atualizado por: `CODEX @ WILSON-MP`
- Branch de trabalho: `main`
- `origin/main` atual: `7ea1c76a0a8d7b928e430d7f437961b74457049d`
- Último relatório: `docs/operational-reports/2026-04-21-chat-editorial-polish.md`

## Estado atual resumido
- O produto está tecnicamente forte, com frontend público e chat maduros.
- O backend RAG continua robusto, com `gemini-3.1-pro-preview` como primário, `gemini-3.1-flash-lite-preview` como fallback, retrieval governado, repair chain e caches ativos.
- A query expansion segue desligada intencionalmente no runtime atual.
- O corpus remoto auditado está saudável: `23` documentos totais, `17` ativos, `23` processados e `289/289` chunks ativos com embedding.
- O housekeeping final remoto foi concluído no projeto vinculado: leftovers removidos, `set_updated_at` endurecida e comentários operacionais adicionados aos caches.
- A rodada anterior já havia melhorado o backend: follow-up lexical/semântico separado, packing mais hierarquizado, `direto` menos truncado e quality gate textual/editorial com repair.
- Nesta rodada curta, o defeito residual do `didatico` conceitual foi corrigido no fallback: perguntas conceituais passaram a sair como `explicacao`, sem etapas artificiais, com resumo limpo e sem observações procedimentais indevidas.
- A verificação remota final do caso `bloco de assinatura` confirmou `modoResposta: "explicacao"`, `stepCount: 0`, `observacoes: []` e subtítulos de referência limpos.
- Nesta nova rodada, o polimento editorial/visual da aba do chat foi aplicado com foco em composer, tipografia, hierarquia, modos de resposta, navegação interna e clareza de etapas/citações.
- O frontend agora dialoga melhor com respostas `direto` vs `didatico` e com layouts `checklist` vs `passo_a_passo`, usando labels e seções mais semânticas.
- O composer ficou maior, a tipografia cresceu, as etapas deixaram de nascer escondidas em cenários comuns e os números passaram a ter significado explícito (`Passo 1`, `Etapa 1`, `Fonte 1`).
- `npm run validate` passou após as mudanças desta rodada, agora com `33` suites e `132` testes.
- Foi adicionada a dependência de desenvolvimento `playwright` para suporte a validação visual local sem consumir a API.

## Pendências reais
1. Publicar este bloco em produção a partir de `main`.
2. Decidir se a próxima rodada volta ao backend para qualidade textual/editorial da resposta ou se entra em microajustes finais de UI.
3. Se houver nova rodada de frontend, revisar finamente a toolbar superior e a experiência de referências longas.

## Bloqueios externos
- Google OAuth administrativo continua dependente de configuração externa.
- Os modelos Gemini de geração ainda estão em `preview`.
- Leaked Password Protection do Supabase Auth segue desabilitado no ambiente remoto.

## Próxima ação recomendada
1. Fazer commit, push e deploy deste bloco em `main`.
2. Depois da publicação, escolher entre:
   - retomar backend/qualidade da resposta;
   - ou fazer apenas acabamento fino de UI residual.

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
