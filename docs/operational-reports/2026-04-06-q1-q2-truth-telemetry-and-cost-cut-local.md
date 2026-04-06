# 2026-04-06 — Q1 truth telemetry e primeiro corte de Q2 (local)

## Objetivo
- Iniciar o `quality-first reset` por onde a CLARA mais se autoenganava:
  - autoavaliação implícita de respostas como “satisfatórias”
  - uso de score bruto de retrieval como se fosse qualidade final
  - custo excessivo por pergunta no fluxo Gemini, especialmente em cenário de `free tier` ou orçamento apertado

## Escopo desta rodada
- backend do chat
- semântica de telemetria
- leitura do admin sobre saúde/gaps
- corte tático de custo no caminho principal
- sem mudanças arquiteturais de layout

## Implementação local

### Q1 — Truth telemetry
- Novo helper: `supabase/functions/chat/telemetry-quality.ts`
- Regras novas:
  - respostas bem-sucedidas não são mais marcadas automaticamente como `is_answered_satisfactorily = true`
  - `is_answered_satisfactorily` volta a ser `null` até feedback real do usuário
  - `grounded_fallback` passa a ser tratado como `partial`, não como “resposta plena”
  - `rag_confidence_score` deixa de copiar `retrievalTopScore` bruto e passa a refletir uma avaliação mais honesta
  - falha de provedor (`falha_provedor`) deixa de virar falsamente lacuna de conteúdo
  - `corpus_sem_embedding`, `baixa_confianca_rag`, `resposta_sem_citacoes` e `sem_cobertura_documental` passam a ficar explícitos como causas distintas
- Arquivos alterados:
  - `supabase/functions/chat/index.ts`
  - `supabase/functions/chat/telemetry-quality.ts`
  - `supabase/functions/get-usage-stats/index.ts`
  - `src/components/UsageStatsCard.tsx`

### Q2 — Primeiro corte real de custo por pergunta
- Novo helper: `supabase/functions/chat/generation-strategy.ts`
- Ajustes aplicados:
  - perguntas simples e diretas voltam a priorizar `gemini-3.1-flash-lite-preview`
  - `gemini-3.1-pro-preview` fica reservado para casos didáticos/complexos
  - quando o provedor já retorna indisponibilidade/quota, a CLARA deixa de insistir em novas tentativas Gemini de `grounded repair`
  - nesses casos, vai direto para o fallback determinístico grounded
- Resultado esperado:
  - menos consumo por pergunta
  - menos latência desperdiçada em cenário de `429`
  - menor pressão desnecessária sobre uma conta gratuita ou quase gratuita

## Cobertura adicionada
- `src/test/chat-telemetry-quality.test.ts`
- `src/test/chat-generation-strategy.test.ts`
- ajuste de compatibilidade em `src/test/Header.test.tsx` por causa da frente paralela que passou a usar `useChatActions`

## Validação local
- `npm test -- src/test/chat-generation-strategy.test.ts src/test/chat-telemetry-quality.test.ts src/test/UsageStatsCard.test.tsx src/test/Header.test.tsx`
- `npm run typecheck`
- `npm run validate`
- Resultado:
  - `31` suites
  - `127` testes
  - build `OK`
  - permaneceu apenas o warning já conhecido de `react-refresh/only-export-components` em `SmoothScrollProvider.tsx`

## Limites desta rodada
- Esta rodada foi validada localmente, mas ainda não foi isolada/publicada como pacote próprio.
- O workspace contém mudanças paralelas de frontend/layout em:
  - `src/components/Header.tsx`
  - `src/hooks/useChatStore.tsx`
  - `package.json`
  - `package-lock.json`
- Como essa frente não é do escopo RAG/backend, a publicação desta rodada deve evitar misturar, sem revisão, mudanças paralelas não autoradas por este pacote.

## Próxima ação recomendada
- seguir para `Q3`, simplificando o contrato de resposta e reduzindo o peso editorial/estrutural da CLARA na camada visível ao usuário
- em paralelo, preparar a publicação limpa de `Q1` + primeiro corte de `Q2` sem conflitar com a frente de layout
