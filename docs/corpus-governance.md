# Governanca do corpus da CLARA

Data: 2026-03-30

## Objetivo

Definir como a base documental da CLARA deve ser alimentada, priorizada e mantida, evitando ingestao oportunista ou mistura de materiais com pesos incoerentes.

## Principio central

A CLARA nao deve ingerir "todo PDF disponivel". O corpus deve nascer de um nucleo pequeno, confiavel e bem identificado, e so depois ampliar cobertura.

## Metadados obrigatorios por documento

Todo documento novo inserido no admin deve sair com estes campos definidos:

- `topic_scope`
- `document_kind`
- `authority_level`
- `search_weight`
- `is_active`

Esses campos determinam escopo, prioridade e elegibilidade do material no chat.

## Metadados complementares recomendados

Sempre que possivel, o admin deve registrar tambem:

- `source_type`
- `source_name`
- `source_url`
- `summary`
- `version_label`
- `published_at`
- `last_reviewed_at`
- `corpus_category`
- `ingestion_priority`
- `governance_notes`

Na implementacao atual, os complementares ficam em parte nas colunas de `documents` e em parte em `metadata_json`.

## Categorias de corpus

### 1. Nucleo oficial

Finalidade:

- sustentar a maior parte das respostas grounded
- servir como referencia principal quando houver conflito entre materiais

Entram aqui:

- normas diretamente aplicaveis ao SEI-Rio
- manuais oficiais e operacionais do SEI-Rio

Configuracao esperada:

- `corpus_category = nucleo_oficial`
- `ingestion_priority = alta`
- `authority_level = official`
- `search_weight` alto

### 2. Cobertura operacional

Finalidade:

- ampliar o repertorio de rotinas reais sem competir com o nucleo oficial

Entram aqui:

- guias praticos
- FAQs institucionais
- rotinas administrativas validadas pela unidade competente

Configuracao esperada:

- `corpus_category = cobertura_operacional`
- `ingestion_priority = alta` para guias
- `ingestion_priority = media` para FAQs e rotinas de apoio
- `authority_level = institutional` ou `official`, conforme o caso

### 3. Apoio complementar

Finalidade:

- fechar lacunas especificas do corpus principal
- apoiar perguntas de menor frequencia sem inflar a base

Entram aqui:

- materiais de apoio
- cartilhas locais
- referencias complementares nao nucleares

Configuracao esperada:

- `corpus_category = apoio_complementar`
- `ingestion_priority = baixa`
- `search_weight` mais baixo

### 4. Interno excluido

Finalidade:

- preservar registro operacional sem contaminar o grounding do chat

Entram aqui:

- documentos tecnicos da propria CLARA
- materiais de arquitetura, backend, RAG, telemetria ou infraestrutura

Configuracao esperada:

- `corpus_category = interno_excluido`
- `is_active = false`
- `search_weight = 0`
- `topic_scope = clara_internal`

## Regras de prioridade

1. Norma oficial antes de manual.
2. Manual oficial antes de guia.
3. Guia validado antes de FAQ.
4. FAQ antes de material complementar.
5. Material interno da CLARA nunca entra no chat por padrao.

## Regras de ativacao

- `is_active = true` so para documentos que podem, de fato, sustentar respostas ao usuario final.
- Material tecnico da CLARA deve permanecer `is_active = false`, salvo override deliberado e excepcional.
- Documento antigo, revogado ou supersedido deve ser desativado antes da ingestao de substituto mais atual.

## Politica de peso de busca

Faixa recomendada:

- `1.25` a `1.35` para nucleo oficial
- `1.00` a `1.18` para cobertura operacional
- `0.80` a `0.95` para apoio complementar
- `0.00` para interno excluido

O peso so deve subir quando houver razao clara de autoridade ou aderencia ao SEI-Rio.

## Politica de curadoria

- nao ingerir duplicatas triviais
- nao ingerir versoes antigas sem marcar claramente o estado
- nao misturar documento institucional com material tecnico da CLARA
- preferir documento mais atual quando houver equivalentes
- registrar notas de curadoria quando a prioridade nao for obvia

## Estado materializado no produto

O admin agora:

- define o perfil de governanca antes do upload
- pode manter a classificacao principal em modo automatico ou sobrescrever
- registra categoria de corpus e prioridade de ingestao
- visualiza na lista de documentos o escopo, tipo, autoridade, peso, prioridade e status de ativacao

## O que este documento nao faz

Este documento nao autoriza ingestao ampla.

Ele apenas fixa o sistema de decisao que deve guiar a primeira carga real do corpus.
