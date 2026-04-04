# 2026-04-04 — Main Integration and Production Deploy — Chat Scroll and Didactic Polish

## Escopo
Registrar a promocao para `main` e a publicacao em producao da rodada de UX do chat que:

- conteve o `wheel scroll` dentro do proprio painel
- reforcou a diferenca visual e estrutural entre `Direto` e `Didatico`
- substituiu o loading disforme por avatar derivado da identidade premium da CLARA
- manteve o PDF `SDP_PRESTACAO_DE_CONTAS_GAD_4_CRE.pdf` apenas como benchmark de forma didatica, sem promovê-lo a fonte normativa do corpus

## Integracao em Git
- Branch de origem: `session/2026-04-04/HOME/CODEX/CHAT-SCROLL-FIX`
- Branch integrada: `main`
- Commit funcional promovido: `bc1db65` — `feat(chat): fix scroll containment and strengthen didactic mode`
- Commit de continuidade promovido: `52415a9` — `docs(continuity): clarify didactic benchmark reference`
- Estado final apos integracao: `main == origin/main == 52415a9e51da0f40c6b11d794011b7472b193364`

## Publicacao remota

### Vercel
- Projeto: `clarainova02`
- Team: `team_EFJunPOtGozS99jZ6zkIQXHF`
- Project ID: `prj_670eYtgXeuUH7dbMO91Pwx2aphm0`
- Deploy de producao observado: `dpl_A6oZ26Byyn8yFLjCzLgnEHrWYTNi`
- Status: `READY`
- Commit publicado: `52415a9e51da0f40c6b11d794011b7472b193364`
- URL observada do deploy: `https://clarainova02-dvism79ee-wilson-m-peixotos-projects.vercel.app`
- Alias canonico esperado: `https://clarainova02.vercel.app`

### Supabase
- Projeto: `jasqctuzeznwdtbcuixn`
- Function `chat`: `ACTIVE`, versao `22`, atualizada em `2026-04-04 18:21:03 UTC`
- Function `embed-chunks`: `ACTIVE`, versao `16`
- Function `get-usage-stats`: `ACTIVE`, versao `11`

## O que ficou provado
- a linha principal ja carrega a rodada de UX do chat e nao depende mais de branch paralela para esse comportamento
- a producao web ja reflete a correcao de scroll, o avatar de loading e a nova diferenciacao de `Direto` / `Didatico`
- o benchmark visual/processual do PDF de `SDP` foi mantido fora da hierarquia normativa do corpus e ficou registrado apenas como referencia de forma didatica

## Impacto no planejamento
- nenhum replanejamento estrutural foi necessario
- a trilha principal continua no `BLOCO 5`
- o parentesis de UX do chat foi encerrado como baseline publicado
- a proxima frente volta a ser funcional/editorial:
  - substituir o Decreto `55.615` por captura oficial integra
  - ampliar a bateria manual de perguntas
  - fechar a evidencia residual de deduplicacao via reupload controlado na UI admin

## Arquivos de continuidade alinhados nesta rodada
- `.continuity/current-state.json`
- `docs/HANDOFF.md`
- `docs/BLOCK_PLAN.md`
- `docs/REMOTE_STATE.md`
- `docs/MIGRATION_STATUS.md`
