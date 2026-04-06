# 2026-04-06 — Quality-First Reset: análise, custo e simplificação

## Motivo
- A análise cruzada de código local, Supabase remoto e produção mostrou que a CLARA acumulou camadas demais de medição, classificação, reparo, scoring e renderização.
- O resultado foi um sistema que serve excessivamente a si mesmo: mais voltado a provar, medir e registrar do que a entregar a melhor resposta possível.
- Em paralelo, a operação recente evidenciou um custo por pergunta incompatível com cenário `free tier ou muito próximo disso` no Gemini/Google AI.

## Evidências principais

### 1. O sistema serve demais a si mesmo
- O fluxo quente do chat em [supabase/functions/chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts) pode acionar, para uma única pergunta, expansão, embedding, busca híbrida/governada, geração estruturada, fallback de stream, grounded repair, grounded text repair e três escritas analíticas diferentes.
- A resposta estruturada exige campos demais em [supabase/functions/chat/response-schema.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/response-schema.ts), incluindo `analiseDaResposta`, `processStates`, `termosDestacados` e outras camadas que não aumentam diretamente a utilidade da resposta para o usuário final.
- O frontend reforça esse peso em [src/components/chat/ChatStructuredMessage.tsx](/C:/Users/okidata/clarainova02/src/components/chat/ChatStructuredMessage.tsx) com `Guia didático`, `Veredito inicial`, badges de confiança, estados de processo e nuvem de destaques.

### 2. O custo por pergunta está inflado
- Nas últimas 24h, o Supabase registrou `848` requests em `chat_metrics`, com `848` linhas correspondentes em `search_metrics`.
- As perguntas canônicas apareceram `49-52` vezes cada, mostrando que a maior parte do tráfego não foi “uso humano casual”, e sim benchmark automatizado/repetido.
- O fan-out por pergunta continua alto: query expansion, embedding da pergunta, tentativa de geração principal, fallback de modelo e, em cenários degradados, grounded repairs adicionais.

### 3. A operação do corpus também pesa e compete com o chat
- Em `document_processing_events`, houve `42` pedidos de embedding em 24h, `68` chamadas reais à API de embedding e `292` embeddings falhos.
- O corpus ativo remoto ficou com `17` documentos ativos, `289` chunks ativos e `0` embeddings ativos válidos.
- A UI/admin em [src/pages/Admin.tsx](/C:/Users/okidata/clarainova02/src/pages/Admin.tsx) ainda permite que documento entre ativo e depois permaneça em `embedding_pending`, o que é incompatível com uma base semanticamente saudável.

### 4. Há estruturas existentes que hoje agregam pouco valor real
- `search_metrics` duplica em larga medida o que já é observado em `chat_metrics`.
- `query_analytics` ainda se autoalimenta de suposições internas do sistema; o usuário real continua sendo a melhor fonte de verdade.
- `ingestion_jobs` existe no schema, mas o remoto está com `0` linhas.
- `embedding_cache` já existe no schema, mas o remoto está com `0` linhas e `0` hits.

## Hipótese operacional adotada
- Até confirmação contrária no painel do Google, a CLARA passa a assumir como base um cenário `free tier ou muito próximo disso`.
- Consequências práticas:
  - `Pro` é recurso escasso e não pode ser tocado indiscriminadamente.
  - Benchmark pesado não pode competir com produção.
  - Chat ao vivo e re-embedding não devem concorrer pelo mesmo orçamento.
  - O produto precisa responder bem mesmo em modo degradado.

## Filosofia corrigida
- A razão de existir da CLARA é uma só: produzir respostas da mais alta qualidade possível, úteis para ensinar e ajudar pessoas reais em problemas reais.
- Toda peça que não aumentar a utilidade real da resposta deve ser:
  - removida
  - reduzida
  - movida para bastidor

## Trilha nova aprovada

### Q0 — Baseline factual do reset
- congelar o estado atual do custo, fan-out, benchmark, corpus ativo e respostas ruins/boas de referência

### Q1 — Truth telemetry
- eliminar autoavaliação enganosa
- distinguir claramente `Gemini`, `grounded_fallback` e `provider_unavailable`
- rebaixar confiança quando não houver retrieval semântico real

### Q2 — Redução de custo por pergunta
- cortar chamadas opcionais do caminho quente
- separar benchmark e produção
- parar concorrência entre chat ao vivo e tarefas de corpus

### Q3 — Simplificação do contrato de resposta
- manter resposta, passos, observações e referências
- reduzir `analiseDaResposta`, `processStates`, `termosDestacados`, badges e molduras excessivas

### Q4 — Fortalecimento do fallback
- responder melhor em cenário degradado
- ampliar playbooks críticos: `assinar documento interno`, `despacho x ofício`, `notificações/prazos`

### Q5 — Correção do pipeline do corpus
- documento não entra ativo sem embedding válido
- `embedding_pending` deixa de equivaler a base pronta
- ingestão deixa de competir com a experiência principal

### Q6 — Restauração controlada do cérebro Gemini
- assim que houver dados suficientes da conta Google, reprocessar embeddings e restaurar a operação semântica de forma controlada

## Próximo passo operacional
- Registrar o reset na continuidade oficial.
- Executar `Q0` e `Q1` antes de qualquer nova rodada de refinamento estético, BLOCO 6 ou novo experimento de arquitetura.
