# Relatório Operacional — Refino conceitual do modo Didático e higiene de referências

**Data:** 20/04/2026  
**Escopo:** melhoria da qualidade textual/cognitiva da resposta conceitual no backend RAG, com foco em fallback estruturado e limpeza de referências  
**Base:** código real em `main`, validação local completa e uma verificação remota controlada no endpoint `/functions/v1/chat`

## 1. Objetivo da rodada

Fechar o defeito residual da rodada anterior: perguntas conceituais em modo `didatico` ainda podiam voltar com:

- estrutura artificial de etapas;
- texto de fallback com aparência de bloco técnico;
- subtítulos de referência excessivos ou pouco úteis;
- observações finais contaminadas por instruções de interface que não ajudavam a explicar o conceito.

O objetivo desta rodada não foi redesign visual amplo do chat. O foco foi a **qualidade intrínseca da resposta gerada**.

## 2. Diagnóstico confirmado

O caso de prova usado com parcimônia foi:

> `O que e um bloco de assinatura no SEI.Rio e quando eu devo usar?`

Achados confirmados antes do ajuste final:

- a resposta já havia saído de `passo_a_passo`, mas ainda podia carregar texto bruto demais no resumo;
- o fallback extrativo ainda escapava do `sanitizeStructuredResponse`;
- o emergency playbook para `bloco de assinatura` estava amplo demais e capturava pergunta conceitual;
- o fallback conceitual ainda herdava observações procedimentais ou artefatos como `imagem acima`, `botão` e detalhes de coluna/ação.

## 3. Mudanças implementadas

### 3.1. Referências

- `supabase/functions/chat/editorial.ts`
- os subtítulos de referência passaram a exibir apenas o `sectionTitle` limpo;
- foram removidas composições como camada/autoridade no subtítulo visível ao usuário.

### 3.2. Perguntas conceituais

- `supabase/functions/chat/emergency-playbooks.ts`
- o playbook `q5-bloco-assinatura` foi restringido a padrões operacionais, deixando perguntas conceituais seguirem para a rota normal.

### 3.3. Fallback conceitual

- `supabase/functions/chat/index.ts`
- o fallback conceitual passou a:
  - priorizar sentenças narrativas em vez de detalhes procedimentais;
  - descartar detalhes que pareçam instrução de interface ou artefato visual;
  - ser sanitizado antes de telemetry/retorno, tal como já ocorria com a resposta estruturada principal;
  - retornar `modoResposta: "explicacao"` com `etapas: []` quando a pergunta é conceitual.

### 3.4. Contrato e cache

- `supabase/functions/chat/response-schema.ts`
- reforço do pós-processamento textual para respostas conceituais curtas;
- `supabase/functions/chat/response-cache.ts`
- `CHAT_RESPONSE_CACHE_CONTRACT_VERSION` incrementada para invalidar respostas antigas sob o contrato anterior.

## 4. Evidências objetivas

### 4.1. Validação local

- `npm run validate`: **passou**
- suites: `33`
- testes: `131`
- `npm run build`: **passou**

### 4.2. Verificação remota final

A prova remota final do caso conceitual retornou:

```json
{
  "modoResposta": "explicacao",
  "stepCount": 0,
  "summary": "O Bloco de Assinatura é um recurso utilizado para a visualização e assinatura de minutas de documentos por usuários de unidades diferentes da unidade elaboradora do documento. Também poderá ser utilizado com a finalidade de agrupar documentos produzidos na própria unidade, para assinatura em lote.",
  "observacoes": [],
  "referenceSubtitles": []
}
```

Leitura técnica:

- o `Didático` conceitual deixou de parecer checklist mecânico;
- a resposta voltou como explicação corrida, sem etapas artificiais;
- o resumo ficou limpo e semanticamente útil;
- as observações finais não carregaram ruído procedimental indevido;
- a higiene das referências visíveis ao usuário ficou consistente.

## 5. Limites remanescentes

Esta rodada fechou bem o caso conceitual testado, mas não esgota a frente inteira de excelência editorial.

Ainda faz sentido, numa próxima rodada:

- ampliar a bateria de perguntas conceituais reais;
- verificar se outros conceitos também estão saindo com a mesma maturidade;
- retomar o polimento visual/editorial da aba do chat, agora sobre um backend mais estável.

## 6. Veredito

O defeito residual mais visível da rodada anterior foi resolvido de forma satisfatória.

Neste ponto, o backend passa a sustentar melhor a próxima frente correta do produto:

> **polimento editorial/visual da aba do chat**, sem deixar a qualidade textual conceitual para trás.
