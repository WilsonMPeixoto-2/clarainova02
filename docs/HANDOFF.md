# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: `2026-04-19T21:51:11.7927720Z`
- Atualizado por: `CODEX @ WILSON-MP`
- Branch de trabalho: `session/2026-04-19/HOME/CODEX/V1-AUDIT-CLOSURE`
- Commit oficial auditado: `6426b33ceaa0d08336a23daad03c0fcba2f2514a`
- Último relatório: `docs/operational-reports/2026-04-19-remote-corpus-and-supabase-audit.md`

## Estado atual resumido
- O projeto está tecnicamente forte e operacionalmente utilizável, mas ainda em fase final de consolidação pré-`v1.0`.
- O frontend público e o chat estão maduros: home forte, posicionamento público claro, chat com resposta estruturada, exportação em PDF, impressão, feedback, persistência local e boa responsividade.
- O backend RAG continua robusto: `gemini-3.1-pro-preview` como primário, `gemini-3.1-flash-lite-preview` como fallback, structured generation, retrieval governado, leakage repair, emergency playbooks, cache de embeddings e cache de respostas.
- A expansão de query está desligada intencionalmente no código atual para evitar deriva semântica.
- A auditoria remota final confirmou corpus operacionalmente fechado: `23` documentos totais, `17` ativos, `23` processados e `289/289` chunks ativos com embedding.
- O tráfego recente ainda usa bastante caminhos lexicais: nos últimos `14` dias, `search_metrics` registrou `12 keyword_only`, `7 hybrid_governed`, `5 hybrid` e `4 keyword_only_targeted`.
- O Supabase remoto ainda tem leftovers de template (`public.users`, `public.posts`, `public.comments`) e esse ponto continua aberto.
- A documentação oficial do repositório estava materialmente defasada antes desta atualização: `current-state`, `HANDOFF`, `MIGRATION_STATUS` e `README` não representavam mais o comportamento real de `origin/main`.

## Evidências objetivas desta rodada
- `npm test` passou com `30` suites e `121` testes.
- Uma bateria focada em chat passou com `4` suites e `20` testes:
  - `src/test/chat-api.test.ts`
  - `src/test/chat-persistence.test.ts`
  - `src/test/ChatStructuredMessage.test.tsx`
  - `src/test/chat-feedback-controls.test.tsx`
- `npm run build` passou, mas com warnings de chunks grandes.
- `npm run validate` falhou no `lint` por dois pontos:
  - erro real em `supabase/functions/chat/index.ts` por `@typescript-eslint/no-explicit-any`
  - warning em `src/components/providers/SmoothScrollProvider.tsx` por `react-refresh/only-export-components`
- O site publicado foi auditado com navegação real em desktop e mobile.
- Uma única pergunta real foi executada no chat publicado, com resposta estruturada entregue corretamente e sem necessidade de novas consultas.
- O navegador não mostrou erros de console na home/chat publicada; só warnings repetidos de preload de fontes não consumidas rapidamente.

## Pendências prioritárias
1. Reconciliar definitivamente a documentação pública e operacional restante.
   - `README.md` ainda contradiz o código em pontos relevantes.
   - `docs/MIGRATION_STATUS.md` ainda reflete uma narrativa antiga do projeto.
2. Voltar `npm run validate` ao estado green.
   - Corrigir o `any` em `supabase/functions/chat/index.ts`.
   - Decidir se o warning de `SmoothScrollProvider` será removido ou aceito conscientemente.
3. Fechar a auditoria final do Supabase remoto.
   - Decidir se `users`, `posts` e `comments` serão removidas.
   - Preservar ou documentar explicitamente o modelo de acesso `service_role` dos caches.
4. Formalizar a governança do response cache.
   - Definir critérios de invalidação/versionamento.
   - Registrar `cache hit` na telemetria, hoje ausente no caminho de retorno antecipado.
5. Refinar arquitetura pública da informação.
   - O header desktop ainda não expõe `Funcionalidades` ou `Como funciona`.

## Bloqueios externos
- Google OAuth administrativo continua dependente de configuração externa.
- Os modelos Gemini de geração ainda estão em `preview`, com risco operacional externo de mudança futura.

## Próxima ação recomendada
- Iniciar o fechamento da governança do `chat_response_cache`:
  1. documentar chave, TTL e critérios de validade;
  2. explicitar quando o cache deve ser invalidado;
  3. fechar a lacuna de telemetria em `cache hit`;
  4. consolidar esse contrato no repositório.

## Nota crítica de continuidade
- O drift documental identificado nesta rodada não é detalhe cosmético. Ele já estava suficientemente grande para induzir diagnósticos errados por outras ferramentas.
- A partir desta atualização, o relatório de `2026-04-19` passa a ser a referência operacional mais confiável para o estado real do projeto.

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
