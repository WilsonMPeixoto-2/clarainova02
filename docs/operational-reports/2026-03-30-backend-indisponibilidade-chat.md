# Ajuste operacional — indisponibilidade do backend de chat

Data: 2026-03-30

## Contexto

Durante a preparacao do BLOCO 5, o endpoint produtivo do chat em `https://jasqctuzeznwdtbcuixn.supabase.co/functions/v1/chat` respondeu com erro e impediu a prova operacional do RAG.

Resposta observada em producao:

- status: `500`
- corpo: `Todos os modelos estão indisponíveis no momento. Tente novamente em alguns minutos.`

Tambem foi confirmado que:

- ainda nao existe corpus minimo real carregado;
- as tabelas operacionais publicas `ingestion_jobs`, `search_metrics`, `chat_metrics` e `query_analytics` estavam vazias no momento da verificacao;
- esta maquina nao possui autenticacao ativa da CLI do Supabase para publicar edge functions no projeto remoto.

## Objetivo do ajuste

Melhorar o tratamento operacional da indisponibilidade do provedor no backend do chat, sem alterar a lista de modelos configurada.

## Alteracoes realizadas

Arquivo alterado:

- `supabase/functions/chat/index.ts`

Mudancas aplicadas:

- classificacao explicita de falhas de disponibilidade do provedor/model fallback;
- resposta publica padronizada para indisponibilidade temporaria do atendimento;
- retorno `503` em casos de indisponibilidade do provedor ou configuracao ausente, em vez de `500` generico;
- enriquecimento do rastreio interno com `attempted_models` e distinção entre `provider_unavailable` e `model_fallback_failed`.

## O que nao foi alterado

- a lista de modelos da API permaneceu intacta;
- nao houve mudanca na estrategia de resposta `Direto / Didatico`;
- nao houve alteracao no frontend;
- nao houve ingestao de corpus.

## Validacao local

- `npm run validate` passou completo
- `deno check` nao pôde ser executado porque `deno` nao esta instalado nesta maquina

## Pendencia para producao

Este ajuste ainda precisa ser publicado no Supabase remoto para surtir efeito em producao.

Bloqueio atual:

- a CLI do Supabase nesta maquina nao esta autenticada, entao `supabase functions deploy chat` nao pode ser executado daqui neste momento.
