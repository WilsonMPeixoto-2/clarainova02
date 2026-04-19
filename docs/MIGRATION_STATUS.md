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
| Baseline local | `npm test` e `npm run build` green; `npm run validate` ainda falha no lint |
| Fechamento final | pendente de governança, Supabase remoto e cache |

## O que está confirmado hoje

### Aplicação pública

- home pública forte, com identidade visual própria
- posicionamento transparente: projeto autoral, não canal oficial
- FAQ, páginas legais e footer coerentes com esse posicionamento
- abertura do chat por CTA direto e por query string

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

### 1. Baseline local

`npm run validate` ainda falha por:

- `@typescript-eslint/no-explicit-any` em `supabase/functions/chat/index.ts`
- warning de `react-refresh/only-export-components` em `src/components/providers/SmoothScrollProvider.tsx`

### 2. Supabase remoto

Ainda existem leftovers de template:

- `public.users`
- `public.posts`
- `public.comments`

Essas estruturas não fazem parte do produto e precisam ser removidas ou explicitamente justificadas.

### 3. Governança do response cache

O cache de respostas está funcionando, mas ainda faltam:

- política explícita de invalidação/versionamento
- telemetria adequada para `cache hit`
- documentação operacional consolidada

### 4. Blockers externos

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
2. corrigir o lint e recuperar `npm run validate`
3. concluir auditoria/limpeza final do Supabase remoto
4. formalizar governança do `chat_response_cache`
5. aplicar ajuste pequeno de arquitetura pública da informação

## Critério prático para travar versão

A CLARAINOVA02 poderá ser tratada como quase travada quando estes cinco critérios estiverem simultaneamente fechados:

1. documentação principal sem contradições com o código
2. baseline local verde (`npm run validate`)
3. Supabase remoto sem leftovers ambíguos
4. política explícita de `response cache`
5. ajustes públicos prioritários conscientemente resolvidos ou postergados
