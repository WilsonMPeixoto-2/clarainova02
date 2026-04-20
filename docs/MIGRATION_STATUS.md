# Status de Operação, Migração e Consolidação — CLARAINOVA02

Última atualização: `2026-04-19`

## Resumo executivo

O projeto saiu da fase de fundação e está em fase final de consolidação pré-`v1.0`.

O estado real auditado em `origin/main @ 6426b33ceaa0d08336a23daad03c0fcba2f2514a` é:

| Frente | Estado atual |
|---|---|
| SPA pública | madura e operacional |
| Chat | maduro e bem resolvido |
| Backend RAG | robusto e funcional |
| Corpus remoto | saudável |
| Caches | implementados e ativos |
| Continuidade oficial | reconciliada em `2026-04-19`, após drift relevante |
| Baseline local | `npm run validate` green |
| Fechamento final | housekeeping tecnico concluido na branch de sessao |

## O que está confirmado hoje

### Aplicação pública

- home pública forte, com identidade visual própria
- posicionamento transparente: projeto autoral, não canal oficial
- FAQ, paginas legais e footer coerentes com esse posicionamento
- abertura do chat por CTA direto e por query string
- header desktop agora expõe `Funcionalidades`, reduzindo a dependência exclusiva do scroll

### Chat

- persistência local do histórico
- persistência da preferência entre `Direto` e `Didático`
- resposta estruturada com resumo, etapas, observações e referências
- navegação entre citações e referências
- exportação em PDF
- impressão
- cópia de resposta
- feedback estruturado com persistência no backend
- boa adaptação mobile e desktop
- cabeçalho do chat agora condensa rótulos em larguras intermediárias para reduzir ruído visual

### Backend do chat

- structured generation com schema
- retrieval híbrido governado
- source-target routing
- leakage repair
- emergency playbooks
- embedding cache
- response cache

### Modelos no código atual

- primário: `gemini-3.1-pro-preview`
- fallback: `gemini-3.1-flash-lite-preview`
- embedding: `gemini-embedding-2-preview`

### Query expansion

- **desligada intencionalmente** no runtime atual

### Response cache

- governanca operacional formalizada em `docs/response-cache-governance.md`
- `cache hit` agora entra na telemetria
- contrato atual versionado por `CHAT_RESPONSE_CACHE_CONTRACT_VERSION`
- comentario operacional no banco para `embedding_cache` e `chat_response_cache`

## Estado remoto auditado

Projeto Supabase de referência:

- `jasqctuzeznwdtbcuixn`

Quantitativos confirmados em `2026-04-19`:

- `23` documentos totais
- `17` documentos ativos
- `23` documentos processados
- `0` documentos não processados
- `289` chunks ativos
- `289/289` chunks ativos com embedding
- `9` linhas em `embedding_cache`
- `3` linhas em `chat_response_cache`

Telemetria recente:

- `12` chats respondidos nos últimos `14` dias
- `0` chats falhos na mesma janela
- latência média: `26435 ms`

Distribuição recente de `search_mode`:

- `12 keyword_only`
- `7 hybrid_governed`
- `5 hybrid`
- `4 keyword_only_targeted`

Leitura correta desse quadro:

- o corpus remoto está mais pronto do que a continuidade antiga indicava
- mas a camada semântica ainda não domina o tráfego recente a ponto de encerrar a frente sem ressalvas

## Pendências reais ainda abertas

### 1. Configuracao externa do Supabase Auth

Advisor remanescente:

- `auth_leaked_password_protection`

Esse item nao vem do codigo nem do schema versionado. Ele depende de ajuste externo no Supabase Auth.

### 2. Promocao para producao

- a branch de sessao esta tecnicamente pronta
- `origin/main` continua como fonte oficial de verdade
- promover producao com coerencia exige integracao em `main`

### 3. Blockers externos

- Google OAuth administrativo continua dependente de configuração externa
- modelos Gemini de geração continuam em `preview`

## O que foi superado

Itens que já não descrevem corretamente o projeto atual:

- narrativas antigas que ainda apontavam `main` para `6770c85`
- README antigo com `flash-lite` como modelo primário
- continuidade antiga que tratava query expansion como parte ativa do runtime
- incerteza antiga sobre saúde do corpus remoto ativo
- leftovers de template no Supabase remoto
- warning residual de `SmoothScrollProvider.tsx`
- advisor de `function_search_path_mutable` em `public.set_updated_at`

## Próxima sequência recomendada

1. decidir a promocao desta branch para `origin/main`
2. decidir se `auth_leaked_password_protection` sera tratado antes da promocao
3. publicar producao de forma alinhada com `main`
4. so entao abrir nova rodada maior de evolucao

## Critério prático para travar versão

A CLARAINOVA02 poderá ser tratada como quase travada quando estes cinco critérios estiverem simultaneamente fechados:

1. documentação principal sem contradições com o código
2. baseline local verde (`npm run validate`)
3. Supabase remoto sem leftovers ambíguos
4. política explícita de `response cache`
5. ajustes públicos prioritários conscientemente resolvidos ou postergados
