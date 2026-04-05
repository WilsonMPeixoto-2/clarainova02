# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-05T06:29:48Z
- Atualizado por: CODEX @ WILSON-MP
- Branch de referência: `session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
- Commit de base oficial: `6770c85d62dd8d01fa1b7324fac03a88bdb6d099`
- Head da sessão: `921a29bfcdbc20295d265490b5694a5327f48832`
- Último relatório: `docs/operational-reports/2026-04-05-production-deploy-r0-r2-session-branch.md`

## Estado atual resumido
- Fase atual: BLOCO 5 com `R0`, `R1` e `R2` implementados localmente, abrindo agora a fase `R3` de batch embedding e re-embed controlado
- Bloco ativo: BLOCO 5 — Excelência do RAG, retrieval governado e fidelidade do sistema de perguntas e respostas
- Status da sessão: `session_in_progress`
- Próxima ação recomendada: executar a bateria remota pós-publicação do pacote `R1-R2` já publicado e, sem regressão, abrir o `R3`.

## Nota de alinhamento
- A divergência recente entre relatórios não veio de surpresa funcional do código; veio de drift documental após commits e merges paralelos feitos por mais de uma ferramenta diretamente em `main`.
- O estado real do projeto continua estável em `origin/main`; o que precisou de reconciliação foi a trilha de continuidade e o plano canônico.
- Em `2026-04-05`, a produção foi publicada manualmente a partir da branch de sessão `921a29b`, então a produção ficou temporariamente à frente de `origin/main`. Essa divergência já está registrada em `docs/REMOTE_STATE.md`.

## Prioridade imediata
- A partir de `2026-04-05`, a ordem operacional imediata dentro do BLOCO 5 passa a ser `R0`, `R1`, `R2`, `R3`, `R4`, `R5` e só depois a retomada dos subblocos `5B-5F`.
- `R0` cobre benchmark canônico, baseline reproduzível e gate local do RAG. Esta etapa já foi concluída nesta branch.
- `R1` cobre ajustes imediatos de geração sem reingestão: `thinkingLevel`, temperatura dinâmica, `maxOutputTokens` maior, roteamento de modelo e query expansion com contexto curto. Esta etapa já foi implementada localmente e validada nesta branch.
- `R2` foi concluído localmente com framing textual assimétrico no contrato de embedding, metadata versionada e separação entre semântica vetorial e metadado de citação.
- `R3-R5` ficam logo na sequência, ainda antes de novas expansões fortes do retrieval ou do corpus.
- O pacote `R0-R2` já foi commitado, enviado ao GitHub e publicado em produção na Vercel e nas Edge Functions críticas do Supabase.

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
- O `main` recebeu em paralelo um uplift amplo do RAG no merge `10291b0`, já publicado em produção no deploy `dpl_4FSCwyQZrGGm3BkkeMQijDU4wMQE`
- O chat agora usa expansão de consulta com LLM, média normalizada entre embeddings original e expandida, `match_count = 12` e enriquecimento por chunks adjacentes do mesmo documento
- O prompt de geração passou a receber `QUALIDADE DA RECUPERACAO`, e o schema enviado ao Gemini agora expõe `finalConfidence`, ambiguidades e avisos ao usuário
- A resposta grounded no frontend ganhou badge de confiança, cópia rápida, listas expansíveis e citações clicáveis com scroll para a referência correspondente
- A ingestão passou a usar chunking semântico com detecção de `sectionTitle`; para uploads futuros, `chunk.content` volta a incluir prefixo automático `[Fonte: ... | Página: ...]` por compatibilidade com a atribuição de referências
- A telemetria do chat agora registra `rag_quality_score` e `expanded_query`
- A política canônica de curadoria do corpus foi registrada em `docs/corpus-curation-policy.md`
- O manifesto `docs/corpus_manifest.csv` agora governa camada, prioridade, SHA-256, status de download e status de ingestão por documento
- O lote local do SEI.Rio (`P1` + `P2`) foi localizado, nomeado segundo a política oficial, ingerido seletivamente e já está servindo grounding em produção
- O Decreto Rio nº 55.615/2025 permanece fora do corpus ativo por captura oficial ainda parcial
- A Edge Function remota `embed-chunks` já foi republicada para a versão `16`
- O batch 1 de corpus foi integrado em `main` e publicado em produção no deploy `dpl_ycURU2FVB1ABYuFRzdSckTo9K984`
- A avaliação inicial do RAG contra o núcleo local registrou `9/9` respostas `HTTP 200`, sem web fallback, com `answerScopeMatch = exact` e `finalConfidence = 1`
- A camada `COBERTURA_P2` do PEN foi ingerida no corpus ativo com governança explícita por `topic_scope`, `search_weight` e manifesto editorial
- A camada `APOIO_P3` versionado agora inclui a wiki SEI-RJ 4.1 e a correspondência de ícones da UFSCar, ambas ingeridas com precedência inferior ao núcleo local
- A migration `20260404084500_refine_hybrid_search_for_governed_corpus.sql` foi aplicada remotamente via `supabase db query --linked` e registrada em `supabase_migrations.schema_migrations`
- A função `hybrid_search_chunks` remota agora considera título, origem institucional, versão e `section_title` na fase keyword do ranking híbrido
- A Edge Function remota `chat` foi republicada até a versão `18`, com bônus de intenção para perguntas sobre nota oficial, wiki, UFSCar, interface e versão
- O avaliador em lote `scripts/corpus/evaluate_rag_batch.py` foi criado para medir groundedness, fallback, confiança final, acerto de escopo e aderência às referências esperadas
- A avaliação ampliada do lote 3 registrou `16/16` respostas com `HTTP 200`, `16/16` sem web fallback, `15/16` com `answerScopeMatch = exact` e `13/16` com `expectedAllMet = true`
- O roteamento por fonte nomeada foi implementado em dois estágios (`hybrid_search_chunks` + `fetch_targeted_chunks`) para perguntas como `segundo a nota oficial`, `segundo a wiki`, `segundo a UFSCar` e `conforme o manual do PEN`
- A função SQL `fetch_targeted_chunks` foi criada para recuperar chunks de documentos-alvo por distância vetorial pura, sem o multiplicador de `search_weight`
- O scoring final passou a reservar slots e aplicar boost para a fonte nomeada explicitamente pelo usuário
- O corpus remoto foi auditado e limpo: o guia legado de `88` chunks foi promovido com metadados `NUCLEO_P1`, a versão governada menor foi desativada, o `MODELO_DE_OFICIO_PDDE.pdf` saiu do corpus ativo e registros falhados antigos foram desativados
- O `topic_scope` do Termo de Uso foi corrigido de `material_apoio` para `sei_rio_termo`
- A avaliação batch 3 pós source-routing registrou `16/16` em todas as métricas: `HTTP 200`, sem web fallback, `answerScopeMatch = exact`, `expectedAllMet = true` e `finalConfidence = 1`
- A aba do chat agora contém o `wheel scroll` dentro do próprio painel, inclusive quando o cursor está sobre header e composer, evitando que o pano de fundo receba a rolagem
- O `responseMode` agora é preservado por mensagem, permitindo que a UI mantenha a distinção visual do modo que gerou cada resposta
- O modo `Didático` ganhou camadas mais conscientes de leitura: veredito inicial, explicação principal, detalhamento complementar e observações finais
- O modo `Didático` passou a deduplicar conteúdo repetido com leveza, para reforçar sem redundar
- O estado de loading do chat deixou de usar um ícone disforme e agora usa um avatar derivado da imagem premium da CLARA
- O seletor `Direto` / `Didático` agora tem contraste mais explícito entre ativo e inativo, com leitura visual imediata do modo selecionado
- A rodada de UX do chat com scroll contido, loading/avatar revisado e distinção mais forte entre `Direto` e `Didático` já foi integrada em `main`, publicada inicialmente no deploy `dpl_A6oZ26Byyn8yFLjCzLgnEHrWYTNi` e consolidada documentalmente no deploy `dpl_7kWa5Y3zhKjiSLkxz3iGeNdxtrVM`

## Itens pendentes
- Executar `R3` com batch embedding nativo e preparar re-embed controlado do corpus
- Executar uma bateria remota pós-publicação para reavaliar o `R1-R2` já publicado contra o benchmark canônico
- Rodar `R4` e `R5` de forma experimental e controlada antes de retomar `5B-5F`
- Encontrar uma captura oficial íntegra do Decreto Rio nº 55.615/2025 e substituir a versão parcial no staging e no corpus
- Executar uma bateria manual de `15–20` perguntas reais com foco em ambiguidade de versão, interface e fonte-alvo
- Repetir um reupload controlado do mesmo PDF na UI admin para fechar a evidência residual de deduplicação do BLOCO 4C
- Monitorar o source-target routing para evitar overboost quando a fonte nomeada tiver evidência semanticamente fraca

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
- O uplift paralelo do RAG reverteu parcialmente a premissa de `texto limpo sem prefixo` para uploads futuros: o código atual volta a prefixar `chunk.content` com fonte/página para reaproveitar o parser e a atribuição de referências já existentes.
- A migration da busca híbrida não depende mais de `SUPABASE_DB_PASSWORD`: a CLI atual permitiu execução remota segura com `supabase db query --linked`.
- O gap de roteamento por fonte-alvo foi resolvido com source-target routing em dois estágios; o foco agora é monitorar precisão residual e ampliar a bateria manual.
- A validacao estetica final do chat agora prioriza acabamento fino e densidade institucional; o proximo passo operacional volta a ser a trilha funcional do `4C`.
- O PDF `SDP_PRESTACAO_DE_CONTAS_GAD_4_CRE.pdf` está sendo usado apenas como referência de cadência didática para instrução processual no SEI-Rio, não como fonte normativa do corpus governado.

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
