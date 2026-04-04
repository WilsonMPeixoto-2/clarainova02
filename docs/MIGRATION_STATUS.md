# Status da Migracao e Operacao — Linha Principal Reconciliada

Ultima atualizacao: 2026-04-04

## Resumo executivo

| Frente | Status |
|---|---|
| Baseline local/github | Sincronizado em `main` |
| Vinculo real entre frontend e Supabase | Comprovado |
| Login administrativo real | Comprovado com conta provisionada |
| Login administrativo com Google | Pendente no ambiente real |
| Upload e processamento de PDF real | Comprovado |
| Deduplicacao legada por `document_hash` | Publicada |
| Corpus governado (`núcleo`, `cobertura`, `apoio`) | Ativo |
| Source-target routing | Publicado |
| Producao refletindo o baseline atual | Publicada |

**A linha principal saiu do estágio de certificação básica e passou para uma operação governada de corpus/RAG: corpus auditado, retrieval em dois estágios, avaliação `16/16` e baseline remoto reconciliado com `main`.**

## Nota operacional recente

Em 2026-04-04, `origin/main` recebeu o commit `17de564` com source-target routing e auditoria do corpus remoto:

- recuperação em dois estágios (`hybrid_search_chunks` + `fetch_targeted_chunks`)
- detecção explícita de fonte nomeada em perguntas como `segundo a nota oficial`, `segundo a wiki`, `segundo a UFSCar` e `conforme o manual do PEN`
- boost e reserva de slots para a fonte-alvo detectada
- guia legado de `88` chunks promovido a `NUCLEO_P1`
- versão governada menor desativada
- `MODELO_DE_OFICIO_PDDE.pdf` desativado
- `topic_scope` do Termo de Uso corrigido para `sei_rio_termo`

Em seguida, a avaliação batch 3 registrou:

- `16/16` respostas `HTTP 200`
- `16/16` sem web fallback
- `16/16` com `answerScopeMatch = exact`
- `16/16` com `expectedAllMet = true`
- `16/16` com `finalConfidence = 1`

Na mesma data, `origin/main` também recebeu a rodada de UX do chat publicada no commit `52415a9`, já refletida em produção:

- o wheel scroll ficou contido no próprio painel do chat, evitando que o pano de fundo capture a rolagem
- o `responseMode` passou a ser preservado por mensagem
- o modo `Didático` ganhou camadas mais conscientes de leitura e deduplicação leve para reduzir repetição
- o estado de loading deixou de usar um ícone disforme e passou a usar um avatar derivado da imagem premium da CLARA
- o seletor `Direto` / `Didático` agora deixa o modo ativo mais legível de imediato
- a Edge Function remota `chat` já está na versão `22` com esse comportamento publicado
- o deploy de produção correspondente está `READY` em `dpl_A6oZ26Byyn8yFLjCzLgnEHrWYTNi`

Em 2026-04-04, a migration `20260404084500_refine_hybrid_search_for_governed_corpus.sql` foi aplicada remotamente via `supabase db query --linked` e registrada no histórico de `supabase_migrations.schema_migrations`.

Ela refinou `public.hybrid_search_chunks` para considerar:

- `documents.name`
- `documents.source_name`
- `documents.version_label`
- `document_chunks.section_title`

na fase keyword do ranking híbrido, além de alinhar a função aos novos `topic_scope` do corpus governado:

- `pen_manual_compativel`
- `pen_compatibilidade`
- `pen_release_note`
- `interface_update`

Na mesma rodada, o corpus ativo passou a incluir `COBERTURA_P2` do PEN e `APOIO_P3` versionado, e a avaliação ampliada do lote 3 registrou:

- `16/16` respostas `HTTP 200`
- `16/16` sem web fallback
- `15/16` com `answerScopeMatch = exact`
- `13/16` com a referência esperada explicitamente presente

O gap remanescente deixou de ser infraestrutura e passou a ser substituição do Decreto `55.615` por captura oficial íntegra, bateria manual ampliada e monitoramento fino do overboost do source-target routing.

Em 2026-04-04, `origin/main` recebeu um uplift paralelo do RAG já publicado em produção:

- expansão de query com LLM e média normalizada entre embeddings original e expandida
- aumento do `match_count` de `8` para `12`
- enriquecimento por chunks adjacentes em recuperações fortes
- prompt sensível à qualidade da recuperação
- `finalConfidence`, ambiguidades e avisos expostos no schema enviado ao Gemini
- chunking semântico com `sectionTitle`
- `rag_quality_score` e `expanded_query` na telemetria

