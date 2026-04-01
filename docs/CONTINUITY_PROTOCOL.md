# Protocolo de Continuidade Determinística — CLARAINOVA02

## Finalidade
Este protocolo existe para impedir perda de contexto, retrabalho, divergência silenciosa entre máquinas e confusão entre ferramentas de IA.

## Princípio central
A única fonte oficial de verdade do projeto é **`origin/main` no GitHub**.

Não são fontes oficiais de verdade:
- repositório local da máquina de casa
- repositório local do notebook do trabalho
- branch local sem push
- stash
- memória de ferramenta de IA
- cópia não publicada de arquivos

## Regras obrigatórias

### 1. Uma sessão de trabalho sempre começa com leitura de contexto
Antes de qualquer alteração, a ferramenta ou operador deve ler:
- `.continuity/current-state.json`
- `docs/HANDOFF.md`
- `docs/MIGRATION_STATUS.md`
- relatório mais recente em `docs/operational-reports/`

### 2. Uma ferramenta = um worktree = uma branch de sessão
Cada ferramenta deve trabalhar em um diretório isolado.

Layout recomendado por máquina:
- repositório-base: `.../clarainova02`
- worktree do Codex: `.../clarainova02-codex`
- worktree de outra IA: `.../clarainova02-<tool>`

Se o worktree tiver uso recorrente, ele pode ser bloqueado com motivo:
- `git worktree lock <path> --reason "<motivo>"`

O utilitário local para abrir uma nova sessão é:
- `npm run session:new -- --block BLOCO-1-RLS --worktree <path> --base origin/main`

### 3. Nunca trabalhar diretamente em `main`
Todo trabalho novo deve ocorrer em branch de sessão ou branch temática.

Sugestão de convenção:
`session/YYYY-MM-DD/<machine>/<tool>/BLOCO-<n>-<slug>`

Exemplo:
`session/2026-04-01/WORK/CODEX/BLOCO-1-RLS`

### 4. Trabalho local não commitado não é estado confiável do projeto
Se uma sessão precisar ser interrompida, o estado aceitável é:
- commitado
- pushado
- documentado

### 5. Evitar `git stash` como mecanismo de continuidade
Stash não é trilha confiável entre máquinas e ferramentas.

### 6. Ao final de cada bloco ou sessão
É obrigatório atualizar:
- `docs/HANDOFF.md`
- `.continuity/current-state.json`
- `.continuity/session-log.jsonl`
- relatório detalhado em `docs/operational-reports/`

### 7. Mudanças feitas fora do GitHub devem voltar para o repositório
- migrations do Supabase devem existir como arquivos versionados
- ajustes operacionais no Vercel ou Supabase devem ser refletidos em documentação operacional no mesmo bloco
- nada relevante deve ficar apenas em dashboard

## Automação mínima disponível

### Verificação de abertura de sessão
- `npm run session:start`

Esse comando:
- exige árvore local limpa
- faz `git fetch origin --prune`
- confirma presença dos arquivos obrigatórios
- imprime o resumo atual da sessão e do `origin/main`

### Atualização estruturada de encerramento
- `npm run session:end -- --status partial --report docs/operational-reports/<arquivo>.md --next-action "<ação>"`

Esse comando:
- atualiza `.continuity/current-state.json`
- recria `docs/HANDOFF.md` a partir do estado estruturado
- acrescenta um evento em `.continuity/session-log.jsonl`

### Validação para CI e PR
- `npm run continuity:check`

Esse comando valida:
- existência dos arquivos obrigatórios de continuidade
- integridade mínima de `.continuity/current-state.json`
- consistência básica do `docs/HANDOFF.md`
- parse do `.continuity/session-log.jsonl`

## Fluxo recomendado de abertura de sessão
1. `git fetch origin --prune`
2. comparar `HEAD` local com `origin/main`
3. resolver qualquer sujeira local antes de continuar
4. ler os arquivos de continuidade
5. só então retomar ou abrir nova branch

## Fluxo recomendado de encerramento de sessão
1. rodar validações necessárias do bloco
2. atualizar os arquivos de continuidade
3. criar commit claro
4. fazer push da branch
5. registrar o próximo passo recomendado

## Estrutura dos arquivos de continuidade

### `docs/HANDOFF.md`
Resumo humano curto e direto, renderizado a partir do estado estruturado.

### `.continuity/current-state.json`
Estado legível por máquina/IA, com:
- fase atual
- bloco atual
- branch ativa
- último commit de referência
- itens concluídos
- itens pendentes
- bloqueios externos
- próxima ação recomendada

### `.continuity/session-log.jsonl`
Log append-only de eventos relevantes de sessão.

### `docs/operational-reports/`
Relatórios detalhados por bloco, com contexto, ações, testes, critérios de aceite e pendências.

## Regra de ouro
Se o trabalho não estiver **branchado, pushado e registrado** no repositório, ele não deve ser tratado como base confiável de continuidade.
