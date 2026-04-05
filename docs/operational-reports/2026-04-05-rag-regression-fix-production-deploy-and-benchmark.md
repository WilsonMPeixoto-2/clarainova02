# Relatório operacional - correção regressiva do RAG, publicação remota e benchmark canônico

Data: 2026-04-05  
Responsável: CODEX

## Objetivo

Fechar a regressão observada após a publicação de `R0-R2`, em que o benchmark canônico remoto perdeu cobertura explícita de referências em:

- `Q8` (`Decreto Rio nº 55.615` + `Guia de migração`)
- `Q10` (`Termo de Uso` + `Decreto Rio nº 57.250`)

## Diagnóstico confirmado

- o problema não estava na serialização final da resposta; estava na seleção de evidências do retrieval
- o chat aceitava bons chunks, mas não reservava cobertura complementar quando a pergunta exigia duas famílias de fonte
- o `Termo de Uso` já estava ativo no corpus, porém ainda com `metadata_json.document_kind = apoio`
- a migration remota `20260404134500_add_targeted_chunk_retrieval.sql` ainda não tinha sido aplicada no projeto oficial

## Correções implementadas

### 1. Seleção de evidências no chat

Arquivos:

- `supabase/functions/chat/knowledge.ts`
- `supabase/functions/chat/response-schema.ts`

Mudanças:

- inclusão de regras de cobertura mínima por pergunta para dois casos críticos:
  - coexistência de `Processo.rio` + `SEI.Rio` na transição
  - responsabilidade de `usuário externo`
- boost específico para:
  - `Guia de migração`
  - norma de substituição do `Processo.rio` (`55.615`)
  - `Termo de Uso`
  - norma de credenciamento de usuário externo (`57.250`)
- seleção final agora reserva referências necessárias antes de preencher os demais slots por score bruto
- `documentKind = termo` passa a ser tratado como referência normativa no schema final do chat

### 2. Governança local do corpus

Arquivos:

- `src/lib/knowledge-document-classifier.ts`
- `scripts/corpus/ingest_manifest_batch.py`
- `src/test/chat-knowledge.test.ts`
- `src/test/knowledge-document-classifier.test.ts`

Mudanças:

- `sei_rio_termo` e `termo` passam a ser tipos oficiais de primeira classe na taxonomia local
- o classificador local agora reconhece `Termo de Uso e Aviso de Privacidade` como material oficial do núcleo
- a derivação do manifesto em lote agora preserva `tipo_documental = termo` como:
  - `topic_scope = sei_rio_termo`
  - `document_kind = termo`

### 3. Normalização remota do metadata

Arquivo:

- `supabase/migrations/20260405114000_normalize_term_document_metadata.sql`

Mudança:

- documentos com `topic_scope = sei_rio_termo` deixam de ficar com `document_kind = apoio`

## Validação local

- `npm run validate` passou com `17` suites e `78` testes
- `python -m py_compile scripts/corpus/ingest_manifest_batch.py` passou

## Publicação remota

### GitHub

- commit funcional publicado: `705cc3cfc3a9383e1549cb10da521c01d1676985`
- mensagem: `fix: restore rag evidence coverage for transition and terms`

### Supabase

- `supabase db push --linked` aplicou:
  - `20260404134500_add_targeted_chunk_retrieval.sql`
  - `20260405114000_normalize_term_document_metadata.sql`
- `chat` republicada na versão `24`
- `embed-chunks` permaneceu na versão `17`
- estado remoto confirmado do `Termo de Uso`:
  - `topic_scope = sei_rio_termo`
  - `document_kind = termo`
  - `authority_level = official`
  - `search_weight = 1.12`

### Vercel

- deploy manual de produção: `dpl_9AhU94T5UGSjjzKhF7ZtHUTLTy6o`
- alias ativo: `https://clarainova02.vercel.app`
- inspector: `https://vercel.com/wilson-m-peixotos-projects/clarainova02/9AhU94T5UGSjjzKhF7ZtHUTLTy6o`

## Benchmark canônico remoto após a correção

### Didático

- `httpOk = 16/16`
- `noWebFallback = 16/16`
- `scopeExact = 15/16`
- `expectedAllMet = 16/16`
- `avgFinalConfidence = 0.9875`

### Direto

- `httpOk = 16/16`
- `noWebFallback = 16/16`
- `scopeExact = 16/16`
- `expectedAllMet = 16/16`
- `avgFinalConfidence = 1.0`

### Regressões-alvo fechadas

- `Q8` voltou a citar `Decreto Rio nº 55.615` e `Guia de migração`
- `Q10` voltou a citar `Termo de Uso` e `Decreto Rio nº 57.250`

## Backlog complementar recebido do usuário

### Já resolvido ou já existente

- `thinkingLevel` por complexidade
- temperatura dinâmica entre estruturado e fallback
- `maxOutputTokens = 8192`
- query expansion com contexto curto
- routing `flash-lite` / `pro` por complexidade
- framing textual de domínio no contrato de embeddings
- índice `HNSW` já presente

### Boa próxima leva após este pacote

- contextualizar o embedding da pergunta com o resumo da resposta anterior em follow-ups anafóricos
- coletar feedback explícito do usuário final no `ChatStructuredMessage`
- expor no admin um painel de `perguntas sem cobertura`
- registrar latência por estágio (`embedding`, `expansion`, `search`, `generation`, `sanitization`)
- introduzir budget de timeout por estágio
- criar validação periódica de frescor do corpus por `fonte_url`

### Continua como experimento ou roadmap

- cache de embeddings
- batch embedding nativo em `R3`
- benchmark de chunking e dimensionalidade em `R4-R5`
- context caching explícito do Gemini
- ingestão multimodal de PDFs
- grounding nativo por Google Search como fallback oficial

## Próxima ação recomendada

Com a regressão pós-publicação fechada e o benchmark remoto de volta ao green, o próximo passo volta a ser `R3`: batch embedding nativo e preparação de re-embed controlado do corpus.
