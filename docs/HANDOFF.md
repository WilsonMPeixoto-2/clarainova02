# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: `2026-04-20T04:37:29.8608749Z`
- Atualizado por: `CODEX @ WILSON-MP`
- Branch de trabalho: `session/2026-04-19/HOME/CODEX/V1-AUDIT-CLOSURE`
- `origin/main` atual: `f062d256a58c31c024b20ba9d505bf21ddf9ef84`
- Último relatório: `docs/operational-reports/2026-04-20-final-housekeeping-and-release-gate.md`

## Estado atual resumido
- O produto está tecnicamente forte, com frontend público e chat maduros.
- O backend RAG continua robusto, com `gemini-3.1-pro-preview` como primário, `gemini-3.1-flash-lite-preview` como fallback, retrieval governado, repair chain e caches ativos.
- A query expansion segue desligada intencionalmente no runtime atual.
- O corpus remoto auditado está saudável: `23` documentos totais, `17` ativos, `23` processados e `289/289` chunks ativos com embedding.
- O housekeeping final remoto foi concluído no projeto vinculado: leftovers removidos, `set_updated_at` endurecida e comentários operacionais adicionados aos caches.
- `npm run validate`, `npm test`, `npm run build` e `npm run continuity:check` passaram nesta rodada.
- O único advisor relevante remanescente no Supabase é `auth_leaked_password_protection`, classificado como configuração externa do Supabase Auth.

## Pendências reais
1. Concluir a integração desta branch com `origin/main` sem perder coerência com a fonte oficial.
2. Decidir se `auth_leaked_password_protection` será tratado antes da promoção.
3. Decidir o momento do deploy de produção a partir de `main`.

## Bloqueios externos
- Google OAuth administrativo continua dependente de configuração externa.
- Os modelos Gemini de geração ainda estão em `preview`.
- Leaked Password Protection do Supabase Auth segue desabilitado no ambiente remoto.

## Próxima ação recomendada
1. Fechar o merge de integração com `origin/main`.
2. Rerodar a baseline local após o merge.
3. Se tudo permanecer verde, decidir promoção para `main` e deploy de produção.

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
