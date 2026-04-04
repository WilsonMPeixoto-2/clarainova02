# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-04T03:56:00.000Z
- Atualizado por: CODEX @ WILSON-MP
- Branch de referência: `main`
- Commit de base oficial: `1af2d84baf0b126146f128e2045c0307227863ca`
- Head da sessão: `1af2d84baf0b126146f128e2045c0307227863ca`
- Último relatório: `docs/operational-reports/2026-04-04-main-integration-and-production-deploy-block-4c-dedup-legacy-fix.md`

## Estado atual resumido
- Fase atual: Pré-lançamento com BLOCO 4C publicado em produção após correção de deduplicação legada; o corpus remoto foi reconciliado e o próximo passo útil é um novo reupload controlado na UI admin
- Bloco ativo: BLOCO 4C — Deduplicação, paralelismo e testes do pipeline de ingestão
- Status da sessão: `in_progress`
- Próxima ação recomendada: repetir um reupload controlado do mesmo PDF na UI admin para comprovar o bloqueio gracioso de duplicidade já com a correção publicada em produção.

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
- A análise profunda do repositório e das branches paralelas foi concluída
- O BLOCO 4C já ganhou `document_hash` no fluxo de ingestão, preflight de duplicidade, concorrência controlada em `embed-chunks` e testes mínimos do pipeline
- `npm run validate` voltou a passar com `61` testes
- A aba do chat recebeu refinamentos seguros de usabilidade e estética: `ClaraMonogram`, `textarea` com auto-resize, envio por `Enter`, quebra de linha com `Shift+Enter` e resize com suporte por teclado
- O `Header` agora possui cobertura direta para drawer móvel, links principais e acionamento do chat
- `npm run validate` voltou a passar com `65` testes
- `DocumentMeta` agora possui cobertura direta para título, description, author, OG/Twitter e canonical
- `npm run validate` voltou a passar com `67` testes
- A persistência do chat agora usa schema versionado com retrocompatibilidade para payload legado
- O `ChatProvider` agora é coberto na hidratação do histórico persistido
- `npm run validate` voltou a passar com `70` testes
- A home agora oferece caminho discreto para `/admin` no drawer móvel e no footer público
- `Header` e `Footer` agora cobrem explicitamente a descoberta pública do acesso administrativo
- `npm run validate` voltou a passar com `71` testes
- A rodada do BLOCO 4C foi integrada em `main` com endurecimento da ingestão, melhorias de usabilidade do chat e cobertura adicional de testes
- A rodada paralela `CHAT-LAYOUT-POLISH-2` tornou o painel do chat mais largo por padrão, recolocou `Imprimir`, adicionou presets de tamanho e reduziu redundâncias do estado vazio e do controle de modo
- O polimento estrutural da janela do chat já foi promovido para `main`
- A rodada `CHAT-LAYOUT-POLISH-3` foi promovida para `main`, adicionando persistência do tamanho da janela, reduzindo ainda mais a densidade do topo e diferenciando melhor o estado vazio do estado com conversa
- O novo deploy canônico de produção foi concluído a partir de `main` no commit `7951c8df91839e1276fd7606b1082a6662a8bd00`
- Uma nova rodada paralela criou o sistema visual do símbolo da CLARA a partir das imagens de referência aprovadas pelo usuário
- Favicon, ícones de PWA, share card e `ClaraMonogram` agora estão prontos para adotar o novo selo neural/perfil
- A rodada do sistema visual da CLARA foi promovida para `main` por fast-forward
- O `main` remoto recebeu commits paralelos de outra ferramenta para ícones e assets de identidade; esse histórico foi absorvido por merge sem perder a versão aprovada do símbolo
- A aba do chat recebeu um polimento adicional para ficar mais densa como ambiente de trabalho: topo mais compacto em conversa ativa, acoes com hierarquia melhor, estado vazio mais enxuto e mensagens da CLARA com identidade visual mais forte
- `npm run validate` continuou passando com `71` testes apos esta rodada final de layout
- O refinamento final do workspace do chat ja foi publicado em producao no deploy canônico `dpl_Cdtyh6GZWHU1jQy5Pgg1otkCNuT6`
- O reupload do mesmo PDF revelou uma lacuna de deduplicação para documentos legados sem `document_hash`
- A UI admin agora baixa candidatos legados com o mesmo `file_name`, compara o SHA-256 do arquivo armazenado e faz backfill do `document_hash` antes de bloquear o upload duplicado
- O duplicado remoto do `SEI-Guia-do-usuario-Versao-final.pdf` foi removido após prova de identidade por hash, mantendo apenas o documento canônico com `88/88` chunks e `88/88` embeddings
- `npm run validate` voltou a passar com `72` testes após a correção da deduplicação legada
- A correção da deduplicação legada já foi integrada em `main` e publicada em produção no deploy canônico `dpl_2J9yUxb5DoWMZuYz4LC5FnCPBDv4`

## Itens pendentes
- Validar a deduplicação em ambiente real repetindo um upload controlado na UI após publicar a correção desta branch
- Decidir se o documento legado `MODELO_DE_OFICIO_PDDE.pdf` será reprocessado ou removido
- Liberar a carga curada do corpus inicial apenas depois do smoke test remoto
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
- A branch `origin/session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING` contém refinamentos úteis de chat/layout, mas não deve ser mergeada integralmente porque mistura deltas antigos de backend e mudanças fortes de comportamento do painel.
- A branch `origin/copilot/analise-completa-codigos-e-layout` foi classificada como insegura para integração por reembaralhar migrations e continuidade.
- O reupload do mesmo PDF em 2026-04-04 criou um segundo `document_id` porque o registro mais antigo do guia ainda não tinha `document_hash`; a correção desta branch cobre exatamente esse legado.
- A validacao estetica final do chat agora prioriza acabamento fino e densidade institucional; o proximo passo operacional volta a ser a trilha funcional do `4C`.

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