Nuance importante: esse uplift também reintroduziu prefixo automático `[Fonte: ... | Página: ...]` em `chunk.content` para uploads futuros, substituindo a decisão anterior de manter o texto dos chunks estritamente limpo.

Em 2026-04-03, o `main` passou a refletir explicitamente o contrato Gemini efetivamente adotado no ambiente:

- geração com `gemini-3.1-flash-lite-preview` e fallback `gemini-3.1-pro-preview`
- embeddings com `gemini-embedding-2-preview`
- `taskType` explícito para query/documento
- normalização L2 em `768`
- chunks estruturados e metadados de embedding persistidos

Essa atualização já está integrada em `main` e publicada em produção. O BLOCO 4B foi concluído com um PDF real novo processado sob o contrato novo e grounding confirmado em produção.

Achados adicionais do BLOCO 4B:

- o corpus remoto atual não mistura silenciosamente gerações de embeddings
- existe apenas um documento legado com 2 chunks persistidos
- esses chunks continuam sem `embedding_model`, `embedding_dim`, `embedded_at` e sem embeddings persistidos
- o novo documento `SEI-Guia-do-usuario-Versao-final.pdf` já foi processado com `88/88` chunks e `88/88` embeddings usando `gemini-embedding-2-preview`
- o próximo passo deixa de ser provar o contrato novo e passa a ser endurecer o pipeline com deduplicação, paralelismo controlado e testes mínimos

O endurecimento do BLOCO 4C já não está mais em branch isolada: a deduplicação legada foi integrada em `main`, publicada em produção e resta apenas a prova residual por reupload controlado na UI admin.

## Memoria operacional e continuidade

Desde 2026-04-01, o repositorio passa a carregar uma trilha minima obrigatoria de continuidade no proprio Git:

- `docs/HANDOFF.md`
- `docs/BLOCK_PLAN.md`
- `docs/REMOTE_STATE.md`
- `.continuity/current-state.json`
- `.continuity/session-log.jsonl`
- `.continuity/UNIVERSAL_SESSION_PROMPT.md`
- `docs/operational-reports/`

Automacoes locais disponiveis:

- `npm run session:new`
- `npm run session:start`
- `npm run session:end`
- `npm run continuity:check`

Consequencia operacional:

- `origin/main` continua sendo a unica verdade oficial
- a ordem canônica dos blocos passa a ficar explícita em `docs/BLOCK_PLAN.md`
- o ambiente remoto oficial passa a ficar documentado em `docs/REMOTE_STATE.md`
- nenhuma sessao deve terminar apenas com trabalho local
- qualquer ajuste em Vercel ou Supabase precisa deixar rastro no repositorio no mesmo bloco de trabalho

---

## Projeto Supabase de referencia

- **Project ID:** `jasqctuzeznwdtbcuixn`
- **URL:** `https://jasqctuzeznwdtbcuixn.supabase.co`
- **Frontend em producao:** `https://clarainova02.vercel.app`

---

## Evidencias objetivas deste bloco

### 1. Frontend ligado ao Supabase correto

- O frontend em producao usa `VITE_SUPABASE_URL=https://jasqctuzeznwdtbcuixn.supabase.co`
- O frontend em producao usa `VITE_SUPABASE_PUBLISHABLE_KEY` do mesmo projeto
- O cliente web e `src/lib/chat-api.ts` agora sanitizam env vars com quebra de linha literal, evitando falso negativo de configuracao
- O chat publico em producao exibiu `Atendimento conectado`

### 2. Login administrativo real

- O acesso administrativo em producao foi provado com sessao valida e entrada real em `/admin`
- A conta provisionada usada para a validacao foi autenticada no Supabase Auth e recebeu sessao funcional
- O callback `/auth/callback` segue versionado e pronto para concluir a volta ao painel

### 3. Pipeline real com 1 PDF

- Documento validado: `MODELO_DE_OFICIO_PDDE.pdf`
- Documento criado no banco: `14f38de0-c2a0-4723-8a44-20426925547a`
- Status final do documento: `processed`
- Chunks persistidos no banco:
  - `30e95b0a-7268-4eae-8866-6e5dacb4c3bb`
  - `80ba1ec5-9561-47eb-bef5-828796338556`
