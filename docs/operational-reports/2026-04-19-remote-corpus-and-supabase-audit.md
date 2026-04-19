# Relatório Operacional — Auditoria Final de Corpus e Supabase Remoto

**Data:** 19/04/2026  
**Escopo:** corpus remoto, telemetria recente, caches, leftovers, RLS e estruturas auxiliares do projeto Supabase oficial  
**Projeto auditado:** `jasqctuzeznwdtbcuixn`  
**Base de código confrontada:** `origin/main @ 6426b33ceaa0d08336a23daad03c0fcba2f2514a`

---

## 1. Veredito executivo

### Conclusão sobre o corpus

> **corpus operacionalmente fechado**

Motivo:

- `17` documentos ativos
- `23` documentos processados
- `0` documentos não processados
- `289/289` chunks ativos com embedding
- `0` linhas recentes em `chat_metrics` com `model_name = grounded_fallback` nos últimos `14` dias

### Conclusão sobre o ambiente Supabase

> **ambiente remoto ainda pendente de limpeza final**

Motivo:

- leftovers de template ainda presentes
- `public.users` e `public.comments` com `RLS` desabilitado
- `public.posts` com `RLS` ligado, mas sem policy
- governança do `chat_response_cache` ainda depende de documentação/telemetria complementar

---

## 2. Evidência objetiva do corpus

### 2.1. Quantitativos globais

Consulta remota confirmou:

- `documents_total = 23`
- `documents_active = 17`
- `documents_inactive = 6`
- `documents_processed = 23`
- `documents_not_processed = 0`

### 2.2. Chunks e embeddings

Para documentos ativos:

- `active_chunks_total = 289`
- `active_chunks_with_embedding = 289`
- `active_chunks_without_embedding = 0`

Não há documento ativo com embeddings faltando.

### 2.3. Documentos ativos recentes

Entre os documentos ativos mais recentes auditados:

- `Manual do Usuário SEI 4.0+`
- `Termo de Uso e Aviso de Privacidade do SEI.Rio`
- `Nota oficial MGI sobre o SEI 5.0.3`
- `Painel de compatibilidade de versões do SEI com módulos do PEN`
- `Nota oficial MGI sobre a versão 4.1.5 do SEI`
- `Correspondência de Ícones SEI => SEI 4.0`
- `Novidades da versão 4.1 – Wiki SEI-RJ`
- `Decreto Rio nº 55.615 de 1º de janeiro de 2025`
- `Guia de migracao – SEI.Rio`
- `Guia do usuário interno – SEI.Rio (versão final consolidada)`

Leitura técnica:

- o corpus ativo está atualizado
- o corpus inativo existe como trilha histórica, mas não afeta o grounding ativo

---

## 3. Uso real de caminhos de busca e fallback

### 3.1. `search_mode` nos últimos 14 dias

Distribuição confirmada em `public.search_metrics`:

| search_mode | linhas | percentual |
|---|---:|---:|
| `keyword_only` | 12 | 42.9% |
| `hybrid_governed` | 7 | 25.0% |
| `hybrid` | 5 | 17.9% |
| `keyword_only_targeted` | 4 | 14.3% |

### 3.2. `chat_metrics` nos últimos 14 dias

Consulta remota confirmou:

- `12` chats
- `12` respondidos
- `0` não respondidos
- latência média: `26435 ms`
- `0` linhas com `model_name = grounded_fallback`

### 3.3. Leitura correta desse resultado

O ambiente remoto atual não mostra degradação severa do corpus. Pelo contrário:

- não há sinais recentes de fallback grounded emergencial dominando o tráfego
- há uso real de caminhos híbridos

Mas a camada lexical ainda responde por parcela relevante do tráfego:

- `keyword_only` + `keyword_only_targeted` = `57.2%`

Portanto:

- o corpus está operacionalmente fechado
- a camada semântica ainda não é dominante o suficiente para considerar a frente completamente esgotada do ponto de vista de otimização

---

## 4. Caches

### 4.1. `embedding_cache`

Estado remoto:

- `9` linhas
- modelo: `gemini-embedding-2-preview`
- `contract_version` observado: `2026-04-05-r2-domain-instructions-v1`
- há registros com `hits > 1`

Leitura:

- o cache de embeddings está vivo
- o contrato versionado está sendo persistido corretamente

### 4.2. `chat_response_cache`

Estado remoto:

- `3` linhas
- modos presentes: `didatico`, `direto`
- TTL curto observado por `expires_at` em janela de 24h
- `hits = 1` nas linhas auditadas

Leitura:

- o cache de respostas está ativo
- ainda está em fase inicial de aquecimento

### 4.3. Modelo de acesso real aos caches

Confirmado por migrations:

#### `embedding_cache`

`20260405235500_add_query_embedding_cache.sql`

- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- `REVOKE ALL ... FROM anon, authenticated`
- `GRANT ALL ... TO service_role`
- comentário explícito de consumo via Edge Functions

#### `chat_response_cache`

`20260419000000_add_chat_response_cache.sql`

- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- `REVOKE ALL ... FROM anon, authenticated`
- `GRANT ALL ... TO service_role`

Leitura:

- o modelo de acesso por `service_role` é válido
- a migration do `chat_response_cache` ainda deveria documentar isso tão explicitamente quanto a do `embedding_cache`

---

## 5. Leftovers e estruturas residuais

### 5.1. Tabelas detectadas

Foram confirmadas:

- `public.users`
- `public.posts`
- `public.comments`

### 5.2. Linhas encontradas

| tabela | linhas |
|---|---:|
| `users` | 3 |
| `posts` | 3 |
| `comments` | 0 |

### 5.3. Evidência de que são leftovers

Dados auditados:

#### `public.users`

- `mia@example.com` / `Mia Rivera`
- `ava@example.com` / `Ava Chen`
- `noah@example.com` / `Noah Patel`

#### `public.posts`

- `Ten SQL Tricks for Faster Queries`
- `Building a Blog with Supabase`
- `Designing Comment Threads`

Além disso, uma busca no código-fonte do projeto não encontrou uso real de `public.users`, `public.posts` ou `public.comments`.

Leitura:

> estas tabelas são leftovers de template e não pertencem ao produto CLARA

---

## 6. RLS e policies

### 6.1. Estado atual

| tabela | rowsecurity |
|---|---|
| `chat_metrics` | `true` |
| `chat_response_cache` | `true` |
| `comments` | `false` |
| `document_chunks` | `true` |
| `documents` | `true` |
| `embedding_cache` | `true` |
| `posts` | `true` |
| `query_analytics` | `true` |
| `search_metrics` | `true` |
| `users` | `false` |

### 6.2. Policies

Consulta a `pg_policies` para:

- `users`
- `comments`
- `posts`
- `embedding_cache`
- `chat_response_cache`

retornou **zero policies**.

### 6.3. Leitura técnica

Isso se divide em dois casos:

#### Caso aceitável

`embedding_cache` e `chat_response_cache`

- RLS habilitado
- sem policy
- `REVOKE ALL` para `anon`/`authenticated`
- `GRANT ALL` para `service_role`

Isso é compatível com acesso exclusivo via Edge Functions.

#### Caso problemático

`users`, `comments`, `posts`

- não são parte do produto
- `users` e `comments` estão com `RLS` desligado
- `posts` está com `RLS` ligado, mas sem policy

Essas tabelas não deveriam permanecer ambíguas no ambiente de produção.

---

## 7. Achados finais

### Confirmado

- corpus ativo pronto para grounding
- embeddings ativos completos
- telemetria recente sem fallback grounded dominante
- caches implementados e vivos
- modelo de acesso dos caches coerente com uso via `service_role`

### Pendente relevante

- limpeza dos leftovers `users`, `posts`, `comments`
- documentação explícita do modelo de acesso do `chat_response_cache`
- governança de observabilidade do cache de respostas

### Superado em relação à continuidade antiga

- dúvida sobre documentos ativos ainda “pendentes”
- dúvida sobre embeddings faltando no corpus ativo
- narrativa de ambiente remoto incompleto como se fosse o estado presente do corpus

---

## 8. Recomendação objetiva

### Fechar agora

1. remover ou justificar formalmente `users`, `posts` e `comments`
2. documentar melhor o modelo de acesso do `chat_response_cache`
3. fechar a governança do cache de respostas com telemetria de `cache hit`

### Não tratar mais como pendência central

- prontidão básica do corpus ativo
- cobertura mínima de embeddings no corpus em produção

---

## 9. Conclusão final

**Corpus:** operacionalmente fechado.  
**Supabase remoto:** ainda pendente de limpeza e explicitação final de governança.

Essa distinção é importante:

- o problema principal do projeto já não está no corpus ativo
- o problema restante está em governança, limpeza estrutural e observabilidade
