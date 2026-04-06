# 2026-04-06 — Hotfix mobile do Antigravity já dominante em produção

## Motivo

O usuário informou uma intervenção paralela do Antigravity para corrigir quebra de layout mobile, lag visual e loop de render do painel do chat. Era necessário confirmar se isso já estava de fato refletido no Git remoto e na produção web oficial.

## Evidência confirmada

- O commit existe na branch de sessão remota:
  - `5439a5a24dad601ba96a8df0e185fd7214ca9268`
  - mensagem: `fix: aplica correcoes exatas do Lovable para estabilizar layout mobile`
  - autor: `Antigravity <antigravity@gemini>`
- O alias oficial de produção, em `2026-04-06`, aponta para:
  - deploy `dpl_8WiUENtTBP4EgDf3p931egRwhF5H`
  - URL resolved: `https://clarainova02-ltxer5q76-wilson-m-peixotos-projects.vercel.app`
  - status: `READY`
  - created at: `2026-04-06 03:44:11 -03:00`
- `origin/main` não avançou junto com esse hotfix; continua em `91777c8`.

## Escopo técnico real do hotfix

### 1. Hero / grid mobile
- arquivo: `src/styles/clara-experience.css`
- mudança:
  - `.hero-content-layer` passou a usar `grid-template-columns: 1fr` por padrão
  - a composição de duas colunas voltou apenas sob `@media (min-width: 1024px)`
- efeito:
  - elimina o estouro de margem imposto por `minmax(320px, 0.7fr)` em telas menores

### 2. Scanline / partículas no mobile
- arquivo: `src/index.css`
- mudança:
  - abaixo de `899px`, `.scanline` e `.hero-particles-layer` passam a `display: none !important`
- efeito:
  - reduz lag visual e remove ruído gráfico do caminho mobile

### 3. Loop responsivo no ChatSheet
- arquivo: `src/components/ChatSheet.tsx`
- mudança:
  - o `useEffect` que reagia a `isMobile` deixou de depender de `panelMode`
  - no mobile, força `fullscreen`
  - fora do mobile, só recua `fullscreen -> wide` quando necessário
- efeito:
  - interrompe o loop/engasgo de render causado pela troca reativa de `panelMode`

## Leitura operacional

Este hotfix não foi integrado em `origin/main`, mas já domina a URL oficial de produção. Isso cria uma nova divergência controlada:

1. `origin/main @ 91777c8` continua sendo a fonte oficial integrada
2. a produção web oficial está à frente de `origin/main` por causa do hotfix `5439a5a`
3. a próxima publicação do pacote `Q1-Q7` não pode ignorar essa diferença

## Próxima ação

Antes do próximo publish do reset `Q1-Q7`, reconciliar explicitamente três frentes:

- `origin/main @ 91777c8`
- `codex/production-dependency-refresh` (`PR #14`, commit `125d22a`)
- hotfix mobile do Antigravity (`5439a5a`, deploy `dpl_8WiUENtTBP4EgDf3p931egRwhF5H`)
