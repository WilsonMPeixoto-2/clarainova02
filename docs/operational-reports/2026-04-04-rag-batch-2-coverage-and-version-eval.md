# Relatório operacional - cobertura PEN, apoio versionado e avaliação do RAG

Data: 2026-04-04  
Frente: Corpus governado / avaliação empírica do RAG em produção

## Objetivo

Executar a segunda rodada prática da política de curadoria do corpus da CLARA:

- concluir a coleta e a ingestão dos documentos oficiais de `cobertura` e `apoio`
- corrigir a recuperação híbrida para considerar melhor `título`, `origem institucional`, `versão` e `section_title`
- rodar uma bateria ampliada de perguntas reais, com foco em conflitos de versão e fonte-alvo
- registrar o que já está sólido e o que ainda exige governança mais fina

## Escopo desta rodada

### Documentos de cobertura PEN ingeridos

- `COBERTURA_P2_manual_usuario_pen_sei_4_0_plus.pdf`
- `COBERTURA_P2_modulos_pen_documentacao_oficial.pdf`
- `COBERTURA_P2_nota_compatibilidade_pen_sei_4_1_5_2025.pdf`
- `COBERTURA_P2_nota_compatibilidade_tramita_sei_4_x_e_5_x_2025.pdf`
- `COBERTURA_P2_nota_oficial_sei_5_0_2025.pdf`
- `COBERTURA_P2_nota_oficial_sei_5_0_3_2025.pdf`

### Documentos de apoio versionado ingeridos

- `APOIO_P3_novidades_interface_wiki_sei_rj_4_1.pdf`
- `APOIO_P3_correspondencia_icones_ufscar_sei_4_0.pdf`

### Correções operacionais aplicadas

- o manifesto `docs/corpus_manifest.csv` foi atualizado com hash, URL oficial e status de ingestão dos novos arquivos
- `scripts/corpus/ingest_manifest_batch.py` passou a derivar metadados editoriais explícitos para:
  - `pen_manual_compativel`
  - `pen_compatibilidade`
  - `pen_release_note`
  - `interface_update`
- os pesos editoriais dos documentos de `cobertura` e `apoio` foram calibrados para permanecerem abaixo do núcleo local do SEI.Rio

## Ajustes de recuperação e ranking

### 1. Migration remota de `hybrid_search_chunks`

Foi criada e aplicada remotamente a migration:

- `supabase/migrations/20260404084500_refine_hybrid_search_for_governed_corpus.sql`

Conteúdo relevante da migration:

- a busca keyword passa a considerar também:
  - `documents.name`
  - `documents.source_name`
  - `documents.version_label`
  - `document_chunks.section_title`
- o ranking keyword agora combina:
  - relevância do conteúdo do chunk
  - relevância de metadados de título/origem/versão
- a função remota foi alinhada aos novos `topic_scope` do corpus governado:
  - `pen_manual_compativel`
  - `pen_compatibilidade`
  - `pen_release_note`
  - `interface_update`

Como a CLI nova oferece `supabase db query --linked`, a migration foi aplicada remotamente sem `db push`, e o histórico de `supabase_migrations.schema_migrations` foi sincronizado manualmente com a versão `20260404084500`.

### 2. Reranking do chat para intenção de fonte/versão

`supabase/functions/chat/knowledge.ts` recebeu duas melhorias adicionais:

- bônus de intenção para perguntas explicitamente sobre:
  - `nota oficial`
  - `wiki`
  - `UFSCar`
  - `interface`
  - `versão`
- guarda de versão para evitar que `SEI 5.0` seja tratado como equivalente a `SEI 5.0.3`

Resultado prático:

- o chat continua priorizando o núcleo local em perguntas operacionais do SEI.Rio
- mas passa a abrir melhor espaço para documentos de cobertura e apoio quando a pergunta nomeia explicitamente a fonte ou a faixa de versão

### 3. Avaliador em lote endurecido

Foi criado e refinado:

- `scripts/corpus/evaluate_rag_batch.py`

O avaliador agora registra:

- `title`
- `summary`
- `finalConfidence`
- `answerScopeMatch`
- `webFallbackUsed`
- `referenceLabels`
- `expectedReferenceHits`
- `expectedAllMet`

Também foi adicionado:

- `docs/operational-reports/data/2026-04-04-rag-batch-2-questions.json`

## Bateria de avaliação

Arquivos de evidência:

- `docs/operational-reports/data/2026-04-04-rag-batch-2-eval.json`
- `docs/operational-reports/data/2026-04-04-rag-batch-2-eval-post-migration.json`
- `docs/operational-reports/data/2026-04-04-rag-batch-2-eval-post-intent.json`
- `docs/operational-reports/data/2026-04-04-rag-batch-2-eval-post-version-guard.json`

### Rodada base, antes da migration remota

Resultado:

- `16/16` respostas com `HTTP 200`
- `16/16` sem `webFallbackUsed`
- `13/16` com `answerScopeMatch = exact`
- `1/16` com `answerScopeMatch = probable`
- `2/16` com `answerScopeMatch = insufficient`

Principais falhas:

- a nota oficial `SEI 5.0` não aparecia
- a wiki `SEI-RJ 4.1` não dominava o grounding
- o material da `UFSCar` não era trazido quando pedido explicitamente

### Rodada após a migration remota

Resultado:

- `16/16` respostas com `HTTP 200`
- `16/16` sem `webFallbackUsed`
- `14/16` com `answerScopeMatch = exact`
- `1/16` com `answerScopeMatch = probable`
- `1/16` com `answerScopeMatch = insufficient`

Ganho principal:

- o caso da `UFSCar` passou a ser tratado com mais cautela e a cobertura PEN começou a aparecer nas referências

### Rodada após bônus de intenção e guarda de versão

Resultado final desta rodada:

- `16/16` respostas com `HTTP 200`
- `16/16` sem `webFallbackUsed`
- `15/16` com `answerScopeMatch = exact`
- `1/16` com `answerScopeMatch = probable`
- `0/16` com `answerScopeMatch = insufficient`
- `13/16` com `expectedAllMet = true`

Leitura correta desse resultado:

- o sistema já responde bem em escopo e cautela
- mas ainda não cita a `fonte-alvo dominante` em todos os casos de versão/interface

## Casos relevantes

### Casos fortes

- `Q1` sobre o Decreto `55.615/2025` agora funciona corretamente e usa o texto recuperado
- `Q11` sobre redefinição de senha do usuário externo já incorpora também a `FAQ do cidadão`
- `Q16` sobre `SEI 5.0.3` e módulos do PEN cita corretamente:
  - a nota oficial do `MGI`
  - o painel de compatibilidade

### Casos ainda frágeis

#### `Q13` — “Segundo a nota oficial do SEI 5.0...”

O sistema ainda responde com base dominante na nota `5.0.3`, não na nota `5.0`.

Situação:

- a resposta é útil e coerente
- o `answerScopeMatch` do modelo veio como `exact`
- porém `expectedAllMet = false`, porque a referência-alvo `Nota oficial MGI sobre o SEI 5.0` não apareceu

Conclusão:

- o sistema já entende o eixo temático “versão do SEI”
- mas ainda não distingue com precisão máxima `5.0` versus `5.0.3` na seleção final das fontes

#### `Q14` — “... segundo a wiki SEI-RJ?”

Situação:

- a resposta ficou boa em substância
- o `answerScopeMatch` veio `exact`
- porém `expectedAllMet = false`
- a wiki `SEI-RJ 4.1` ainda não aparece como referência dominante

Conclusão:

- a camada `interface_update` já influencia a resposta
- mas ainda não governa a referência final quando a pergunta pede explicitamente a wiki

#### `Q15` — “... segundo o material da UFSCar?”

Situação:

- a resposta ficou `probable`
- `expectedAllMet = false`
- o sistema continua preferindo `Manual do Usuário SEI 4.0+` e cobertura operacional genérica em vez de citar o material da `UFSCar`

Conclusão:

- o caso mais fraco desta rodada continua sendo a ancoragem explícita em uma fonte complementar nomeada

## Avaliação do estado atual do RAG

### O que já está forte

- núcleo local do SEI.Rio responde com boa estabilidade
- camada `cobertura` já entra sem contaminar o grounding principal
- documentos de compatibilidade `5.0.3` e painel do PEN já ajudam em respostas de governança de versão
- o sistema não precisou de fallback web em nenhum dos `16` casos desta rodada

### O que ainda não está resolvido

- recuperação por `fonte-alvo nomeada` ainda é incompleta para materiais de apoio/versionamento
- perguntas que pedem explicitamente:
  - uma `nota oficial` específica
  - uma `wiki` específica
  - um material de outra instituição
  ainda podem ser respondidas com base semântica correta, mas sem citar a fonte esperada

### Interpretação editorial

Isso não invalida a estratégia de corpus; ao contrário, confirma que a camada editorial está funcionando:

- o núcleo local continua vencendo quando a pergunta é operacional
- a cobertura PEN já entra para perguntas de compatibilidade e releases
- o apoio versionado ainda precisa de um mecanismo adicional de roteamento explícito por fonte nomeada

## Próximas ações recomendadas

1. introduzir um roteamento leve por `source-targeted query` para perguntas do tipo:
   - “segundo a wiki...”
   - “segundo a nota oficial...”
   - “segundo o material da UFSCar...”
2. manter `cobertura` e `apoio` com precedência inferior ao núcleo local em perguntas operacionais genéricas
3. iniciar a próxima bateria manual com foco em:
   - ambiguidade por versão
   - interface visual
   - fontes complementares explicitamente nomeadas

## Conclusão

Esta rodada foi bem-sucedida.

A CLARA agora opera com:

- núcleo local do SEI.Rio
- cobertura oficial compatível do ecossistema PEN
- apoio complementar versionado
- manifesto editorial governando a entrada dos documentos
- recuperação híbrida refinada por `título`, `origem`, `versão` e `section_title`
- avaliação em lote com métricas reprodutíveis

O veredito técnico mais honesto é:

- para perguntas operacionais e normativas do SEI.Rio, o sistema já está forte
- para perguntas explícitas sobre versões/fontes externas nomeadas, o sistema melhorou bastante, mas ainda não está impecável na escolha da referência dominante