- O painel administrativo em producao passou a mostrar o documento como `Pronto`

### 4. Chat grounded com base documental real

- Pergunta validada em producao: `Conciliação bancaria.`
- O frontend publico exibiu resposta estruturada com secao de referencias
- Referencia exibida no chat: `Base documental CLARA. MODELO_DE_OFICIO_PDDE.pdf. p. 1.`
- Telemetria registrada:
  - `search_metrics.request_id = eaef3a4f-71cd-44ca-b96a-36031cc5e1d6`
  - `chat_metrics.model_name = grounded_fallback`
  - `chat_metrics.used_rag = true`

### 5. Producao refletindo o baseline

- O projeto Vercel `clarainova02` foi relinkado ao clone limpo do repositorio
- Um novo deploy de producao foi publicado durante esta certificacao
- Alias ativo em producao: `https://clarainova02.vercel.app`

---

## Ajustes tecnicos feitos para viabilizar a certificacao

- Sanitizacao de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no cliente web e no `chat-api`
- Correcao da verificacao de integridade dos chunks no admin para conferir indices esperados, e nao apenas contagem bruta
- Atualizacao do pipeline admin para marcar `processed_at`, limpar falhas antigas e evitar falso positivo de documento completo
- Endurecimento da `embed-chunks` com autenticacao manual por token, execucao sequencial e retry para indisponibilidade do provedor
- Atualizacao do `chat` para:
  - usar modelo de embedding atual
  - aceitar fallback keyword-only quando a embedding da consulta falha
  - retornar resposta grounded estruturada quando o provedor generativo estiver indisponivel, mas as fontes tiverem sido recuperadas
- Correcao operacional do `get-usage-stats` e publicacao da funcao remota atualizada
- Ajuste do card de metricas para mostrar o mes correto em UTC e nao deslocado por timezone
- Ajuste da copia do login admin para nao prometer Google como fluxo ativo quando o ambiente ainda nao entrega isso

---

## Checklist do BLOCO 1

### Vinculo com Supabase

- [x] `.env` e env vars reais conferidas contra o projeto `jasqctuzeznwdtbcuixn`
- [x] `hasSupabaseConfig = true` em ambiente real
- [x] Projeto certo linkado no Supabase CLI

### Operacao administrativa

- [x] Login administrativo funcional com conta provisionada
- [x] `/admin` acessivel com sessao valida
- [x] `get-usage-stats` respondendo no ambiente real
- [ ] Login com Google concluido ponta a ponta

### Fluxo RAG completo

- [x] Upload de ao menos 1 PDF real
- [x] Registro do documento no banco
- [x] Persistencia de chunks em `document_chunks`
- [x] Chat grounded respondendo com referencias
- [ ] Embeddings persistidos para o PDF validado

### Producao

- [x] Env vars reais conferidas no Vercel
- [x] Novo deploy publicado
- [x] Producao refletindo o baseline atual

---

## Pendencias reais apos o BLOCO 1

### 1. Google OAuth do admin

O botao `Continuar com Google` foi testado em producao e o Supabase respondeu:

`Unsupported provider: provider is not enabled`

Isso significa que o frontend esta chamando o fluxo certo, mas o provedor Google ainda nao esta habilitado no projeto Supabase real.

### 2. Embeddings do documento validado

O PDF de prova percorreu upload, extracao, chunking e persistencia, mas os embeddings finais ficaram sujeitos a indisponibilidade do Gemini no ambiente real. O sistema agora degrada de forma segura, mas o corpus ainda precisa ser reprocessado quando a cota do provedor estiver normalizada.

### 3. Corpus inicial de producao

O BLOCO 1 provou a esteira com 1 documento real. Isso nao substitui a formacao do corpus inicial curado do produto.

---

## Validacoes executadas

- `npm test`
- `npm run build`
- `npm run validate`
- Validacao manual em producao via navegador:
  - login admin com sessao real
  - upload e processamento de PDF real
  - visualizacao do documento no painel
  - resposta grounded com referencias no chat publico

---

## Proximo bloco recomendado

**BLOCO 2 — Formacao do corpus inicial**

Depois de provar que o ambiente real funciona, o passo logico seguinte e trocar a base de teste por um conjunto pequeno, curado e confiavel de documentos aderentes ao SEI-Rio.

---

## Nota de andamento do BLOCO 2

