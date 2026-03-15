

## Plano: Upgrade do System Prompt e Melhoria do RAG

### Problema atual

1. **System prompt generico** -- o prompt atual mistura formatacao visual com regras de escopo, sem hierarquia clara de fontes. Falta a politica explicita de "base interna > busca externa > conhecimento do modelo".

2. **Modo `kb_only` bypassa o Gemini** -- quando `useKnowledgeOnly` e `true`, o sistema retorna um texto cru montado em `buildKnowledgeOnlyResponse()` sem passar pelo modelo. Resultado: respostas sem formatacao, sem passo-a-passo, sem tom da CLARA.

3. **`maxOutputTokens: 2048` e baixo** -- respostas complexas com passo-a-passo e fontes sao cortadas.

4. **Frontend tenta `localKnowledge` antes do backend** -- `useChatStore.tsx` chama `answerQuestionWithLocalKnowledge()` e, se retornar algo, nunca chega ao RAG real. Isso curto-circuita o pipeline inteiro.

### O que muda

#### 1. Substituir o SYSTEM_PROMPT inteiro

Usar o prompt completo que voce definiu, com as seguintes secoes:
- IDENTIDADE E TOM (pedagogico, acolhedor, elegante)
- ESCOPO (SEI/SEI-Rio, instrucao processual, normas oficiais -- com fallback educado)
- POLITICA DE FONTES (base interna prioritaria, consolidacao entre documentos, tratamento de divergencias)
- BUSCA EXTERNA (excecao controlada, apenas fontes oficiais)
- CONHECIMENTO DO MODELO (complementar, nunca substitui base interna)
- ESTRUTURA DAS RESPOSTAS (Resposta Inicial > Passo a Passo > Observacoes > Fontes ao final)
- FORMATACAO E APRESENTACAO (escaneavel, titulos curtos, listas, destaques)
- FONTES INTERNAS e EXTERNAS (formato de citacao)
- CONDUTA SEM BASE SUFICIENTE
- PROIBICOES
- REGRAS DE SEGURANCA (manter as existentes)

**Arquivo:** `supabase/functions/chat/index.ts` -- constante `SYSTEM_PROMPT`

#### 2. Eliminar modo `kb_only` -- sempre passar pelo Gemini

Remover o branch que retorna `knowledgeOnlyResponse` diretamente. Todo contexto da base interna deve ser injetado no prompt e processado pelo Gemini para que a resposta tenha o tom, formatacao e estrutura da CLARA.

**Arquivos:**
- `supabase/functions/chat/knowledge.ts` -- remover `buildKnowledgeOnlyResponse`, `buildSummaryLines`, campos `useKnowledgeOnly`/`knowledgeOnlyResponse`
- `supabase/functions/chat/index.ts` -- remover o branch `kb_only` (linhas 340-374)

#### 3. Melhorar a injecao de contexto no prompt

Atualizar `buildKnowledgeContext()` para incluir instrucoes mais claras ao modelo:
- Indicar pagina quando disponivel no `sourceLabel`
- Instruir o Gemini a citar fontes ao final, nao no meio
- Instruir a consolidar informacoes de multiplos documentos

#### 4. Aumentar `maxOutputTokens` para 4096

Para comportar respostas estruturadas com passo-a-passo + observacoes + fontes.

**Arquivo:** `supabase/functions/chat/index.ts` -- config do `generateContentStream`

#### 5. Remover curto-circuito do `localKnowledge` no frontend

O `localKnowledge` intercepta perguntas antes de chegarem ao backend RAG. Remover essa camada para que todas as perguntas passem pelo pipeline completo.

**Arquivo:** `src/hooks/useChatStore.tsx` -- remover o bloco `answerQuestionWithLocalKnowledge`

#### 6. Aumentar `match_count` de 5 para 8

Mais chunks candidatos para o filtro RRF selecionar os melhores 4, melhorando recall.

**Arquivo:** `supabase/functions/chat/index.ts` -- parametro `match_count` no RPC

#### 7. Redeploy da Edge Function `chat`

Apos todas as alteracoes, deploy automatico.

### Arquivos afetados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/chat/index.ts` | System prompt novo, remover branch kb_only, maxOutputTokens 4096, match_count 8 |
| `supabase/functions/chat/knowledge.ts` | Simplificar: remover kb_only logic, melhorar buildKnowledgeContext |
| `src/hooks/useChatStore.tsx` | Remover localKnowledge bypass |

### Resultado esperado

- Todas as respostas passam pelo Gemini com o tom e estrutura da CLARA
- Base interna e sempre prioritaria mas formatada pelo modelo
- Fontes aparecem organizadas ao final
- Respostas nao sao cortadas
- Pipeline RAG nao e curto-circuitado pelo frontend

