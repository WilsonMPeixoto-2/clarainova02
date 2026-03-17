

## Plano: Eliminar diagnostico interno das respostas e garantir qualidade

### Problema real (3 camadas)

**Camada 1 — O modelo esta narrando seu raciocinio interno ao usuario.**
O `SYSTEM_PROMPT` manda preencher `processStates`, `userNotice`, `cautionNotice`, `comparedSources`, `prioritizedSources`. O `enrichStructuredResponse()` injeta esses campos mesmo quando o modelo nao envia. O frontend renderiza tudo: "O que a CLARA fez para chegar aqui", "Leitura de confianca", "Fontes comparadas/priorizadas".

**Camada 2 — O historico de conversa esta contaminado.**
`renderStructuredResponseToPlainText()` inclui blocos "Como cheguei a esta resposta", "Fontes comparadas", "Leitura de confianca". Isso volta como contexto na proxima pergunta. O modelo ve esse texto e replica o padrao.

**Camada 3 — O schema JSON forca campos desnecessarios.**
O `claraResponseJsonSchema` exige `processStates`, `comparedSources`, `prioritizedSources` como required. O modelo gasta tokens preenchendo isso ao inves de focar no conteudo.

### Correcoes (5 arquivos)

#### 1. `supabase/functions/chat/index.ts`

- **Remover `enrichStructuredResponse()`** e `buildFallbackProcessStates()` inteiramente. O backend nao deve injetar diagnosticos.
- **Limpar o SYSTEM_PROMPT**: remover as instrucoes sobre `processStates`, `userNotice`, `comparedSources`, `prioritizedSources`. Manter apenas: "Preencha `analiseDaResposta` com `clarificationRequested` e `clarificationQuestion` quando precisar de esclarecimento."
- Na linha 673, parar de chamar `enrichStructuredResponse()` — usar `structuredResult.response` diretamente.

#### 2. `supabase/functions/chat/response-schema.ts`

- **Remover do `claraResponseJsonSchema`**: `processStates`, `comparedSources`, `prioritizedSources`, `userNotice`, `cautionNotice`, `ambiguityReason`, `questionUnderstandingConfidence`, `finalConfidence`, `webFallbackUsed`, `internalExpansionPerformed`, `ambiguityInSources`, `ambiguityInUserQuestion`. Manter apenas: `answerScopeMatch`, `clarificationRequested`, `clarificationQuestion`, `clarificationReason`.
- **Limpar `renderStructuredResponseToPlainText()`**: remover blocos "Como cheguei a esta resposta", "Fontes comparadas", "Fontes priorizadas", "Leitura de confianca", "Contexto: userNotice". Manter apenas: titulo, resumo, passos, observacoes finais, referencias.
- Manter os schemas Zod com defaults para nao quebrar parsing, mas o JSON schema enviado ao modelo fica enxuto.

#### 3. `src/components/chat/ChatStructuredMessage.tsx`

- **Remover renderizacao de**: `userNotice` (NoticeCard "Como eu conduzi"), `processStates` (card "O que a CLARA fez para chegar aqui"), `showDecisionSummary` (card "Leitura de confianca"), `comparedSources`/`prioritizedSources` (card "Fontes comparadas e priorizadas"), `cautionNotice` (NoticeCard "Ponto de atencao").
- **Manter apenas**: titulo, resumo, pedido de esclarecimento (clarification), highlights, etapas (passo a passo), observacoes finais, referencias.

#### 4. `src/lib/clara-response.ts`

- Alinhar `renderStructuredResponseToPlainText` do frontend com a versao limpa do backend (mesma logica: so titulo + resumo + passos + observacoes + referencias).

#### 5. `src/hooks/useChatStore.tsx`

- Sem mudancas estruturais, mas o `plainText` salvo no historico agora sera limpo automaticamente porque `renderStructuredResponseToPlainText` nao incluira mais diagnosticos.

### Resultado

- O usuario ve apenas: **Titulo → Resumo → Passo a passo → Observacoes → Fontes**
- Zero "O que a CLARA fez para chegar aqui"
- Zero "Leitura de confianca"  
- Zero "Fontes comparadas/priorizadas"
- O historico de conversa nao contamina o proximo turno
- O modelo gasta tokens no conteudo real, nao em diagnosticos
- Os dados de diagnostico continuam sendo salvos nas tabelas de metricas (chat_metrics, search_metrics) para analise interna — so nao aparecem para o usuario

