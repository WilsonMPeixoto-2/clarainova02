# Relatório Operacional — Melhoria de Qualidade da Resposta RAG

**Data:** 20/04/2026  
**Escopo:** qualidade textual, cognitiva e pedagógica das respostas da CLARA  
**Branch de trabalho:** `session/2026-04-19/HOME/CODEX/V1-AUDIT-CLOSURE`

---

## 1. Síntese executiva

Esta rodada atacou a qualidade intrínseca da resposta gerada, não o redesign amplo da interface. O foco foi reduzir respostas corretas porém magras, aproximar `direto` de uma consulta rápida completa e aproximar `didatico` de uma orientação mais explicativa, humana e operacionalmente segura.

O resultado foi **melhora real confirmada em código e em chamadas remotas controladas**, principalmente em:

- eliminação de truncamento visível no modo `direto`;
- aumento da densidade útil do `resumoInicial`;
- reforço do contrato pedagógico do modo `didatico`;
- melhor distinção entre recuperação lexical e semântica em follow-ups;
- melhor ordenação e empacotamento do contexto recuperado;
- criação de um quality gate textual/editorial antes da resposta final.

O estado atual é melhor do que o baseline desta manhã, mas **a excelência editorial ainda não está totalmente encerrada**. O principal limite remanescente é que perguntas conceituais em modo `didatico` ainda podem sair em formato estruturado por cenários de uso, em vez de uma explicação corrida mais natural. A resposta ficou melhor e menos artificial, mas ainda não atingiu o teto desejado.

---

## 2. Diagnóstico confirmado

### 2.1. Causas reais no backend

Leitura direta do código confirmou quatro causas principais para a qualidade inferior:

1. **Contextualização de follow-up contaminando a busca lexical**
   - a consulta contextualizada misturava rótulos e blocos artificiais;
   - isso era aceitável para embedding, mas ruim para busca por palavra-chave.

2. **Empacotamento de contexto pouco hierarquizado**
   - o contexto recuperado chegava como bloco único, com pouca sinalização de prioridade;
   - isso favorecia respostas corretas, porém secas ou pouco instrutivas.

3. **Contrato de geração comprimindo demais a saída**
   - o modo `direto` ainda estava cortando resumo e etapas em excesso;
   - o modo `didatico` tinha estrutura, mas não garantia densidade cognitiva suficiente.

4. **Ausência de gate editorial real**
   - havia guardrails de grounding, leakage e schema;
   - não havia mecanismo explícito para rejeitar respostas rasas, genéricas, truncadas ou mecanizadas.

### 2.2. Causa específica do caso conceitual

Na pergunta `O que é um bloco de assinatura no SEI.Rio e quando eu devo usar?`, a inferência de intenção classificava a consulta como `como_fazer` por causa de `usar`, em vez de priorizar o padrão conceitual `o que e`. Isso empurrava a geração para uma forma mais procedural do que o ideal.

---

## 3. Mudanças implementadas

### 3.1. Retrieval e packing

Arquivos principais:

- [conversation-context.ts](C:/Users/okidata/clarainova02/supabase/functions/chat/conversation-context.ts)
- [knowledge.ts](C:/Users/okidata/clarainova02/supabase/functions/chat/knowledge.ts)

Mudanças:

- separação entre `keywordQueryText` e `embeddingQueryText`;
- follow-up limpo para busca lexical e contextualização rica apenas para embedding;
- preservação de `selectedChunkIds` e `selectedDocumentIds` em ordem ranqueada;
- enriquecimento adjacente ancorado no chunk selecionado mais relevante, e não no menor `chunk_index`;
- contexto documental com marcação explícita de prioridade (`primaria`, `complementar`, `apoio`).

Resultado esperado:

- menos deriva lexical em perguntas de continuidade;
- melhor backbone factual para respostas procedurais;
- menos chance de o modelo responder com contexto certo porém mal organizado.

### 3.2. Contrato de geração

Arquivo principal:

- [index.ts](C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts)

Mudanças:

- reforço do prompt do modo `direto` como resposta rápida, curta, mas completa;
- reforço do prompt do modo `didatico` como orientação dialogal, acolhedora, pedagógica e com pensamento mais desenvolvido;
- exigência explícita de explicar `o que conferir`, `por que importa` e `onde costuma haver erro`;
- reforço do fechamento com observações finais úteis, não cosméticas;
- ajuste da inferência de intenção para priorizar consultas conceituais (`o que e`, `o que significa`, `para que serve`).

Resultado esperado:

- `direto` mais parecido com consulta rápida confiável;
- `didatico` menos checklist automático e mais orientação humana;
- menor confusão entre dúvida conceitual e pedido procedural.

### 3.3. Schema e adaptação de resposta

Arquivos principais:

- [response-schema.ts](C:/Users/okidata/clarainova02/supabase/functions/chat/response-schema.ts)
- [clara-response.ts](C:/Users/okidata/clarainova02/src/lib/clara-response.ts)

Mudanças:

- frontend passou a aceitar `modoResposta: "insuficiente"`;
- relaxamento dos cortes de resumo, etapas e observações no modo `direto`;
- preservação de mais itens/destaques/observações no modo `didatico`;
- adaptação conceitual no sanitizador para permitir tratamento mais explicativo quando a forma procedimental for artificial.

Resultado esperado:

- menos truncamento;
- melhor densidade editorial sem inflar texto desnecessariamente;
- menor drift entre frontend e backend.

### 3.4. Quality gate editorial

Arquivo principal:

- [response-quality.ts](C:/Users/okidata/clarainova02/supabase/functions/chat/response-quality.ts)

