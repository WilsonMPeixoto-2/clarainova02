## Relatório consolidado do dia — análise profunda do repositório, validação do BLOCO 4B e avanço local do BLOCO 4C

Data: 2026-04-03  
Branch de sessão: `session/2026-04-03/HOME/CODEX/BLOCO-4C-INGESTION-HARDENING`

## Resumo executivo

O projeto fechou hoje uma virada importante:

- o contrato novo do Gemini foi integrado em `main` e publicado em produção
- a esteira administrativa nova foi provada com um PDF real e grounding real
- o BLOCO 4B foi concluído com evidência operacional em banco, painel admin e chat público
- a análise profunda do repositório e das branches paralelas mostrou que existe uma linha segura para continuar, mas não existe branch paralela pronta para merge cego
- o BLOCO 4C já avançou localmente com deduplicação por `document_hash`, concorrência controlada no `embed-chunks` e testes mínimos do pipeline

## Estado do produto ao fim da análise

### Produção canônica

- URL: `https://clarainova02.vercel.app`
- `main` publicado: `fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`
- runtime atual em produção já declara:
  - `gemini-3.1-flash-lite-preview`
  - fallback `gemini-3.1-pro-preview`
  - `gemini-embedding-2-preview`
  - `taskType` explícito para query/documento
  - normalização L2 em `768`

### BLOCO 4B — concluído com prova operacional

Documento novo validado:

- `SEI-Guia-do-usuario-Versao-final.pdf`
- `88/88` chunks
- `88/88` embeddings
- `status = processed`

Campos comprovados no Supabase remoto:

- `embedding_model = gemini-embedding-2-preview`
- `embedding_dim = 768`
- `embedded_at` preenchido
- `chunk_metadata_json` preenchido
- `content` sem prefixo legado `[Fonte: ... | Página: ...]`

Grounding comprovado em produção:

- pergunta sobre documento externo
- pergunta sobre bloco de assinatura
- pergunta sobre envio simultâneo para múltiplas unidades

Todas responderam com referências ao novo manual.

## Análise profunda do repositório

### Linha principal

O repositório principal está hoje em um estado mais coerente do que no início da rodada:

- `main` já representa o contrato Gemini efetivamente usado
- a cadeia canônica de migrations foi reconciliada com o remoto oficial
- a auth das functions administrativas foi reequilibrada e já não bloqueia o fluxo real do admin
- a ingestão nova foi provada em produção com PDF real

### Hotspots ainda ativos

Os hotspots mais importantes continuam sendo:

- `src/pages/Admin.tsx`
- `src/components/ChatSheet.tsx`
- `supabase/functions/chat/index.ts`

Eles continuam concentrando muita responsabilidade e merecem decomposição posterior, mas neste momento não bloqueiam a operação do corpus inicial.

### Branch paralela do chat/layout

A análise da branch `origin/session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING` mostrou refinamentos reais no chat, mas **não seguros para merge integral**.

O que ela traz de potencialmente útil:

- uso do `ClaraMonogram` no cabeçalho/empty state
- status visual mais refinado no header
- refinamentos de estilo do painel
- proposta de `textarea` para perguntas mais longas

O que impede merge cego:

- mistura essas mudanças com deltas antigos de backend/Gemini já superados
- altera comportamento importante do painel, incluindo default para `fullscreen` no desktop
- simplifica e remove partes explicativas do contrato de uso do chat
- muda a interação do campo de entrada e do controle de painel sem validação dedicada

Decisão desta rodada:

- **não mergear essa branch integralmente**
- preservar os refinamentos úteis como candidatos a integração seletiva futura

### Branch remota do Copilot

A branch `origin/copilot/analise-completa-codigos-e-layout` foi considerada **insegura para integração**.

Motivos:

- mistura mudanças antigas de Gemini com a nova trilha oficial
- reabre ou reembaralha migrations canônicas
- regressa parte da continuidade e da documentação operacional

Decisão desta rodada:

- **não usar essa branch como base de merge**
- tratar somente como fonte de leitura/análise, não como fonte operacional

## BLOCO 4C — avanço local já implementado

### 1. Deduplicação por `document_hash`

Implementado em:

- `src/lib/admin-ingestion.ts`
- `src/pages/Admin.tsx`

O que mudou:

- `preparePdfIngestion()` agora retorna `documentHash`
- o hash SHA-256 do arquivo é calculado antes da persistência do documento
- o admin faz preflight para detectar duplicidade antes do upload
- se houver corrida e o `insert` bater no índice único, a duplicidade é tratada de forma graciosa
- no retry, o hash do documento é retroalimentado se estiver ausente

Resultado esperado:

- o mesmo PDF deixa de ser reingerido silenciosamente
- custo duplicado de storage/chunking/embedding cai

### 2. Paralelismo controlado no `embed-chunks`

Implementado em:

- `supabase/functions/embed-chunks/index.ts`
- `supabase/functions/_shared/embedding-contract.ts`

O que mudou:

- o lote deixa de gerar embeddings de forma totalmente sequencial
- a concorrência foi fixada em `3`
- a ordem do lote continua preservada
- o evento operacional agora também registra `concurrency`

Resultado esperado:

- redução perceptível de latência por lote
- sem paralelismo agressivo demais para quota/estabilidade

### 3. Testes mínimos do pipeline

Novos testes:

- `src/test/admin-ingestion.test.ts`
- `src/test/embedding-contract.test.ts`

Cobertura adicionada:

- sanitização de nome de arquivo
- hash estável por conteúdo
- geração de chunks estruturados sem prefixo artificial
- normalização L2
- metadata do chunk com `task_type`, `title_used` e `normalization`
- estimativa básica de tokens

## Validação executada nesta rodada

- `npm test -- admin-ingestion.test.ts embedding-contract.test.ts chat-runtime.test.ts`
- `npm run typecheck`
- `npm run validate`

Resultado:

- `14` arquivos de teste passando
- `61` testes passando
- build de produção passando

## Próximos passos revalidados

### Próximo passo principal

Concluir o BLOCO 4C em nível operacional:

1. publicar esta branch com o pacote de deduplicação/paralelismo/testes
2. repetir um upload controlado para verificar deduplicação no ambiente real
3. decidir se o documento legado `MODELO_DE_OFICIO_PDDE.pdf` será reprocessado ou removido

### Próximo passo depois do 4C

Abrir a carga curada do corpus inicial:

- começar pequeno
- subir poucos PDFs por vez
- medir grounding e cobertura antes de expandir

## Itens deliberadamente adiados

- merge integral da branch paralela de layout do chat
- refatoração estrutural grande do admin
- background jobs fora do ciclo da aba
- reranking, HyDE, query expansion
- novas features públicas sem relação direta com o corpus inicial

## Backlog Gemini preservado

As oportunidades seguintes foram mantidas explicitamente no radar do projeto:

- Matryoshka / redução futura de dimensionalidade
- context caching
- Google Search grounding nativo
- URL Context
- multimodalidade por print de tela
- File Search como benchmark, não como substituto imediato
- function calling/orquestração mais rica

## Conclusão

O estado do projeto mudou de natureza hoje.

Antes, a pergunta central era:

- “será que a esteira nova funciona?”

Agora a pergunta correta passou a ser:

- “como endurecer a ingestão e escalar o corpus sem perder qualidade?”

Essa é uma mudança boa. O projeto saiu da fase de prova de arquitetura e entrou, de fato, na fase de operação documental com método.
