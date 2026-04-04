# 2026-04-04 — Auditoria do sistema RAG e redefinição do plano

## Objetivo

Refazer a leitura do sistema RAG ponta a ponta, cobrindo:

- ingestão e modelagem dos chunks
- retrieval e reranking no backend
- geração estruturada e diferenciação entre `Direto` e `Didático`
- transporte do payload até o frontend
- apresentação de confiança, referências e sinais de qualidade ao usuário

O objetivo desta auditoria não é abrir mais uma frente solta, mas redefinir o BLOCO 5 como uma trilha específica de excelência do RAG e do sistema de perguntas e respostas.

## Arquivos auditados

### Backend / retrieval / geração

- [chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts)
- [chat/knowledge.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/knowledge.ts)
- [chat/response-schema.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/response-schema.ts)
- [20260404084500_refine_hybrid_search_for_governed_corpus.sql](/C:/Users/okidata/clarainova02/supabase/migrations/20260404084500_refine_hybrid_search_for_governed_corpus.sql)
- [20260404134500_add_targeted_chunk_retrieval.sql](/C:/Users/okidata/clarainova02/supabase/migrations/20260404134500_add_targeted_chunk_retrieval.sql)

### Ingestão / corpus

- [admin-ingestion.ts](/C:/Users/okidata/clarainova02/src/lib/admin-ingestion.ts)
- [corpus-curation-policy.md](/C:/Users/okidata/clarainova02/docs/corpus-curation-policy.md)
- [corpus_manifest.csv](/C:/Users/okidata/clarainova02/docs/corpus_manifest.csv)

### Frontend / UX da resposta

- [chat-api.ts](/C:/Users/okidata/clarainova02/src/lib/chat-api.ts)
- [chat-response-mode.ts](/C:/Users/okidata/clarainova02/src/lib/chat-response-mode.ts)
- [clara-response.ts](/C:/Users/okidata/clarainova02/src/lib/clara-response.ts)
- [useChatStore.tsx](/C:/Users/okidata/clarainova02/src/hooks/useChatStore.tsx)
- [ChatStructuredMessage.tsx](/C:/Users/okidata/clarainova02/src/components/chat/ChatStructuredMessage.tsx)
- [ChatSheet.tsx](/C:/Users/okidata/clarainova02/src/components/ChatSheet.tsx)
- [evaluate_rag_batch.py](/C:/Users/okidata/clarainova02/scripts/corpus/evaluate_rag_batch.py)

## Diagnóstico do estado atual

## 1. O RAG já está funcional em nível profissional

O backend atual já combina vários mecanismos maduros:

- query expansion por LLM em [chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts:58)
- média entre embedding original e expandida em [chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts:1030)
- busca híbrida com `match_count = 12` em [chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts:1084)
- source-target routing com recuperação targeted em dois estágios em [chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts:1099)
- enriquecimento por chunks adjacentes em [chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts:1152)
- prompt sensível à qualidade da recuperação em [knowledge.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/knowledge.ts:513)
- schema estruturado com autoavaliação em [response-schema.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/response-schema.ts)

Isso confirma que a CLARA já saiu do estágio “RAG básico” e hoje opera como um sistema com retrieval governado, composição estruturada e sinais de confiança.

## 2. O corpus está governado, mas o retrieval ainda não usa toda a riqueza dos metadados

A política editorial já foi bem definida em [corpus-curation-policy.md](/C:/Users/okidata/clarainova02/docs/corpus-curation-policy.md) e o manifesto já carrega campos como:

- `camada`
- `prioridade`
- `escopo_usuario`
- `scope_instance`
- `module_tags`
- `hash_sha256`

Mas o retrieval efetivamente usa hoje, com mais força:

- `topic_scope`
- `authority_level`
- `document_kind`
- `search_weight`
- `source_name`
- `version_label`
- `section_title`

O ponto crítico aqui é que a governança editorial está mais rica do que a política operacional de recuperação. A curadoria já sabe distinguir instância, perfil e módulos, mas o ranking ainda não explora isso como primeira classe.

## 3. O source-target routing resolveu uma lacuna importante, mas virou o próximo hotspot de precisão

O desenho atual é tecnicamente bom:

- detecção por regex em [knowledge.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/knowledge.ts:268)
- boost de `+15` e reserva de `2` slots em [knowledge.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/knowledge.ts:348) e [knowledge.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/knowledge.ts:622)
- targeted retrieval sem multiplicador de `search_weight` em [20260404134500_add_targeted_chunk_retrieval.sql](/C:/Users/okidata/clarainova02/supabase/migrations/20260404134500_add_targeted_chunk_retrieval.sql)