Foi criado um gate específico para detectar:

- resumo curto demais;
- didático com pouco contexto;
- etapas rasas;
- ausência de conferência final;
- cópia truncada;
- texto genérico/editorializado artificialmente;
- resposta conceitual excessivamente fragmentada ou artificialmente procedural.

Quando esse gate falha, a Edge Function dispara uma **reescrita editorial obrigatória** preservando a mesma base factual.

Resultado esperado:

- menos respostas mecanizadas;
- menos saídas visivelmente cortadas;
- melhor padrão mínimo de substância antes da entrega.

### 3.5. Cache e observabilidade

Arquivo principal:

- [response-cache.ts](C:/Users/okidata/clarainova02/supabase/functions/chat/response-cache.ts)

Mudança:

- versionamento do contrato do `chat_response_cache` avançado para `2026-04-20-r4-editorial-quality-v3`.

Resultado esperado:

- invalidação correta de respostas geradas sob contrato antigo;
- benchmark comparável sem falso positivo de melhoria por cache antigo.

---

## 4. Evidências de melhora

### 4.1. Baseline comparativo controlado

Artefatos gerados:

- [baseline-before](C:/Users/okidata/clarainova02/docs/operational-reports/data/2026-04-20-response-quality-baseline-before.json)
- [baseline-after](C:/Users/okidata/clarainova02/docs/operational-reports/data/2026-04-20-response-quality-baseline-after.json)
- [comparison](C:/Users/okidata/clarainova02/docs/operational-reports/data/2026-04-20-response-quality-comparison.json)
- [compare_response_quality.py](C:/Users/okidata/clarainova02/scripts/corpus/compare_response_quality.py)

Perguntas usadas no benchmark inicial:

1. `Como incluir um documento externo em um processo no SEI.Rio?` (`didatico`)
2. `O que é um bloco de assinatura no SEI.Rio e quando eu devo usar?` (`didatico`)
3. `Como enviar um processo para outra unidade no SEI.Rio?` (`direto`)

Mudanças medidas:

- `truncatedSteps`: **1 -> 0**
- `direto.conciseButComplete`: **0 -> 1**
- `avgSummaryChars`: **285.67 -> 340.67**
- `avgSummarySentences`: **2.00 -> 2.33**

Interpretação:

- o ganho mais claro desta rodada ocorreu no modo `direto`;
- o sistema deixou de devolver etapa visivelmente truncada;
- o resumo inicial ficou mais completo sem perder concisão.

### 4.2. Verificação remota focada no caso conceitual

Artefato final:

- [conceptual-r5](C:/Users/okidata/clarainova02/docs/operational-reports/data/2026-04-20-response-quality-conceptual-r5.json)

Resultado observado:

- o caso conceitual deixou de sair como `1 etapa densa artificial`;
- passou a separar dois cenários reais de uso:
  - assinatura em outras unidades;
  - assinatura na própria unidade;
- o texto ficou mais útil do ponto de vista operacional e menos genérico.

Leitura honesta:

- houve melhora real de substância e organização;
- porém o modo `didatico` conceitual ainda tende a responder em blocos estruturados de uso, não em explicação corrida plenamente dialogal.

---

## 5. Testes executados

Validações locais:

- `npm run validate` -> **ok**
- `npm run typecheck` -> **ok**
- `vitest` -> **32 suites / 129 testes ok**
- `vite build` -> **ok**

Deploys desta rodada:

- Supabase Edge Function `chat` redeployada no projeto `jasqctuzeznwdtbcuixn`

Uso de API nesta rodada:

- benchmark inicial controlado já existente: 3 perguntas
- verificações adicionais pontuais do caso conceitual: 3 chamadas

Total mantido deliberadamente baixo para evitar custo desnecessário.

---

## 6. Limites remanescentes

### 6.1. Didático conceitual ainda não está no teto editorial

Mesmo após a melhoria, o sistema ainda pode preferir resposta estruturada por cenários de uso em vez de uma explicação mais fluida e conversacional.

### 6.2. Higiene de referências ainda pode melhorar

Os títulos/subtítulos de algumas referências continuam saindo com ruído editorial e granularidade irregular. Isso não quebra o grounding, mas prejudica acabamento.

### 6.3. Retrieval ainda pode ser refinado para contexto instrutivo

O packing ficou melhor, mas ainda há espaço para priorizar trechos mais pedagógicos e menos fragmentados em perguntas de natureza conceitual-operacional híbrida.

---

## 7. Veredito desta rodada

Esta rodada **melhorou de forma concreta a qualidade da resposta gerada**, principalmente no modo `direto` e no tratamento editorial mínimo antes da entrega.

O projeto agora está em um ponto melhor do que o baseline em:

- completude do `direto`;
- densidade do resumo;
- distinção de contrato entre modos;
- qualidade mínima forçada por gate editorial;
- robustez do packing de contexto.

Ainda assim, o bloco de **excelência da resposta** **não está encerrado**. A formulação mais precisa neste momento é:

> **a CLARA responde melhor do que antes e já saiu do patamar de resposta correta porém magra, mas o modo didático conceitual ainda precisa de uma rodada adicional para alcançar o nível editorial ideal do produto.**

---

## 8. Próximo passo recomendado

Abrir um bloco curto e específico de **didático conceitual + acabamento de referências**, com foco em:

1. reduzir a tendência de converter conceito em pseudo passo a passo;
2. melhorar a forma final de `explicacao` em perguntas híbridas (`o que e` + `quando usar`);
3. limpar subtítulos e granularidade das referências finais mais visíveis ao usuário.
