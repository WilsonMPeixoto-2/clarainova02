# 2026-04-06 — Reconciliação de UI publicada em `main` e já ativa em produção

## Motivo
- A continuidade oficial ficou defasada em relação a uma rodada real de UI que já havia sido commitada em `main` e publicada na Vercel.
- O objetivo desta reconciliação é registrar explicitamente o que entrou, quando entrou e qual deploy oficial está servindo esses commits.

## Evidência local
- `git log --oneline --decorate -n 20` confirmou `HEAD -> main`, `origin/main` e `origin/HEAD` alinhados em `a7aa8f2`
- `git reflog --date=iso -n 15` mostrou:
  - `2026-04-06 01:18:50 -0300` — commit `4b449eb` `fix(UI/Backend): protege o layout mobile contra quebras e aplica o endurecimento tatico da chat function`
  - `2026-04-06 01:28:00 -0300` — commit `cc7bc7d` `fix(UI): acelera scanline e isola scroll parallax mobile para conter o flicker`
  - `2026-04-06 01:35:24 -0300` — commit `a7aa8f2` `fix(UI): desabilita hijacking do scroll e efeitos 3D nocivos no mobile`
  - `2026-04-06 01:38:50 -0300` — fast-forward para `main`

## Evidência remota
- `vercel inspect https://clarainova02.vercel.app --scope wilson-m-peixotos-projects` confirmou:
  - deployment id: `dpl_EddEfGUsefAMV5QuzSjsaT79ocEG`
  - status: `READY`
  - target: `production`
  - criado em `2026-04-06 01:38:53 -03:00`
  - alias oficial ativo:
    - `https://clarainova02.vercel.app`

## Interpretação
- A produção oficial atual já inclui a rodada recente de UI em `main`.
- A documentação de continuidade ficou para trás, mas o código e a produção não ficaram divergentes entre si.

## Escopo efetivamente publicado
- `4b449eb`
  - protege layout mobile contra quebras
  - endurece taticamente a `chat function`
- `cc7bc7d`
  - acelera scanline
  - isola scroll/parallax mobile para conter flicker
- `a7aa8f2`
  - desabilita hijacking de scroll
  - corta efeitos 3D nocivos no mobile

## Ajuste de continuidade
- `origin/main` passa a ser tratado como alinhado ao commit `a7aa8f2`
- a produção oficial passa a ser tratada como alinhada ao deploy `dpl_EddEfGUsefAMV5QuzSjsaT79ocEG`
- a regra operacional fica reforçada:
  - se outra ferramenta fizer commit ou deploy manual em `main`/produção, a reconciliação documental precisa acontecer na mesma rodada

## Próxima ação
- Retomar `Q0` e `Q1` do `quality-first reset`, já a partir deste novo estado canônico reconciliado.