Isso resolveu o problema de perguntas do tipo:

- “segundo a nota oficial...”
- “segundo a wiki...”
- “segundo a UFSCar...”
- “conforme o manual do PEN...”

Mas também cria o novo risco operacional: quando a fonte-alvo é semanticamente fraca, o sistema pode privilegiá-la demais. O foco deixou de ser “falta de roteamento” e passou a ser “roteamento com overboost controlado”.

## 4. A diferença entre `Direto` e `Didático` melhorou, mas ainda depende demais de pós-processamento

Hoje existe uma base boa:

- instruções específicas de modo em [chat/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts:118)
- apresentação de modo no frontend em [chat-response-mode.ts](/C:/Users/okidata/clarainova02/src/lib/chat-response-mode.ts:11)
- adaptação do payload por modo em [clara-response.ts](/C:/Users/okidata/clarainova02/src/lib/clara-response.ts:160)
- renderização distinta em [ChatStructuredMessage.tsx](/C:/Users/okidata/clarainova02/src/components/chat/ChatStructuredMessage.tsx:79)

Mas ainda há uma limitação estrutural: o sistema usa um único pipeline de geração e depois “puxa” o resultado para um formato mais direto ou mais didático. Isso funciona, mas não é o estágio final de excelência. Para chegar no nível premium, o modo precisa influenciar:

- a intenção de retrieval
- a montagem da resposta
- a densidade de referências
- a hierarquia visual no frontend

de forma mais nativa e menos corretiva.

## 5. O frontend já transmite confiança, mas ainda pode explicar melhor “por que” a resposta merece confiança

O frontend hoje já entrega:

- badge de confiança em [ChatStructuredMessage.tsx](/C:/Users/okidata/clarainova02/src/components/chat/ChatStructuredMessage.tsx:112)
- trilha de estados da resposta em [ChatStructuredMessage.tsx](/C:/Users/okidata/clarainova02/src/components/chat/ChatStructuredMessage.tsx:350)
- citações clicáveis
- referências finais expansíveis
- cópia e exportação

Isso é bom e já passa sensação de sistema sério.

O gap que resta é outro: o usuário ainda vê a fonte final, mas não vê com clareza suficiente:

- qual camada da fonte venceu (`NUCLEO`, `COBERTURA`, `APOIO`)
- se a resposta foi governada por conflito de versão
- se houve preferência por fonte explicitamente nomeada
- quando uma resposta ficou boa apesar de base documental parcial

Em outras palavras: a CLARA já mostra confiança; agora precisa mostrar melhor a lógica da confiança.

## 6. A avaliação existe, mas ainda não virou gate canônico de release do RAG

Há um progresso importante:

- batch evaluator em [evaluate_rag_batch.py](/C:/Users/okidata/clarainova02/scripts/corpus/evaluate_rag_batch.py)
- telemetria com `rag_quality_score`
- bateria manual e em lote já usada várias vezes

Mas ainda falta transformar isso em disciplina canônica:

- conjunto benchmark estável por tema
- rubrica explícita por tipo de pergunta
- comparação por modo (`Direto` vs `Didático`)
- teste específico para conflito entre fontes
- gate de regressão antes de mexer em retrieval/prompt/scoring

## Pontos fortes confirmados no código

### Retrieval

- O ranking híbrido está bem ancorado por semântica, lexical overlap, versionamento e peso editorial em [knowledge.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/knowledge.ts:402).
- O SQL de [hybrid_search_chunks](/C:/Users/okidata/clarainova02/supabase/migrations/20260404084500_refine_hybrid_search_for_governed_corpus.sql) já considera título, fonte, versão e seção.
- O source-target routing é uma boa resposta ao problema de perguntas “segundo a fonte X”.

### Geração

- O prompt já contém um bloco explícito de qualidade de recuperação.
- O schema já força o modelo a raciocinar sobre confiança, ambiguidade e notices.
- O fallback grounded reduz risco de pane silenciosa quando a geração falha.

### UX

- O usuário já recebe resposta com estrutura, confiança, referências e copy/export.
- O chat já transmite identidade institucional e senso de ferramenta de trabalho.

## Gargalos reais agora

1. **Metadados editoriais subutilizados no retrieval**
- `scope_instance`, `module_tags` e `escopo_usuario` ainda não governam o ranking como deveriam.

2. **Overboost potencial do source-target routing**
- a fonte nomeada pode ganhar peso demais quando a aderência semântica for fraca.

