# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-03T04:48:16.325Z
- Atualizado por: CODEX @ WILSON-MP
- Branch de referência: `session/2026-04-03/HOME/CODEX/BLOCO-4A-GEMINI-EMBEDDING-CONTRACT`
- Commit de base oficial: `b74ea1167bf24d3cb8d66aac68813ad4cd51ceb5`
- Head da sessão: `b74ea1167bf24d3cb8d66aac68813ad4cd51ceb5`
- Último relatório: `docs/operational-reports/2026-04-03-block-4a-gemini-embedding-contract.md`

## Estado atual resumido
- Fase atual: Pré-lançamento com BLOCO 4A em execução para alinhar o código ao contrato Gemini e ao novo embedding antes da ingestão real
- Bloco ativo: BLOCO 4A — Alinhamento Gemini e contrato de embedding
- Status da sessão: `partial`
- Próxima ação recomendada: Verificar o estado real do corpus remoto, decidir re-embed/limpeza de legado e executar o smoke test remoto com 1 PDF e perguntas grounded antes de liberar a carga curada.

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
- Esta branch alinhou o código à pilha Gemini 3.1 preview e `gemini-embedding-2-preview`
- Query embedding agora usa `taskType: RETRIEVAL_QUERY` com normalização L2 em `768`
- Document embedding agora usa `taskType: RETRIEVAL_DOCUMENT`, `title`, normalização L2 e persistência de metadados de embedding
- O frontend de ingestão passou a enviar chunks estruturados, sem prefixos artificiais no texto semântico
- `npm run validate` passou na branch de sessão

## Itens pendentes
- Verificar contaminação entre gerações de embeddings no corpus remoto antes da ingestão séria
- Executar smoke test remoto com 1 PDF real e 1–3 perguntas grounded
- Integrar a branch 4A em `main` sem perder o rastreio da pilha Gemini declarada no código
- Executar o BLOCO 4B com deduplicação, paralelismo controlado e preparação da carga curada do corpus

## Bloqueios externos
- Google OAuth do admin continua dependente de configuração externa no Supabase/Google
- Embeddings reais continuam sujeitos à estabilidade externa do Gemini

## Notas operacionais
- A trilha principal deixou de depender da PR #13 e passou a seguir um hardening incremental diretamente a partir de origin/main.
- O banco remoto oficial já estava mais seguro do que a cadeia local de migrations indicava; a cadeia local agora foi alinhada ao baseline remoto canônico.
- O preparo do BLOCO 4 foi registrado sem tocar em `ROADMAP_FUTURO.md` nem nas functions de chat e embeddings que já estavam modificadas fora deste escopo.
- Main agora incorpora a reconciliação canônica de migrations e o endurecimento administrativo da rodada de BLOCO 3.
- As tentativas manuais de deploy por CLI no projeto canônico falharam com erro interno da Vercel, mas a integração Git publicou a versão válida de produção.
- Esta branch ainda não alterou a produção. Ela só alinhou o código e a documentação mínima ao contrato novo do Gemini antes do smoke test remoto.

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
