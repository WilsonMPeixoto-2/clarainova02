# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: `2026-04-20T04:33:30.0093592Z`
- Atualizado por: `CODEX @ WILSON-MP`
- Branch de trabalho: `session/2026-04-19/HOME/CODEX/V1-AUDIT-CLOSURE`
- Commit oficial auditado: `6426b33ceaa0d08336a23daad03c0fcba2f2514a`
- Último relatório: `docs/operational-reports/2026-04-20-final-housekeeping-and-release-gate.md`

## Estado atual resumido
- O projeto está tecnicamente forte e operacionalmente utilizável, mas ainda em fase final de consolidação pré-`v1.0`.
- O frontend público e o chat estão maduros: home forte, posicionamento público claro, chat com resposta estruturada, exportação em PDF, impressão, feedback, persistência local e boa responsividade.
- O backend RAG continua robusto: `gemini-3.1-pro-preview` como primário, `gemini-3.1-flash-lite-preview` como fallback, structured generation, retrieval governado, leakage repair, emergency playbooks, cache de embeddings e cache de respostas.
- A expansão de query está desligada intencionalmente no código atual para evitar deriva semântica.
- A auditoria remota final confirmou corpus operacionalmente fechado: `23` documentos totais, `17` ativos, `23` processados e `289/289` chunks ativos com embedding.
- A governança do `chat_response_cache` foi formalizada no repositório: há versão explícita de contrato, política documental própria, validação do payload cacheado e telemetria de `cache hit`.
- O header desktop da home agora expõe `Funcionalidades`, e o cabeçalho do chat passou a condensar rótulos em larguras intermediárias para reduzir ruído visual.
- O housekeeping final remoto foi concluído: `public.users`, `public.posts` e `public.comments` foram removidas do Supabase; `public.set_updated_at` recebeu `search_path` explícito; `embedding_cache` e `chat_response_cache` agora têm comentário operacional no banco.
- O warning residual de `SmoothScrollProvider.tsx` foi eliminado; `npm run validate` volta a fechar sem warning de lint residual.
- O tráfego recente ainda usa bastante caminhos lexicais: nos últimos `14` dias, `search_metrics` registrou `12 keyword_only`, `7 hybrid_governed`, `5 hybrid` e `4 keyword_only_targeted`.
- A documentação oficial do repositório estava materialmente defasada antes desta atualização: `current-state`, `HANDOFF`, `MIGRATION_STATUS` e `README` não representavam mais o comportamento real de `origin/main`.

## Evidências objetivas desta rodada
- `npm run validate` passou.
- `npm test` passou com `31` suites e `124` testes.
- `npm run build` passou, mas com warnings de chunks grandes.
- `npm run continuity:check` passou.
- O erro de `lint` em `supabase/functions/chat/index.ts` continua eliminado e o warning de `react-refresh/only-export-components` em `src/components/providers/SmoothScrollProvider.tsx` foi removido.
- A verificação visual local do bloco público foi concluída em desktop e mobile com `Playwright`, sem erros de console.
- O site publicado foi auditado com navegação real em desktop e mobile.
- Uma única pergunta real foi executada no chat publicado, com resposta estruturada entregue corretamente e sem necessidade de novas consultas.
- O navegador não mostrou erros de console na home/chat publicada; só warnings repetidos de preload de fontes não consumidas rapidamente.
- `supabase db advisors --linked --level warn` agora retorna apenas `auth_leaked_password_protection`, classificado como configuração externa do Supabase Auth.

## Pendências prioritárias
1. Decidir se o warning externo `auth_leaked_password_protection` será tratado antes ou depois da promoção.
   - Ele pertence ao Supabase Auth, não ao código nem ao schema versionado.
2. Decidir a promoção desta branch para `origin/main`.
   - Sem isso, produção e fonte oficial de verdade seguem desalinhadas.
3. Decidir o momento do deploy de produção.
   - Tecnicamente a branch está pronta; operacionalmente a decisão depende de `main`.

## Bloqueios externos
- Google OAuth administrativo continua dependente de configuração externa.
- Os modelos Gemini de geração ainda estão em `preview`, com risco operacional externo de mudança futura.
- Leaked Password Protection do Supabase Auth segue desabilitado no ambiente remoto e exige ajuste externo de configuração.

## Próxima ação recomendada
- Preparar a promoção para produção de forma coerente com o protocolo:
  1. integrar a branch em `origin/main`;
  2. decidir se o warning externo de Auth será aceito nesta rodada;
  3. publicar produção a partir de `main`.

## Nota crítica de continuidade
- O drift documental identificado nesta rodada não é detalhe cosmético. Ele já estava suficientemente grande para induzir diagnósticos errados por outras ferramentas.
- A partir desta atualização, a continuidade oficial já incorpora quatro fechamentos concretos da rodada: auditoria independente, reconciliação documental, governança do response cache e refinamento público de UX.

## Preambulo obrigatório para qualquer IA
1. Tratar `origin/main` como única fonte oficial de verdade.
2. Ler, nesta ordem:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/MIGRATION_STATUS.md`
   - relatório mais recente em `docs/operational-reports/`
3. Confirmar explicitamente:
   - commit oficial auditado
   - estado atual resumido
   - pendências prioritárias
   - próximos passos
4. Nunca assumir que relatórios antigos continuam válidos sem confronto com o código e o ambiente remoto.
5. Complementar a leitura com:
   - `docs/BLOCK_PLAN.md`
   - `docs/REMOTE_STATE.md`
