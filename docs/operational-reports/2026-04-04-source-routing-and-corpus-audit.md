# Relatório operacional — roteamento por fonte nomeada e auditoria do corpus

Data: 2026-04-04
Frente: Source-target routing, corpus cleanup, integração RAG

## Objetivo

Resolver o gap de roteamento por fonte nomeada identificado na avaliação batch 2:
perguntas que citam explicitamente uma fonte externa (nota oficial, wiki, material da UFSCar)
deviam trazer a fonte citada como referência principal, mas o sistema priorizava o núcleo
local por causa do `search_weight` multiplicador na busca híbrida.

## O que foi implementado

### 1. Detecção de fonte-alvo (`detectSourceTarget`)

Nova função em `knowledge.ts` que detecta padrões como:
- "segundo a nota oficial do SEI 5.0..."
- "segundo a wiki SEI-RJ..."
- "segundo o material da UFSCar..."
- "conforme o manual do PEN..."

Retorna um `SourceTargetRoute` com:
- `matches()`: predicate para chunks
- `topicScopes` e `sourceNamePatterns`: filtros para busca targeted
- `versionConstraint`: versão específica quando aplicável

### 2. Recuperação targeted em dois estágios

Novo fluxo no pipeline de busca:

1. **Estágio 1** — busca normal via `hybrid_search_chunks` (12 resultados com search_weight)
2. **Estágio 2** — se fonte-alvo detectada, chama `fetch_targeted_chunks` para buscar os top-3 chunks dos documentos-alvo por distância de embedding pura, sem multiplicador de peso

A nova função SQL `fetch_targeted_chunks` aceita `target_document_ids` e retorna chunks
ordenados por embedding distance sem o `search_weight` que suprimia fontes de peso baixo.

### 3. Garantia de inclusão no scoring

O scoring em `prepareKnowledgeDecision` recebeu:
- boost de +15 pontos para chunks que correspondem à fonte-alvo
- reserva de 2 slots mínimos para chunks roteados na seleção final (6 chunks)
- os slots restantes seguem a ordem normal de score

### 4. Prompt de geração informado

Quando uma fonte-alvo é detectada, o prompt de geração recebe:
```
FONTE-ALVO NOMEADA PELO USUARIO:
- O usuario pediu explicitamente informacoes "nota oficial sei 5.0"
- Versao especifica solicitada: 5.0
- PRIORIZE as referencias que correspondam a essa fonte na resposta.
```

## Auditoria do corpus

### Documentos promovidos

- `SEI-Guia-do-usuario-Versao-final.pdf` (88 chunks) — promovido a status governado NUCLEO_P1
  - `source_name` → Prefeitura da Cidade do Rio de Janeiro
  - `search_weight` → 1.32
  - `version_label` → SEI.Rio 2025
  - A versão menor de 25 chunks foi desativada

### Documentos desativados / removidos

- `MODELO_DE_OFICIO_PDDE.pdf` — fora do escopo SEI.Rio, desativado
- 3 registros de ingestão falhada (guia interno/migração/externo com 1 chunk) — desativados
- Decreto 55.615 versão antiga (Prefeitura, 1 chunk) — substituída pela versão Câmara

### Correção de metadados

- `Termo de Uso e Aviso de Privacidade` — topic_scope corrigido de `material_apoio` para `sei_rio_termo`
- `sei_rio_termo` adicionado às tabelas de scoring em:
  - `knowledge.ts` TOPIC_SCOPE_SCORE (0.95)
  - `hybrid_search_chunks` SQL function (search_weight: 1.0, authority: official, kind: termo)

## Resultado da avaliação batch 3

Bateria: 16 perguntas reais (mesmas da batch 2).

### Antes (batch 2 — referência)

- 16/16 HTTP 200
- 16/16 sem web fallback
- 15/16 answerScopeMatch = exact
- 13/16 expectedAllMet = true

### Depois (batch 3 — com source routing + corpus cleanup)

- 16/16 HTTP 200
- 16/16 sem web fallback
- **16/16 answerScopeMatch = exact** (era 15/16)
- **16/16 expectedAllMet = true** (era 13/16)
- **16/16 finalConfidence = 1** (era variável)

### Detalhamento das correções

| Caso | Antes | Depois |
|------|-------|--------|
| Q13 — nota oficial SEI 5.0 | Citava 5.0.3, não 5.0 | Cita 5.0 como ref #1 |
| Q14 — wiki SEI-RJ | Wiki ausente das refs | Wiki nos 3 primeiros slots |
| Q15 — material UFSCar | UFSCar ausente | UFSCar como ref #1 |

## Corpus ativo final

17 documentos, 261 chunks, 261 embeddings.

| Camada | Documentos | Chunks |
|--------|-----------|--------|
| NUCLEO_P1 (norma) | 3 | 97 |
| NUCLEO_P1 (guia) | 4 | 102 |
| NUCLEO_P2 (faq/termo) | 3 | 42 |
| COBERTURA_P2 | 5 | 17 |
| APOIO_P3 | 2 | 5 |

## Artefatos

- `docs/operational-reports/data/2026-04-04-rag-batch-3-source-routing-eval.json`
- `docs/operational-reports/data/2026-04-04-rag-batch-3-post-targeted-retrieval.json`
- `supabase/migrations/20260404134500_add_targeted_chunk_retrieval.sql`
