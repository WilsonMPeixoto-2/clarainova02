# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-03T07:56:00.000Z
- Atualizado por: CODEX @ WILSON-MP
- Branch de referência: `session/2026-04-03/HOME/CODEX/BLOCO-4C-INGESTION-HARDENING`
- Commit de base oficial: `fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`
- Head da sessão: `fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`
- Último relatório: `docs/operational-reports/2026-04-03-block-4c-ingestion-hardening-kickoff.md`

## Estado atual resumido
- Fase atual: Pré-lançamento com BLOCO 4B concluído e BLOCO 4C em abertura: contrato novo do Gemini já provado em produção
- Bloco ativo: BLOCO 4C — Deduplicação, paralelismo e testes do pipeline de ingestão
- Status da sessão: `in_progress`
- Próxima ação recomendada: Implementar `document_hash` para deduplicação, concorrência controlada no `embed-chunks` e testes mínimos do pipeline antes da carga curada do corpus.

## Itens concluídos
- A cadeia local de migrations foi reconciliada com as quatro versões canônicas registradas no Supabase oficial
- embed-chunks e get-usage-stats republicadas no projeto oficial com verify_jwt endurecido
- Acesso ao Postgres remoto oficial validado e fechamento de RLS confirmado nas tabelas operacionais/analíticas analisadas
- O contrato remoto de `public.admin_users` / `public.is_admin_user()` agora está representado pela migration canônica `20260401213217_harden_admin_authorization.sql`
- `supabase migration list` e `supabase db push --dry-run` voltaram a indicar sincronização segura entre repositório e banco remoto
- BLOCK_PLAN, REMOTE_STATE e MIGRATION_STATUS alinhados à trilha atual de segurança
- Checklist operacional do BLOCO 4 documentado com exigências concretas para Google OAuth, Gemini e reprocessamento de embeddings
- A trilha de hardening do BLOCO 3 foi integrada em `main` por fast-forward
- A integração em `main` gerou deploy canônico `READY` via GitHub/Vercel no projeto `clarainova02`
- O BLOCO 4A foi integrado em `main` com Gemini 3.1 preview e `gemini-embedding-2-preview`
- Query embedding agora usa `taskType: RETRIEVAL_QUERY` com normalização L2 em `768`
- Document embedding agora usa `taskType: RETRIEVAL_DOCUMENT`, `title`, normalização L2 e persistência de metadados de embedding
- O frontend de ingestão passou a enviar chunks estruturados, sem prefixos artificiais no texto semântico
- `npm run validate` passou antes da integração
- A produção publicada já aponta para o commit `fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`
- A inspeção remota do corpus mostrou 1 documento legado com 2 chunks e 0 embeddings persistidos
- O chat público em produção respondeu de forma grounded ao documento legado, com referência explícita ao PDF de base
- `embed-chunks` e `get-usage-stats` agora validam sessão via `auth.getUser()` e vínculo ativo em `public.admin_users`, sem depender do JWT do gateway
- O erro `401 Invalid JWT` na borda das functions administrativas foi convertido em `403` de aplicação para contas autenticadas que não são admin
- O novo PDF real `SEI-Guia-do-usuario-Versao-final.pdf` foi processado em produção com `88/88` chunks, `88/88` embeddings e metadados do contrato novo persistidos
- O chat público respondeu de forma grounded ao novo manual em perguntas sobre documento externo, bloco de assinatura e envio simultâneo

## Itens pendentes
- Executar o BLOCO 4C com deduplicação real por `document_hash`
- Paralelizar embeddings com concorrência controlada no `embed-chunks`
- Adicionar testes mínimos do pipeline de ingestão
- Liberar a carga curada do corpus inicial apenas depois do smoke test remoto

## Bloqueios externos
- Google OAuth do admin continua dependente de configuração externa no Supabase/Google
- Embeddings reais continuam sujeitos à estabilidade externa do Gemini

## Notas operacionais
- A trilha principal deixou de depender da PR #13 e passou a seguir um hardening incremental diretamente a partir de origin/main.
- O banco remoto oficial já estava mais seguro do que a cadeia local de migrations indicava; a cadeia local agora foi alinhada ao baseline remoto canônico.
- O preparo do BLOCO 4 foi registrado sem tocar em `ROADMAP_FUTURO.md` nem nas functions de chat e embeddings que já estavam modificadas fora deste escopo.
- Main agora incorpora a reconciliação canônica de migrations e o endurecimento administrativo da rodada de BLOCO 3.
- As tentativas manuais de deploy por CLI no projeto canônico falharam com erro interno da Vercel, mas a integração Git publicou a versão válida de produção.
- O BLOCO 4A já foi integrado em `main` e publicado em produção; o BLOCO 4B foi concluído com evidência de ingestão nova e grounding real.
- O formulário do admin continua exibindo uma conta provisionada que autentica sessão, mas não equivale ao admin bootstrap ativo em `public.admin_users`; ela deve falhar com `403` nas functions administrativas.
- As oportunidades futuras de Matryoshka, context caching, Google Search grounding nativo e multimodalidade por print foram preservadas no backlog, sem competir com a prioridade atual.

## Preambulo obrigatório para qualquer IA
1. tratar `origin/main` como única fonte oficial de verdade
2. ler, nesta ordem:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/MIGRATION_STATUS.md`
   - último relatório em `docs/operational-reports/`
3. depois confirmar:
   - bloco ativo
   - branch correta
   - itens concluídos
   - itens pendentes
   - próxima ação recomendada
4. complementar a leitura com:
   - `docs/BLOCK_PLAN.md`
   - `docs/REMOTE_STATE.md`
5. não continuar se houver divergência entre o contexto local e o contexto registrado no repositório sem explicitar essa divergência
6. trabalhar em branch de sessão, nunca direto em `main`
7. ao encerrar, deixar tudo commitado, pushado e documentado
