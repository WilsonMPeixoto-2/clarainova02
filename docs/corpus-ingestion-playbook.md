# Playbook de ingestao inicial da CLARA

Data: 2026-03-31

## Objetivo

Definir a ordem pratica de alimentacao do corpus inicial da CLARA, com foco em qualidade de resposta e minimo retrabalho.

## Regra operacional

Nao carregar dezenas de documentos de uma vez.

Cada lote inicial deve ser pequeno, validado e ter motivo claro para entrar.

## Ordem recomendada do corpus minimo viavel

### Lote 1. Nucleo oficial do SEI-Rio

Prioridade: alta

Entram primeiro:

- manual operacional oficial
- manual de uso oficial
- norma ou instrucao diretamente aplicada ao fluxo do SEI-Rio

Objetivo:

- sustentar as respostas mais nucleares do chat
- reduzir o risco de grounding em material lateral

Peso sugerido:

- `1.25` a `1.35`

### Lote 2. Cobertura operacional validada

Prioridade: alta para guias, media para FAQ

Entram depois:

- guias praticos
- cartilhas operacionais validadas
- FAQ institucional do mesmo dominio

Objetivo:

- ampliar cobertura de perguntas frequentes
- melhorar explicacoes de rotina sem substituir o nucleo oficial

Peso sugerido:

- guias: `1.10` a `1.18`
- FAQs: `0.92`

### Lote 3. Rotinas administrativas complementares

Prioridade: media

Entram depois:

- materiais administrativos que explicam fluxos relacionados ao uso real do SEI-Rio

Objetivo:

- cobrir perguntas operacionais que ficam no entorno do sistema
- apoiar tarefas recorrentes sem inflar o corpus

Peso sugerido:

- `0.95`

### Lote 4. Apoio complementar controlado

Prioridade: baixa

Entram por ultimo e apenas se houver lacuna real:

- materiais de apoio
- referencias secundarias
- documentos que ajudam casos pouco frequentes

Objetivo:

- preencher lacunas especificas
- evitar que o chat fique ruidoso por excesso de material marginal

Peso sugerido:

- `0.80` a `0.90`

## O que fica fora do chat

Nao deve entrar como base ativa:

- documentos de arquitetura da CLARA
- materiais de backend, RAG, embeddings, funcoes edge ou infraestrutura
- rascunhos tecnicos internos

Configuracao:

- `topic_scope = clara_internal`
- `corpus_category = interno_excluido`
- `is_active = false`
- `search_weight = 0`

## Checklist por documento

Antes de ingerir:

1. Confirmar se o documento realmente ajuda uma pergunta operacional do usuario final.
2. Classificar `topic_scope`, `document_kind` e `authority_level`.
3. Definir `corpus_category`, `ingestion_priority` e `search_weight`.
4. Confirmar se o documento deve ficar `is_active = true`.
5. Registrar origem, data e observacao de curadoria quando necessario.

Depois de ingerir:

1. Verificar se `documents` recebeu os metadados esperados.
2. Verificar se `document_chunks` foi populado.
3. Confirmar se o documento ficou em um dos estados corretos:
   - `ready`
   - `embedding_pending`
   - `chunks_incomplete`
4. So considerar o documento apto para grounding principal quando `grounding_enabled = true`.
5. Testar ao menos uma pergunta real ligada ao documento.
6. Confirmar se a referencia aparece de forma coerente na resposta.

## Tratamento para falha parcial de embeddings

Se o provedor de embeddings estiver indisponivel, sem cota ou com chave invalida:

- o documento pode ser salvo no banco com todos os chunks
- o status deve ficar como `embedding_pending`, e nao como `processed`
- o admin deve usar `Retomar` quando o provedor estiver normalizado
- o documento nao deve ser tratado como pronto para o grounding principal

Essa regra existe para manter a operacao honesta enquanto Gemini e corpus real ainda nao estiverem estabilizados.

## Estrategia do corpus inicial

Sequencia recomendada:

1. 3 a 5 documentos do nucleo oficial
2. 2 a 4 documentos de cobertura operacional
3. 1 a 2 documentos complementares apenas se surgir lacuna real

Nao ultrapassar esse volume antes do primeiro ciclo de validacao do RAG.

## Criterio de avance para o proximo bloco

Este playbook prepara o caminho para o `BLOCO 3`.

So vale partir para a prova operacional do RAG quando:

- o admin estiver capturando governanca suficiente
- o corpus minimo tiver prioridade clara
- a primeira carga puder ser feita sem improviso
