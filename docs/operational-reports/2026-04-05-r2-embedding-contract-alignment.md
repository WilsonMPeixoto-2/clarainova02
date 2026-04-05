# 2026-04-05 — R2 concluído localmente: contrato de embeddings alinhado

## Objetivo

Executar o `R2` do novo plano do RAG:

- alinhar o contrato de embeddings a instruções textuais assimétricas por tarefa
- separar semântica vetorial de metadado de citação
- preservar compatibilidade suficiente para o retrieval e para a UI grounded já existentes

## Leitura técnica usada nesta rodada

- contrato atual em `supabase/functions/chat/index.ts`
- contrato atual em `supabase/functions/embed-chunks/index.ts`
- chunking do admin em `src/lib/admin-ingestion.ts`
- parsing de referências e contexto em `supabase/functions/chat/knowledge.ts`
- helpers compartilhados em `supabase/functions/_shared/embedding-contract.ts`

## Decisão de implementação

Nesta rodada, o contrato foi ajustado para usar **instrução textual de domínio** sem abandonar as pistas de API já suportadas pelo Gemini.

Em vez de remover `taskType` e `title`, o código passou a:

- manter `taskType` na API como pista adicional
- manter `title` no embedding documental
- adicionar framing textual explícito para query e documento
- parar de contaminar `chunk.content` com prefixos `[Fonte: ... | Página: ...]`

Essa decisão reduz a dependência de um único canal semântico e evita regressão desnecessária no que já está funcional.

## Mudanças implementadas

### 1. Helpers compartilhados do contrato

Arquivo:

- `supabase/functions/_shared/embedding-contract.ts`

Entraram:

- `EMBEDDING_CONTRACT_VERSION = 2026-04-05-r2-domain-instructions-v1`
- `EMBEDDING_DOMAIN_SCOPE = sistema_sei_rio_prefeitura_rio`
- `buildQueryEmbeddingText(...)`
- `buildDocumentEmbeddingText(...)`

Também foram ampliados os metadados persistidos por chunk:

- `input_style`
- `contract_version`
- `domain_scope`

### 2. Query embedding no chat

Arquivo:

- `supabase/functions/chat/index.ts`

Mudanças:

- a query enviada ao embedding agora passa por `buildQueryEmbeddingText(...)`
- a expanded query também passa pelo mesmo framing textual
- `search_metrics.query_embedding_model` agora carrega a versão do contrato junto ao modelo

### 3. Document embedding na Edge Function

Arquivo:

- `supabase/functions/embed-chunks/index.ts`

Mudanças:

- o embedding documental agora usa `buildDocumentEmbeddingText(...)`
- `taskType = RETRIEVAL_DOCUMENT` e `title` foram preservados
- os logs e o `chunk_metadata_json` agora registram estilo de entrada e versão do contrato

### 4. Chunking do admin limpo novamente

Arquivo:

- `src/lib/admin-ingestion.ts`

Mudança:

- `buildPreparedChunksFromPages(...)` voltou a gerar `content` sem prefixo `[Fonte: ... | Página: ...]`
- `sourceTag`, `pageStart`, `pageEnd` e `sectionTitle` continuam sendo enviados como metadados estruturados

## Compatibilidade preservada

O parsing em `supabase/functions/chat/knowledge.ts` continua aceitando chunks legados com prefixo textual, mas o fluxo novo volta a privilegiar:

- `document_name`
- `page_start`
- `page_end`
- `section_title`

Isso permite conviver com material antigo enquanto os novos embeddings passam a nascer com semântica mais limpa.

## Testes adicionados ou atualizados

Arquivos:

- `src/test/embedding-contract.test.ts`
- `src/test/admin-ingestion.test.ts`

Cobertura validada:

- framing textual da query
- framing textual do documento
- metadados novos do contrato
- chunking semântico limpo, sem prefixo de fonte no conteúdo vetorial

## Validação local

- `npm test` passou com `17` suites e `74` testes
- `npm run typecheck` passou

Observação:

- o benchmark canônico continua sendo a régua oficial, mas nesta máquina ele bate no backend remoto e portanto não valida diretamente esta implementação local de Edge Functions
- `deno` continua indisponível neste ambiente, então não houve checagem nativa adicional das functions

## Próxima ação recomendada

Abrir `R3`:

- trocar embedding unitário concorrente por embedding em lote
- preparar re-embed controlado do corpus sob o novo contrato
- só depois avaliar impacto remoto e abrir a trilha de experimento de chunking/dimensionalidade
