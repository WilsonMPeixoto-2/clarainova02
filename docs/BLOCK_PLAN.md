# Plano Canônico de Blocos — CLARAINOVA02

## Finalidade
Este arquivo define a ordem oficial de execução do trabalho, as dependências entre blocos e o ponto exato em que uma nova frente pode começar sem gerar retrabalho, looping ou leituras divergentes entre máquinas e ferramentas.

## Regras de execução
- `origin/main` continua sendo a única verdade oficial integrada.
- Nenhum bloco novo deve começar como frente principal enquanto o bloco anterior estiver `in_progress`, `in_review` ou `blocked` sem registro explícito de mudança de prioridade.
- Toda mudança remota relevante em GitHub, Supabase ou Vercel deve atualizar também `docs/REMOTE_STATE.md` e um relatório em `docs/operational-reports/`.
- Se uma branch de bloco depender de outra PR ainda aberta, essa dependência precisa ficar documentada aqui antes de qualquer continuação.

## Linha mestra atual
- Fonte oficial integrada: `origin/main @ 94677b6a6ec6aed8ab217fe5c2298ddd4c163322`
- Frente imediata mais importante: atualizar a PR `#13` sobre a nova `main` e revisar os riscos técnicos antes do merge
- Ordem de integração atualmente aceita:
  1. atualizar/rebasear a PR `#13` de RLS sobre a nova `main`
  2. corrigir o bug do `/admin` e revisar a estratégia de reconciliação de migrations
  3. só então retomar blocos de produto, acessibilidade ou operação externa

## Blocos oficiais

| Ordem | Bloco | Status | Dependências | Entrada | Saída |
|---|---|---|---|---|---|
| 0 | Continuidade e automação mínima | `integrated` | `origin/main` | necessidade de consolidar o protocolo no repositório oficial | continuidade oficial integrada em `main` |
| 1 | RLS, auth admin e reconciliação operacional | `in_review` | Bloco 0 integrado | Continuidade já oficial em `main` | PR `#13` atualizada, bug de `/admin` corrigido e estratégia de migrations aceita conscientemente |
| 2 | Acessibilidade e robustez de navegação | `planned` | Bloco 1 integrado | Auth admin e superfícies dialogais estáveis | menu móvel, chat e modais sem ruído na árvore de acessibilidade |
| 3 | Consolidação operacional externa | `planned` | Bloco 2 integrado | Fluxo interno estável para validar operação real | Google OAuth funcional, Gemini saneado e prova de embeddings reais executada |
| 4 | Corpus inicial real e prova empírica do RAG | `planned` | Bloco 3 integrado | Operação externa previsível e sem bloqueio crítico | lote inicial curado carregado, 20 perguntas classificadas e cobertura medida |

## Próxima ação por bloco

### Bloco 0 — Continuidade e automação mínima
- Estado: `integrated`
- Branch/PR associada: `session/2026-04-01/C04-084/CODEX/BLOCO-0-CONTINUIDADE` / PR `#12`
- Resultado: PR `#12` mergeada em `main` no commit `94677b6a6ec6aed8ab217fe5c2298ddd4c163322`
- Observação: `docs/BLOCK_PLAN.md` e `docs/REMOTE_STATE.md` já fazem parte do baseline oficial

### Bloco 1 — RLS, auth admin e reconciliação operacional
- Estado: `in_review`
- Branch/PR associada: `session/2026-04-01/C04-084/CODEX/BLOCO-1-RLS` / PR `#13`
- Próxima ação: validar o `/admin` com contas reais e revisar a estratégia de reconciliação das migrations antes de decidir o merge
- Pendências conhecidas:
  - validar o fluxo do `/admin` com conta admin real e conta autenticada sem permissão
  - documentar e aceitar explicitamente a estratégia de reconciliação das migrations consolidadas
  - garantir que a PR `#13` aponte para `main` no GitHub após o rebase

### Fase 2 — Acessibilidade e robustez de navegação
- Estado: `planned`
- Objetivo: corrigir problemas reais de UX/a11y antes que virem dívida invisível
- Próxima ação: desmontar o menu móvel quando fechado ou aplicar `inert` + focus trap robusto; depois revisar chat e demais superfícies dialogais

### Fase 3 — Consolidação operacional externa
- Estado: `planned`
- Objetivo: eliminar bloqueios externos que impedem operação previsível
- Próxima ação: habilitar Google OAuth no Supabase, sanear quota/projeto/chave/modelo do Gemini e reprocessar um documento de prova com embeddings reais

### Fase 4 — Corpus inicial real e prova empírica do RAG
- Estado: `planned`
- Objetivo: transformar a CLARA de tecnicamente pronta em documentalmente confiável
- Próxima ação: montar lote curado de 5–10 PDFs, carregar por prioridade e medir 20 perguntas reais antes de mexer em thresholds ou retrieval

## Regra para mudança de prioridade
Se qualquer ferramenta precisar pular a ordem acima, a mudança só é válida quando:
- a divergência for explicada em `docs/operational-reports/`
- `docs/HANDOFF.md` e `.continuity/current-state.json` refletirem a nova decisão
- o motivo do desvio estiver registrado também em `docs/REMOTE_STATE.md` quando envolver ambiente remoto
