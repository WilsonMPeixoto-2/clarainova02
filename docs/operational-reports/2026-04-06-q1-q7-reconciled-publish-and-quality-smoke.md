# 2026-04-06 — Publicação reconciliada do reset Q1-Q7 e smoke de qualidade

## Escopo

Esta rodada fechou a reconciliação do pacote `Q1-Q7` com:

- `origin/main @ 91777c8`
- hotfix mobile paralelo do Antigravity (`5439a5a`)
- refresh seguro de dependências aplicado diretamente na branch de sessão

Também foi publicada uma correção backend adicional para priorizar playbooks operacionais em vez de devolver `503` quando o provedor falha.

## Commits publicados

- `9e9c048` `merge: reconcile session branch with origin/main mobile fixes`
- `d49c5a2` `chore: reconcile quality reset with safe dependency refresh`
- `6ace3ec` `fix: prefer emergency playbooks over provider 503s`

## Publicação remota

### Web
- deploy oficial atual: `dpl_F2NA3iU2neeEHyH3DBgMwRBS5vmU`
- URL oficial: `https://clarainova02.vercel.app`
- deployment URL: `https://clarainova02-i7uormimf-wilson-m-peixotos-projects.vercel.app`
- status: `READY`

### Supabase
- `chat`: versão `48`
- `embed-chunks`: versão `21`
- `get-usage-stats`: versão `12`

## O que mudou de forma objetiva

### 1. Reconciliação da base
- a branch de sessão passou a incorporar os ajustes recentes de mobile vindos de `origin/main`
- o hotfix mobile do Antigravity/Lovable foi preservado
- o refresh seguro de dependências foi absorvido sem reverter o reset do RAG

### 2. Dependências seguras absorvidas
- `@langchain/core 1.1.39`
- `@react-pdf/renderer 4.3.3`
- `@tanstack/react-query 5.96.2`
- `react-router-dom 7.14.0`
- `@types/node 25.5.2`
- `@google/genai 1.48.0` em `supabase/functions/deno.json`

### 3. Correção crítica de qualidade no backend
- perguntas operacionais já cobertas por playbook não morrem mais em `503` só porque o provedor ficou indisponível
- em cenário de `provider_unavailable`, a `chat` agora pode devolver diretamente o playbook curado como resposta útil
- isso fechou o buraco que ainda afetava:
  - `despacho x ofício`
  - `notificações/prazos`

## Validação local

- `npm run validate` passou
  - `35` test files
  - `135` testes
  - único warning residual: `SmoothScrollProvider.tsx` com `react-refresh/only-export-components`
- `npm run typecheck` passou novamente após a correção backend
- `chat-emergency-playbooks.test.ts` passou com `4/4`

## Smoke remoto pós-publicação

Perguntas-chave em `Didático`:

1. `Como incluir um documento externo no SEI-Rio?`
   - `200`
   - `answerScopeMatch = exact`
   - `finalConfidence = 0.97`
   - `4` referências

2. `Como assinar um documento interno?`
   - `200`
   - `answerScopeMatch = exact`
   - `finalConfidence = 0.96`
   - `6` referências

3. `Qual é a diferença entre despacho e ofício no SEI-Rio?`
   - `200`
   - `answerScopeMatch = exact`
   - `finalConfidence = 0.95`
   - `0` referências
   - resolvido via playbook emergencial em cenário degradado

4. `Como gerar notificações de prazos no SEI-Rio?`
   - `200`
   - `answerScopeMatch = exact`
   - `finalConfidence = 0.94`
   - `0` referências
   - resolvido via playbook emergencial em cenário degradado

## Leitura operacional atual

O chat está objetivamente melhor para o usuário do que estava antes desta rodada:

- as perguntas críticas deixaram de cair em indisponibilidade dura
- o frontend publicado já incorpora as correções recentes de mobile
- o reset `Q1-Q7` está enfim refletido numa base remota coerente

Mas o gargalo estrutural ainda existe:

- `17` documentos continuam `is_active = true` e `status = embedding_pending`
- só `25` de `314` chunks ativos têm embedding válido no remoto
- nas últimas horas, o tráfego continuou dominado por `keyword_only_no_embedding`

## Próximo foco

Com a publicação reconciliada concluída, a próxima frente correta deixa de ser “consertar o publish” e passa a ser “destravar ainda mais a qualidade da resposta”:

1. reduzir a dependência do provedor em perguntas canônicas já dominadas
2. restaurar um subconjunto realmente pronto do corpus semântico remoto
3. tornar `Direto` realmente mais curto que `Didático`
4. recuperar referências leves para playbooks emergenciais quando possível
