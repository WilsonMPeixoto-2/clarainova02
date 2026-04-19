# Governanca do Chat Response Cache

Ultima atualizacao: `2026-04-19`

## Escopo

Este documento define o contrato operacional do `chat_response_cache`, usado pela Edge Function `supabase/functions/chat/index.ts` para reaproveitar respostas estruturadas completas da CLARA.

O cache existe para reduzir latencia e custo em perguntas repetidas, sem mudar o contrato de resposta do frontend.

## O que entra no cache

Apenas respostas:

- estruturadas
- completas
- validadas pelo schema `claraStructuredResponseSchema`
- retornadas pelo caminho principal do chat

Nao entram no cache:

- respostas em `stream`
- caminhos de erro
- respostas bloqueadas por guardrail

## Contrato atual

- TTL: `24 horas`
- versao explicita do contrato: `2026-04-19-r1-structured-response-v1`
- constante de versao: `CHAT_RESPONSE_CACHE_CONTRACT_VERSION`
- arquivo-fonte: `supabase/functions/chat/response-cache.ts`

## Chave de cache

A chave e derivada de:

1. versao do contrato de cache
2. `responseMode`
3. historico completo da conversa, com `role` + `content`
4. normalizacao textual (`NFKC`, colapso de espacos, trim, lowercase)

Detalhe importante:

- desde `2026-04-19`, o helper normaliza cada conteudo antes da concatenacao final
- isso evita que espacos lideres ou variacoes cosmeticas mudem a hash desnecessariamente

## Regras de validade

Uma entrada so pode ser servida quando:

- a linha existir
- `expires_at` ainda estiver valido
- `response_payload` passar novamente pelo `claraStructuredResponseSchema`

Se o payload estiver invalido, o runtime ignora a linha e segue o fluxo normal de geracao.

## Invalidações obrigatorias

E necessario fazer bump de `CHAT_RESPONSE_CACHE_CONTRACT_VERSION` quando houver mudanca material em qualquer um destes pontos:

- schema da resposta estruturada
- semantica dos modos `direto` e `didatico`
- regras editoriais que alterem a forma esperada da resposta
- regras de leakage repair ou sanitizacao que mudem a resposta final
- governanca de retrieval, hierarquia de fontes ou politica de grounding
- mudancas de prompt que alterem o contrato semantico da resposta

Nao e necessario invalidar o cache por:

- ajustes puramente cosmeticos no frontend
- refactors internos sem alteracao do payload final
- cambios de observabilidade sem efeito no conteudo servido

## Telemetria e observabilidade

Estado atual apos o fechamento de `2026-04-19`:

- `cache hit` agora passa por `recordTelemetry`
- `chat_metrics.metadata_json` recebe:
  - `response_cache_status`
  - `response_cache_contract_version`
- `usage_logs` registra:
  - `chat_message` com metadados de cache
  - `response_cache_hit` em hits
  - `response_cache_store_failed` quando o upsert falha

Convencoes atuais:

- `response_cache_status = 'hit'` para resposta servida do cache
- `response_cache_status = 'miss'` para resposta gerada sem reaproveitamento
- `model_name = 'response_cache_hit'` nas linhas de `chat_metrics` servidas diretamente do cache

## Modelo de acesso

O acesso continua restrito ao backend:

- `RLS` habilitado
- `REVOKE ALL` para `anon` e `authenticated`
- `GRANT ALL` para `service_role`

Esse modelo e compativel com uso exclusivo via Edge Function.

## Limites conhecidos

- o cache ainda nao persiste `contract_version` em coluna propria; a versao vale pela chave e pela telemetria
- a invalidação principal continua sendo por bump de versao
- o corpus remoto pode evoluir sem invalidar automaticamente linhas antigas; quando a mudanca de corpus alterar o contrato semantico esperado, o bump manual continua sendo a acao correta

## Regra pratica de manutencao

Antes de deployar mudancas que alterem o significado das respostas:

1. avaliar se a resposta antiga ainda e segura
2. se nao for, atualizar `CHAT_RESPONSE_CACHE_CONTRACT_VERSION`
3. registrar a razao no relatorio operacional da rodada
4. observar `chat_metrics` e `usage_logs` apos o deploy
