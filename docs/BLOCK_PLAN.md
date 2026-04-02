# Plano Canônico de Blocos — CLARAINOVA02

## Finalidade
Este arquivo define a ordem oficial de execução do trabalho, as dependências entre blocos e o ponto exato em que uma nova frente pode começar sem gerar retrabalho, looping ou leituras divergentes entre máquinas e ferramentas.

## Regras de execução
- `origin/main` continua sendo a única verdade oficial integrada.
- Nenhum bloco novo deve começar como frente principal enquanto o bloco anterior estiver `in_progress`, `in_review` ou `blocked` sem registro explícito de mudança de prioridade.
- Toda mudança remota relevante em GitHub, Supabase ou Vercel deve atualizar também `docs/REMOTE_STATE.md` e um relatório em `docs/operational-reports/`.
- Se uma branch de bloco depender de outra PR ainda aberta, essa dependência precisa ficar documentada aqui antes de qualquer continuação.

## Linha mestra atual
- Fonte oficial integrada: `origin/main @ 86d3c18c8d95b0ad8f518863ac75da66a7826b55`
- Frente imediata mais importante: reconciliar no repositório o hardening já existente no Supabase oficial sem quebrar a conta provisionada já usada no admin
- Ordem de execução atualmente aceita:
  1. confirmar no banco remoto o estado efetivo de `RLS` e das policies administrativas
  2. endurecer `verify_jwt` em `embed-chunks` e `get-usage-stats`
  3. versionar o contrato de `admin_users` / `is_admin_user()` ou reconciliar a cadeia de migrations antes de qualquer `db push`
  4. só então avançar para Google OAuth, Gemini e corpus real

## Blocos oficiais

| Ordem | Bloco | Status | Dependências | Entrada | Saída |
|---|---|---|---|---|---|
| 0 | Continuidade e automação mínima | `integrated` | `origin/main` | necessidade de consolidar o protocolo no repositório oficial | continuidade oficial integrada em `main` |
| 1 | Certificação operacional do ambiente real | `integrated` | Bloco 0 integrado | baseline estável e Supabase/Vercel apontando para o projeto oficial | login provisionado real, upload real, grounding real e produção publicada |
| 2 | Polimento institucional, presença pública e observabilidade enxuta | `integrated` | Bloco 1 integrado | produto já operacional nas frentes centrais | camada institucional, OG/PWA, PDF e métricas agregadas fortalecidos em `main` |
| 3 | Hardening Supabase, RLS e JWT administrativo | `in_progress` | Bloco 2 integrado | produto operando com conta provisionada e functions administrativas ainda permissivas | policies públicas fechadas, JWT de borda endurecido e estado remoto/documental alinhado |
| 4 | Consolidação operacional externa | `planned` | Bloco 3 estabilizado | camada interna segura e previsível | Google OAuth funcional, Gemini saneado e embeddings reais reprocessados |
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
- Estado: `in_progress`
- Branch associada: `session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING`
- Próxima ação: reconciliar conscientemente o histórico de migrations local/remoto antes de usar `db push`, agora que o contrato de `public.admin_users` / `public.is_admin_user()` já foi versionado no repositório
- Pendências conhecidas:
  - o banco remoto já está com `RLS` fechado nessas tabelas e o contrato de `admin_users` / `is_admin_user()` começou a ser trazido para o repositório, mas a cadeia de migrations ainda não está reconciliada
  - `embed-chunks` e `get-usage-stats` já foram republicadas com `verify_jwt` endurecido
  - a cadeia de migrations local e remota continua divergente, tornando `db push` inseguro sem reconciliação

### Bloco 4 — Consolidação operacional externa
- Estado: `planned`
- Objetivo: eliminar bloqueios externos que impedem operação previsível
- Próxima ação: habilitar Google OAuth no Supabase, sanear quota/projeto/chave/modelo do Gemini e reprocessar embeddings reais

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
