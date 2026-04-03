# Plano Canônico de Blocos — CLARAINOVA02

## Finalidade
Este arquivo define a ordem oficial de execução do trabalho, as dependências entre blocos e o ponto exato em que uma nova frente pode começar sem gerar retrabalho, looping ou leituras divergentes entre máquinas e ferramentas.

## Regras de execução
- `origin/main` continua sendo a única verdade oficial integrada.
- Nenhum bloco novo deve começar como frente principal enquanto o bloco anterior estiver `in_progress`, `in_review` ou `blocked` sem registro explícito de mudança de prioridade.
- Toda mudança remota relevante em GitHub, Supabase ou Vercel deve atualizar também `docs/REMOTE_STATE.md` e um relatório em `docs/operational-reports/`.
- Se uma branch de bloco depender de outra PR ainda aberta, essa dependência precisa ficar documentada aqui antes de qualquer continuação.

## Linha mestra atual
- Fonte oficial integrada: `origin/main @ b74ea1167bf24d3cb8d66aac68813ad4cd51ceb5`
- Frente imediata mais importante: concluir a subetapa 4A para alinhar o código ao contrato Gemini novo e só então partir para o smoke test remoto
- Ordem de execução atualmente aceita:
  1. alinhar o código ao contrato Gemini/embedding real e validar localmente
  2. verificar corpus remoto e executar smoke test com 1 PDF + perguntas grounded
  3. depois formar corpus curado e medir o RAG real
  4. por fim atacar acessibilidade, hotspots e testes de sustentação

## Blocos oficiais

| Ordem | Bloco | Status | Dependências | Entrada | Saída |
|---|---|---|---|---|---|
| 0 | Continuidade e automação mínima | `integrated` | `origin/main` | necessidade de consolidar o protocolo no repositório oficial | continuidade oficial integrada em `main` |
| 1 | Certificação operacional do ambiente real | `integrated` | Bloco 0 integrado | baseline estável e Supabase/Vercel apontando para o projeto oficial | login provisionado real, upload real, grounding real e produção publicada |
| 2 | Polimento institucional, presença pública e observabilidade enxuta | `integrated` | Bloco 1 integrado | produto já operacional nas frentes centrais | camada institucional, OG/PWA, PDF e métricas agregadas fortalecidos em `main` |
| 3 | Hardening Supabase, RLS e JWT administrativo | `ready_to_integrate` | Bloco 2 integrado | produto operando com conta provisionada e functions administrativas ainda permissivas | policies públicas fechadas, JWT de borda endurecido e estado remoto/documental alinhado |
| 4 | Consolidação operacional externa | `in_progress` | Bloco 3 estabilizado | camada interna segura e previsível | Google OAuth funcional, Gemini saneado, contrato Gemini alinhado no código e embeddings reais reprocessados |
| 5 | Corpus inicial real e prova empírica do RAG | `planned` | Bloco 4 integrado | operação externa previsível e sem bloqueio crítico | lote curado carregado, perguntas reais classificadas e cobertura medida |
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
- Estado: `in_progress`
- Objetivo: eliminar bloqueios externos que impedem operação previsível e alinhar o código ao contrato Gemini realmente adotado
- Subetapa atual: `4A — Alinhamento Gemini e contrato de embedding`
- Próxima ação: verificar o estado real do corpus remoto, decidir re-embed/limpeza de legado e executar o smoke test remoto registrado em `docs/operational-reports/2026-04-03-block-4a-gemini-embedding-contract.md`

### Bloco 5 — Corpus inicial real e prova empírica do RAG
- Estado: `planned`
- Objetivo: transformar a CLARA de tecnicamente pronta em documentalmente confiável
- Próxima ação: montar lote curado de 5–10 PDFs, carregar por prioridade e medir perguntas reais antes de mexer em retrieval

### Bloco 6 — Acessibilidade, hotspots e testes de sustentação
- Estado: `planned`
- Objetivo: reduzir dívida invisível de UX, manutenção e regressão
- Próxima ação: revisar menu móvel, superfícies dialogais, hotspots de arquivos grandes e cobertura de testes em áreas sensíveis

## Regra para mudança de prioridade
Se qualquer ferramenta precisar pular a ordem acima, a mudança só é válida quando:
- a divergência for explicada em `docs/operational-reports/`
- `docs/HANDOFF.md` e `.continuity/current-state.json` refletirem a nova decisão
- o motivo do desvio estiver registrado também em `docs/REMOTE_STATE.md` quando envolver ambiente remoto
