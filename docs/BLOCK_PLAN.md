# Plano Canônico de Blocos — CLARAINOVA02

## Finalidade
Este arquivo define a ordem oficial de execução do trabalho, as dependências entre blocos e o ponto exato em que uma nova frente pode começar sem gerar retrabalho, looping ou leituras divergentes entre máquinas e ferramentas.

## Regras de execução
- `origin/main` continua sendo a única verdade oficial integrada.
- Nenhum bloco novo deve começar como frente principal enquanto o bloco anterior estiver `in_progress`, `in_review` ou `blocked` sem registro explícito de mudança de prioridade.
- Toda mudança remota relevante em GitHub, Supabase ou Vercel deve atualizar também `docs/REMOTE_STATE.md` e um relatório em `docs/operational-reports/`.
- Se uma branch de bloco depender de outra PR ainda aberta, essa dependência precisa ficar documentada aqui antes de qualquer continuação.

## Linha mestra atual
- Fonte oficial integrada: `origin/main @ 5c59b2169afff642871747b166286a43fc1348ea`
- Frente imediata mais importante: consolidar o núcleo local do corpus SEI.Rio já ativo em produção, substituir o Decreto 55.615 parcial e ampliar a avaliação empírica do RAG antes de abrir a camada PEN
- Ordem de execução atualmente aceita:
  1. manter o núcleo local ativo e corrigir lacunas documentais críticas
  2. ampliar a bateria de perguntas reais e rubricar a qualidade do RAG
  3. só então decidir a ingestão da cobertura PEN com precedência inferior
  4. por fim atacar acessibilidade, hotspots e testes de sustentação

## Blocos oficiais

| Ordem | Bloco | Status | Dependências | Entrada | Saída |
|---|---|---|---|---|---|
| 0 | Continuidade e automação mínima | `integrated` | `origin/main` | necessidade de consolidar o protocolo no repositório oficial | continuidade oficial integrada em `main` |
| 1 | Certificação operacional do ambiente real | `integrated` | Bloco 0 integrado | baseline estável e Supabase/Vercel apontando para o projeto oficial | login provisionado real, upload real, grounding real e produção publicada |
| 2 | Polimento institucional, presença pública e observabilidade enxuta | `integrated` | Bloco 1 integrado | produto já operacional nas frentes centrais | camada institucional, OG/PWA, PDF e métricas agregadas fortalecidos em `main` |
| 3 | Hardening Supabase, RLS e JWT administrativo | `ready_to_integrate` | Bloco 2 integrado | produto operando com conta provisionada e functions administrativas ainda permissivas | policies públicas fechadas, JWT de borda endurecido e estado remoto/documental alinhado |
| 4 | Consolidação operacional externa | `residual_check` | Bloco 3 estabilizado | camada interna segura e previsível | Google OAuth funcional, Gemini saneado, contrato Gemini alinhado no código, smoke test real concluído e deduplicação validada também via UI |
| 5 | Corpus inicial real e prova empírica do RAG | `in_progress` | Bloco 4 suficientemente estável | operação externa previsível e sem bloqueio crítico | lote curado carregado, perguntas reais classificadas e cobertura medida |
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
- Estado do 4C: implementação publicada em `main`, com deduplicação legada corrigida, refinamentos paralelos do painel do chat e uplift paralelo do RAG já incorporados; falta apenas a prova residual de reupload controlado na UI
- Próxima ação: manter a prova residual de deduplicação na fila operacional, sem bloquear a consolidação do corpus local já ativo

### Bloco 5 — Corpus inicial real e prova empírica do RAG
- Estado: `in_progress`
- Objetivo: transformar a CLARA de tecnicamente pronta em documentalmente confiável
- Estado atual: política canônica de curadoria, manifesto do corpus, staging por camadas e batch 1 do SEI.Rio já integrados em `main` e publicados em produção
- Próxima ação: substituir o Decreto Rio nº 55.615/2025 por captura íntegra oficial, ampliar a bateria de perguntas reais para `15–20` itens e só então decidir a entrada da camada `COBERTURA_P2`

### Bloco 6 — Acessibilidade, hotspots e testes de sustentação
- Estado: `planned`
- Objetivo: reduzir dívida invisível de UX, manutenção e regressão
- Próxima ação: revisar menu móvel, superfícies dialogais, hotspots de arquivos grandes e cobertura de testes em áreas sensíveis

## Regra para mudança de prioridade
Se qualquer ferramenta precisar pular a ordem acima, a mudança só é válida quando:
- a divergência for explicada em `docs/operational-reports/`
- `docs/HANDOFF.md` e `.continuity/current-state.json` refletirem a nova decisão
- o motivo do desvio estiver registrado também em `docs/REMOTE_STATE.md` quando envolver ambiente remoto
