# Status da Migracao — BLOCO 1 Certificado

Ultima atualizacao: 2026-03-31

## Resumo executivo

| Frente | Status |
|---|---|
| Baseline local do repositorio | Verificada |
| Vinculo real entre frontend e Supabase | Comprovado |
| Login administrativo real | Comprovado com conta provisionada |
| Login administrativo com Google | Pendente no ambiente real |
| Upload e processamento de PDF real | Comprovado |
| Persistencia de documento e chunks | Comprovada |
| Chat grounded com base documental real | Comprovado |
| Producao refletindo o baseline atual | Publicada |

**O BLOCO 1 saiu do estado "apenas pronto no codigo" e passou para "operacionalmente provado" nas frentes centrais de ambiente, autenticacao administrativa por conta provisionada, ingestao real e resposta grounded em producao.**

## Nota operacional recente

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
