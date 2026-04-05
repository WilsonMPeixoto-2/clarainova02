# Plano Canônico de Blocos — CLARAINOVA02

## Finalidade
Este arquivo define a ordem oficial de execução do trabalho, as dependências entre blocos e o ponto exato em que uma nova frente pode começar sem gerar retrabalho, looping ou leituras divergentes entre máquinas e ferramentas.

## Regras de execução
- `origin/main` continua sendo a única verdade oficial integrada.
- Nenhum bloco novo deve começar como frente principal enquanto o bloco anterior estiver `in_progress`, `in_review` ou `blocked` sem registro explícito de mudança de prioridade.
- Toda mudança remota relevante em GitHub, Supabase ou Vercel deve atualizar também `docs/REMOTE_STATE.md` e um relatório em `docs/operational-reports/`.
- Se uma branch de bloco depender de outra PR ainda aberta, essa dependência precisa ficar documentada aqui antes de qualquer continuação.

## Linha mestra atual
- Fonte oficial integrada: `origin/main @ 6770c85d62dd8d01fa1b7324fac03a88bdb6d099`
- Frente imediata mais importante: executar a trilha prioritária refinada `R3B-R6B` dentro do BLOCO 5 antes de retomar os subblocos canônicos `5B-5F`, agora já com `R0-R2` publicados, a regressão pós-publicação corrigida e o `R3A` publicado em produção
- Ordem de execução atualmente aceita:
  1. executar `R0` com benchmark canônico congelado, baseline reproduzível e gate local do RAG em `Direto` e `Didático`
  2. executar `R1` com ajustes imediatos de geração sem reingestão: `thinkingLevel`, temperatura dinâmica, `maxOutputTokens` maior, roteamento de modelo e expansão de query com contexto curto
  3. executar `R2` com correção do contrato de `gemini-embedding-2-preview`, usando instruções textuais assimétricas por tarefa e prefixo de domínio institucional
  4. executar `R3A` com resiliência conversacional para follow-ups anafóricos, contextualizando retrieval com a última resposta estruturada da CLARA
  5. executar `R3B` com observabilidade por estágio e budget real de timeout
  6. executar `R3C` com telemetria do tamanho do prompt e do histórico enviado
  7. executar `R4A` com feedback explícito do usuário vinculado ao `request_id`
  8. executar `R4B` com dashboard admin de gaps de conteúdo e perguntas sem cobertura
  9. executar `R5A`, `R5B` e `R5C` com batch embedding nativo, cache de embeddings e validação de frescor do corpus
  10. executar `R6A` e `R6B` como experimentos benchmarkados de chunking, dimensionalidade e eventual context caching explícito
  11. só então retomar `5B`, `5C`, `5D`, `5E` e `5F` com a régua fixa já estabilizada

## Blocos oficiais

| Ordem | Bloco | Status | Dependências | Entrada | Saída |
|---|---|---|---|---|---|
| 0 | Continuidade e automação mínima | `integrated` | `origin/main` | necessidade de consolidar o protocolo no repositório oficial | continuidade oficial integrada em `main` |
| 1 | Certificação operacional do ambiente real | `integrated` | Bloco 0 integrado | baseline estável e Supabase/Vercel apontando para o projeto oficial | login provisionado real, upload real, grounding real e produção publicada |
| 2 | Polimento institucional, presença pública e observabilidade enxuta | `integrated` | Bloco 1 integrado | produto já operacional nas frentes centrais | camada institucional, OG/PWA, PDF e métricas agregadas fortalecidos em `main` |
| 3 | Hardening Supabase, RLS e JWT administrativo | `ready_to_integrate` | Bloco 2 integrado | produto operando com conta provisionada e functions administrativas ainda permissivas | policies públicas fechadas, JWT de borda endurecido e estado remoto/documental alinhado |
| 4 | Consolidação operacional externa | `residual_check` | Bloco 3 estabilizado | camada interna segura e previsível | Google OAuth funcional, Gemini saneado, contrato Gemini alinhado no código, smoke test real concluído e deduplicação validada também via UI |
| 5 | Excelência do RAG, retrieval governado e fidelidade do sistema de perguntas e respostas | `in_progress` | Bloco 4 suficientemente estável | operação externa previsível, corpus governado ativo e baseline remoto publicado | benchmark canônico, retrieval governado por metadados, source-target seguro, modos de resposta mais distintos e UX grounded mais transparente |
| 6 | Acessibilidade, hotspots e testes de sustentação | `planned` | Bloco 5 em trilha segura | segurança, OAuth/Gemini e corpus já suficientemente estáveis | menu móvel, modais, hotspots de manutenção e cobertura de testes mais robustos |

## Próxima ação por bloco

