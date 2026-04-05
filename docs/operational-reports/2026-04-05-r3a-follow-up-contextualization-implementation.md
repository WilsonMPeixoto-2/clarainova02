# 2026-04-05 — R3A local: follow-up contextualizado no retrieval

## Objetivo
Abrir a nova trilha prioritária do BLOCO 5 com uma correção de qualidade conversacional: impedir que follow-ups anafóricos curtos (`"e nesse caso?"`, `"e se for para outra unidade?"`) caiam em retrieval semanticamente pobre por embeddarem apenas a última mensagem do usuário.

## Decisão
- O layout do chat ficou fora de escopo por coexistência com outra frente paralela.
- A mudança foi concentrada em transporte do chat, helper puro de contexto e backend da Edge Function `chat`.
- O backend continua gerando resposta com o histórico textual normal; apenas a camada de retrieval passou a contextualizar a query quando a pergunta atual for um follow-up curto e houver resumo estruturado da última resposta da CLARA.

## Implementação local
- `src/lib/chat-api.ts`
  - o payload enviado à function `chat` agora inclui `contextSummary` opcional para mensagens do assistente, derivado de `structuredResponse.tituloCurto` + `structuredResponse.resumoInicial`
- `supabase/functions/chat/conversation-context.ts`
  - novo helper puro para:
    - detectar follow-up contextual curto
    - preferir `contextSummary` da CLARA no snippet da conversa usado na expansão
    - montar a query contextualizada de retrieval com `pergunta_atual`, `pergunta_anterior` e `contexto_clara`
- `supabase/functions/chat/index.ts`
  - parser do request agora aceita e sanitiza `contextSummary`
  - a expansão de query passou a reutilizar o snippet de conversa enriquecido
  - o embedding principal da query e o `query_text` do `hybrid_search_chunks` agora usam a query contextualizada quando a heurística de follow-up dispara
  - `search_metrics.keyword_query_text` passa a registrar o texto efetivamente usado no retrieval lexical
- `src/test/chat-api.test.ts`
  - cobertura do transporte do resumo estruturado para o backend
- `src/test/chat-conversation-context.test.ts`
  - cobertura da heurística de follow-up e da montagem da query contextualizada

## Validação local
- `npm run typecheck`
- `npx vitest run src/test/chat-api.test.ts src/test/chat-conversation-context.test.ts src/test/chat-persistence.test.ts`
- `npm run validate`

## Resultado
- `npm run validate` passou com `18` suites e `83` testes
- o `R3A` ficou pronto localmente sem tocar em componentes visuais do chat
- a próxima etapa operacional é publicar esta rodada, verificar benchmark remoto e então abrir `R3B`

## Próxima ação
- commitar e publicar o `R3A`
- rodar benchmark canônico remoto pós-deploy
- se a produção permanecer green, iniciar `R3B` com observabilidade por estágio e budget de timeout
