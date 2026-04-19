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
| Baseline local | `npm run validate` green, com apenas um warning nao bloqueante |
| Fechamento final | pendente de limpeza remota final e housekeeping residual |

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

### 1. Supabase remoto

Ainda existem leftovers de template:

- `public.users`
- `public.posts`
- `public.comments`

Essas estruturas não fazem parte do produto e precisam ser removidas ou explicitamente justificadas.

### 2. Housekeeping tecnico

- warning nao bloqueante de `react-refresh/only-export-components` em `src/components/providers/SmoothScrollProvider.tsx`
- eventual comentario mais explicito sobre `service_role` na migration do `chat_response_cache`

### 3. Blockers externos

- Google OAuth administrativo continua dependente de configuração externa
- modelos Gemini de geração continuam em `preview`

## O que foi superado

Itens que já não descrevem corretamente o projeto atual:

- narrativas antigas que ainda apontavam `main` para `6770c85`
- README antigo com `flash-lite` como modelo primário
- continuidade antiga que tratava query expansion como parte ativa do runtime
- incerteza antiga sobre saúde do corpus remoto ativo

## Próxima sequência recomendada

1. fechar documentação pública e operacional restante
2. concluir auditoria/limpeza final do Supabase remoto
3. decidir o tratamento final do warning residual de frontend
4. só então abrir nova rodada maior de evolução

## Critério prático para travar versão

A CLARAINOVA02 poderá ser tratada como quase travada quando estes cinco critérios estiverem simultaneamente fechados:

1. documentação principal sem contradições com o código
2. baseline local verde (`npm run validate`)
3. Supabase remoto sem leftovers ambíguos
4. política explícita de `response cache`
5. ajustes públicos prioritários conscientemente resolvidos ou postergados