3. **Separação ainda incompleta entre `Direto` e `Didático`**
- a diferença melhorou, mas ainda não virou contrato de resposta plenamente distinto.

4. **Ausência de gate canônico de regressão do RAG**
- ainda não existe uma trilha formal de “não sobe se cair X, Y, Z”.

5. **Transparência editorial ainda parcial no frontend**
- a resposta mostra fontes, mas ainda não explicita suficientemente camada, precedência e conflito.

6. **Chunk prefix reintroduzido sem avaliação comparativa formal**
- a volta do prefixo `[Fonte: ... | Página: ...]` em `chunk.content` é funcional, mas merece benchmark explícito contra alternativa 100% metadata-driven.

## Decisão de planejamento

Nao faz sentido replanejar o projeto inteiro.

Faz sentido, sim, redefinir o BLOCO 5 como um plano mais granular de excelência do RAG e do sistema de perguntas e respostas.

## Novo plano específico do RAG

### 5A — Benchmark canônico e gate de regressão

Objetivo:

- tornar qualidade do RAG mensurável antes de novas mudanças

Entregas:

- conjunto benchmark fixo por categoria
- rubrica por tipo de pergunta
- avaliação separada por `Direto` e `Didático`
- critérios mínimos de aceite

Critério de saída:

- toda mudança de retrieval, prompt ou schema passa por uma bateria canônica antes de ser considerada pronta

### 5B — Retrieval governado por metadados reais

Objetivo:

- fazer o ranking refletir a riqueza editorial já registrada no manifesto

Entregas:

- uso efetivo de `scope_instance`
- uso efetivo de `escopo_usuario`
- uso efetivo de `module_tags`
- reforço do filtro por versão quando a pergunta explicitar versão ou módulo
- redução de heurística solta e aumento de política declarada

Critério de saída:

- perguntas sobre versão, usuário externo, módulos e instância passam a ser resolvidas por metadados governados, não só por texto parecido

### 5C — Source-target routing de alta precisão

Objetivo:

- manter a vitória do roteamento por fonte nomeada sem overboost

Entregas:

- regra de segurança para fonte-alvo semanticamente fraca
- score mínimo para permitir boost
- fallback elegante quando a fonte nomeada existe, mas não sustenta bem a resposta
- bateria específica para “segundo a fonte X”

Critério de saída:

- a CLARA continua boa em perguntas nomeadas, mas sem forçar citações inadequadas

### 5D — Arquitetura da resposta e fidelidade entre modos

Objetivo:

- fazer `Direto` e `Didático` virarem contratos realmente distintos

Entregas:

- reforço do prompt de modo
- eventual schema com expectativas mais explícitas por modo
- verificação de cadência e densidade da resposta
- teste comparativo de perguntas iguais em ambos os modos

Critério de saída:

- o usuário percebe diferença clara de leitura e utilidade entre os dois modos, sem perda de grounding

### 5E — UX grounded e transparência editorial

Objetivo:

- mostrar melhor por que a resposta é confiável

Entregas:

- exposição mais clara de camada da fonte (`nucleo`, `cobertura`, `apoio`)
- explicação curta quando houver conflito ou precedência editorial
- refinamento da apresentação de referências e notices

Critério de saída:

- a confiança da resposta deixa de parecer só um “badge bonito” e passa a ter semântica mais explícita para o usuário

### 5F — Operação contínua do corpus

Objetivo:

- crescer o corpus sem degradar o retrieval

Entregas:

- substituir o Decreto `55.615` por captura íntegra oficial
- manter manifesto e corpus remoto sincronizados
- testar novos lotes sob benchmark, não por intuição

Critério de saída:

- cada novo documento entra por protocolo, com impacto mensurado na qualidade das respostas

## Ordem recomendada

1. `5A` — benchmark e gate
2. `5B` — retrieval por metadados
3. `5C` — source-target com segurança
4. `5D` — fidelidade entre `Direto` e `Didático`
5. `5E` — transparência editorial no frontend
6. `5F` — expansão contínua do corpus

## Próxima ação recomendada

Abrir imediatamente o `5A`:

- consolidar uma bateria canônica de perguntas
- separar por tipo de pergunta
- definir critérios de aceite
- e só então iterar retrieval e modos de resposta com régua fixa

## Conclusão

O projeto não precisa mais de fundação nova.

Ele precisa agora de um ciclo mais disciplinado de:

- benchmark
- política de retrieval
- fidelidade de modo
- transparência editorial
- expansão governada do corpus

A CLARA já está funcional. O novo plano serve para transformar esse funcionamento em confiabilidade previsível, auditável e cada vez mais consistente.
