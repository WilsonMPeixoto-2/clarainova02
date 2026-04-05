# 2026-04-05 — R3A publicado em produção e benchmark remoto

## Escopo desta rodada
Fechar a primeira etapa da nova trilha prioritária do BLOCO 5:
- publicar o `R3A` em produção
- alinhar a Edge Function `chat`
- rodar o benchmark canônico remoto após a publicação

## Artefato funcional publicado
- commit funcional: `13bb28f00fd32598b57f3cf531c767fd7e634e2d`
- mensagem: `feat: contextualize rag follow-up retrieval`

## O que o R3A entrega
- o chat web agora envia `contextSummary` mínimo para mensagens anteriores da CLARA, derivado de `tituloCurto + resumoInicial`
- a Edge Function `chat` passou a:
  - sanitizar esse contexto estruturado
  - enriquecer o snippet usado na expansão de query
  - contextualizar o retrieval quando a nova pergunta for um follow-up curto e anafórico
- a heurística foi coberta para evitar contaminação indevida de perguntas novas e explícitas
- o trabalho ficou fora do layout do chat por coexistência com outra frente paralela

## Publicação remota
- GitHub:
  - branch publicada: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
  - head publicado: `13bb28f00fd32598b57f3cf531c767fd7e634e2d`
- Vercel:
  - deployment id: `dpl_BxTyARLVQ4yXDpXvjetSJRsxtS3Q`
  - status: `READY`
  - production alias: `https://clarainova02.vercel.app`
  - inspector: `https://vercel.com/wilson-m-peixotos-projects/clarainova02/BxTyARLVQ4yXDpXvjetSJRsxtS3Q`
- Supabase:
  - function republicada: `chat`
  - versão observada após publish: `25`
  - projeto: `jasqctuzeznwdtbcuixn`

## Validação local antes do publish
- `npm run validate`
  - resultado: `18` suites e `83` testes green

## Benchmark remoto pós-publicação
- `Didático`
  - `16/16 httpOk`
  - `16/16 noWebFallback`
  - `15/16 scopeExact`
  - `16/16 expectedAllMet`
  - `avgFinalConfidence = 0.9938`
- `Direto`
  - `16/16 httpOk`
  - `16/16 noWebFallback`
  - `16/16 scopeExact`
  - `16/16 expectedAllMet`
  - `avgFinalConfidence = 1.0`

## Observação operacional
- a primeira tentativa do lote `Direto` encontrou uma resposta não-JSON no meio do batch e o script abortou
- a rerodada imediata ficou completamente green
- interpretação operacional: ruído transitório de borda, não regressão lógica do `R3A`

## Conclusão
- o `R3A` está publicado e aprovado
- o baseline canônico permanece íntegro em produção
- a próxima etapa correta deixa de ser batch embedding e passa a ser `R3B`

## Próxima ação
- abrir `R3B` com:
  - telemetria por estágio (`embedding`, `expansion`, `search`, `generation`, `sanitization`)
  - budget real de timeout para desviar cedo do fluxo estruturado quando o tempo restante ficar baixo