### Bloco 0 — Continuidade e automação mínima
- Estado: `integrated`
- Resultado: protocolo, handoff, estado estruturado e automações já fazem parte do baseline oficial em `main`

### Bloco 1 — Certificação operacional do ambiente real
- Estado: `integrated`
- Resultado: ambiente real provado com conta provisionada, upload real, grounding real e produção publicada
- Observação: Google OAuth e embeddings reais continuam como pendências externas específicas, não como invalidação do baseline operacional

### Bloco 2 — Polimento institucional, presença pública e observabilidade enxuta
- Estado: `integrated`
- Resultado: termos, privacidade, OG/PWA, PDF e métricas agregadas fortalecidos em `main`

### Bloco 3 — Hardening Supabase, RLS e JWT administrativo
- Estado: `integrated`
- Branch associada: `main`
- Resultado: cadeia canônica de migrations e endurecimento administrativo já incorporados na linha principal
- Pendências conhecidas:
  - `embed-chunks` e `get-usage-stats` já foram republicadas com `verify_jwt` endurecido
  - a execução do BLOCO 4 continua dependente de configuração externa no Supabase/Google

### Bloco 4 — Consolidação operacional externa
- Estado: `residual_check`
- Objetivo: eliminar bloqueios externos que impedem operação previsível e alinhar o código ao contrato Gemini realmente adotado
- Subetapa concluída: `4B — Verificação remota do corpus e smoke test grounded`
- Subetapa atual: `4C — Deduplicação, paralelismo e testes do pipeline de ingestão`
- Estado do 4C: implementação publicada em `main`, com deduplicação legada corrigida, refinamentos paralelos do painel do chat, uplift paralelo do RAG e correção de scroll/diferença entre modos do chat já incorporados; falta apenas a prova residual de reupload controlado na UI
- Próxima ação: manter a prova residual de deduplicação na fila operacional, sem bloquear a consolidação do corpus local já ativo

### Bloco 5 — Excelência do RAG, retrieval governado e fidelidade do sistema de perguntas e respostas
- Estado: `in_progress`
- Objetivo: transformar a CLARA de funcional e grounded em previsivelmente excelente na recuperação, geração e explicação da própria confiança
- Estado atual: política canônica de curadoria, manifesto do corpus, núcleo local, `COBERTURA_P2`, `APOIO_P3`, source-target routing e a nova rodada de UX do chat já integrados em `main` e publicados em produção; em `2026-04-05`, a execução foi reordenada para abrir uma trilha imediata `R0-R6` antes da continuação dos subblocos canônicos. Nesta mesma rodada, `R0-R2` foram publicados, a regressão pós-publicação de `Q8`/`Q10` foi corrigida, o benchmark canônico remoto voltou a green e o `R3A` foi publicado em produção com benchmark remoto green
- Subfrentes canônicas:
  - `5A` benchmark e gate de regressão
  - `5B` retrieval governado por metadados reais
  - `5C` source-target routing de alta precisão
  - `5D` arquitetura da resposta e fidelidade entre modos
  - `5E` UX grounded e transparência editorial
  - `5F` operação contínua do corpus
- Trilha imediata priorizada:
  - `R0` baseline canônico e gate local do benchmark
  - `R1` ajustes imediatos de geração
  - `R2` contrato de embeddings alinhado ao Embeddings 2
  - `R3A` follow-up contextualizado no retrieval
  - `R3B` observabilidade por estágio e budget de timeout
  - `R3C` telemetria de tamanho de prompt
  - `R4A` feedback explícito do usuário
  - `R4B` dashboard admin de gaps
  - `R5A` batch embedding e re-embed controlado
  - `R5B` cache de embeddings
  - `R5C` validação de frescor do corpus
  - `R6A` experimento de chunking e dimensionalidade
  - `R6B` avaliação de context caching explícito
  - `R7` retorno aos subblocos `5B-5F` e roadmap alto esforço depois disso
- Próxima ação: abrir o `R3B` com observabilidade por estágio e budget de timeout, mantendo o `R3A` como baseline de follow-up contextualizado já publicado e benchmarkado

### Bloco 6 — Acessibilidade, hotspots e testes de sustentação
- Estado: `planned`
- Objetivo: reduzir dívida invisível de UX, manutenção e regressão
- Próxima ação: revisar menu móvel, superfícies dialogais, hotspots de arquivos grandes e cobertura de testes em áreas sensíveis

## Regra para mudança de prioridade
Se qualquer ferramenta precisar pular a ordem acima, a mudança só é válida quando:
- a divergência for explicada em `docs/operational-reports/`
- `docs/HANDOFF.md` e `.continuity/current-state.json` refletirem a nova decisão
- o motivo do desvio estiver registrado também em `docs/REMOTE_STATE.md` quando envolver ambiente remoto