Sem depender ainda do corpus real ou da estabilizacao do Gemini, o repositorio ja recebeu os primeiros ajustes de governanca operacional:

- a classificacao automatica ficou menos propensa a promover material administrativo comum para o nucleo oficial do SEI-Rio
- o admin passou a distinguir `chunks salvos` de `embeddings prontos`
- documentos com embeddings incompletos agora podem ficar em `embedding_pending`, em vez de parecerem `processed`
- a lista administrativa passou a exibir categoria do corpus, prioridade, autoridade e prontidao para grounding

Esses ajustes ja melhoram a honestidade operacional da ingestao, mas o BLOCO 2 so podera ser considerado fechado quando houver primeira carga curada real no Supabase.

---

## Nota de andamento do BLOCO C

A camada institucional publica do produto foi revisada para refletir melhor o estado real da CLARA:

- Termos de Uso agora deixam explicitos a natureza do projeto, os limites operacionais, o uso permitido da area administrativa e a ausencia de efeito vinculante das respostas
- Politica de Privacidade agora descreve armazenamento local no navegador, metricas agregadas, provedores envolvidos, retencao operacional e o fato de que imagens ainda nao sao recebidas no chat publico
- Metadados publicos passaram a identificar autoria e manutencao de forma menos generica

Essa frente ficou mais madura institucionalmente, mas ainda devera ser revisitada quando novas capacidades de entrada ou observabilidade forem publicadas.

---

## Nota de andamento do BLOCO D

A presenca publica da CLARA foi alinhada para reduzir a diferenca entre chat, PDF e compartilhamento externo:

- metadados publicos passaram a usar descricao mais aderente ao estado real do produto
- Open Graph e Twitter cards passaram a apontar para uma imagem social dedicada do projeto
- manifesto PWA foi revisado para reforcar naming, descricao e instalacao com identidade consistente
- a exportacao em PDF recebeu copy institucional e assinatura visual mais coerentes com a camada publica

Essa frente melhorou a apresentacao externa do produto sem depender de Google OAuth, corpus real ou estabilizacao do Gemini.

---

## Nota de andamento do BLOCO 4

O painel de metricas agregadas deixou de mostrar apenas volume bruto e passou a expor sinais mais proximos de saude do produto:

- respostas grounded no mes
- lacunas de cobertura sinalizadas em `query_analytics`
- respostas degradadas por status
- latencia media do atendimento
- temas mais recorrentes do periodo

Essa leitura continua agregada, sem identificar usuarios individualmente, mas melhora a capacidade de priorizar corpus, cobertura e estabilidade a partir do proprio uso da CLARA.

---

## Nota de andamento do BLOCO 3

A trilha de endurecimento de `Supabase` e `Edge Functions` foi retomada a partir do baseline oficial em `main`:

- `embed-chunks` e `get-usage-stats` foram republicadas no projeto oficial com `verify_jwt` endurecido na borda
- o `chat` permaneceu publico por decisao consciente

Verificacao remota adicional desta rodada:

- este ambiente passou a consultar o Postgres remoto oficial do projeto `jasqctuzeznwdtbcuixn`
- o banco remoto ja esta sem policies para `public`/`anon` em:
  - `ingestion_jobs`
  - `document_processing_events`
  - `chat_metrics`
  - `search_metrics`
  - `query_analytics`
- o modelo remoto usa `public.is_admin_user()` apoiada em `public.admin_users`
- o repositorio local foi reconciliado para usar a mesma cadeia canonica de migrations do remoto:
  - `20260328230351_clara_foundation_tables_and_indexes.sql`
  - `20260329001517_clara_rls_policies_and_search_functions.sql`
  - `20260329001619_clara_check_rate_limit_function.sql`
  - `20260401213217_harden_admin_authorization.sql`
- `supabase migration list` passou a alinhar completamente local e remoto
- `supabase db push --dry-run` agora retorna `Remote database is up to date`

Consequencia pratica:

- o endurecimento das functions administrativas ja avancou no ambiente remoto
- o estado remoto efetivo ja esta espelhado pela cadeia de migrations local desta branch
- a pendencia principal deixou de ser "hardening Supabase" e passou a ser "integrar esse estado em `main` e retomar a consolidacao operacional externa"

O BLOCO 3 pode ser considerado tecnicamente reconciliado nesta branch de sessao. O proximo passo e integrar esse hardening na linha principal e abrir a trilha de BLOCO 4.
