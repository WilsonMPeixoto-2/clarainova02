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
- Frente imediata mais importante: redefinir o BLOCO 5 como trilha de excelência do RAG, com benchmark canônico, retrieval governado por metadados reais e fidelidade mais nativa entre `Direto` e `Didático`
- Ordem de execução atualmente aceita:
  1. abrir o `5A` com benchmark canônico e gate de regressão do RAG
  2. fazer o retrieval usar explicitamente `scope_instance`, `escopo_usuario` e `module_tags`
  3. endurecer o source-target routing contra overboost sem perder a vitória da fonte nomeada
  4. consolidar a fidelidade entre `Direto` e `Didático`, depois transparência editorial no frontend, e só então seguir com novas expansões de corpus

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
- Estado atual: política canônica de curadoria, manifesto do corpus, núcleo local, `COBERTURA_P2`, `APOIO_P3`, source-target routing e a nova rodada de UX do chat já integrados em `main` e publicados em produção
- Subfrentes canônicas:
  - `5A` benchmark e gate de regressão
  - `5B` retrieval governado por metadados reais
  - `5C` source-target routing de alta precisão
  - `5D` arquitetura da resposta e fidelidade entre modos
  - `5E` UX grounded e transparência editorial
  - `5F` operação contínua do corpus
- Próxima ação: abrir o `5A` com bateria fixa por categoria e critérios mínimos de aceite antes de novas mudanças de retrieval e resposta

### Bloco 6 — Acessibilidade, hotspots e testes de sustentação
- Estado: `planned`
- Objetivo: reduzir dívida invisível de UX, manutenção e regressão
- Próxima ação: revisar menu móvel, superfícies dialogais, hotspots de arquivos grandes e cobertura de testes em áreas sensíveis

## Regra para mudança de prioridade
Se qualquer ferramenta precisar pular a ordem acima, a mudança só é válida quando:
- a divergência for explicada em `docs/operational-reports/`
- `docs/HANDOFF.md` e `.continuity/current-state.json` refletirem a nova decisão
- o motivo do desvio estiver registrado também em `docs/REMOTE_STATE.md` quando envolver ambiente remoto
