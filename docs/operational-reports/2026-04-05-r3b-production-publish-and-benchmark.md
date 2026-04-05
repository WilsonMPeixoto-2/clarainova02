# 2026-04-05 — R3B publicado em produção e benchmark remoto

## Escopo desta rodada
Fechar a segunda etapa da trilha prioritária refinada do BLOCO 5:
- publicar o `R3B`
- alinhar a Edge Function `chat`
- validar que o novo budget real e a telemetria por estágio não degradaram o benchmark canônico

## Artefato funcional publicado
- commit funcional: `e77ce9b3535b654acf1da6e5af5d7096a9da8d68`
- mensagem: `feat: add rag stage timing budget`

## O que o R3B entrega
- budget total por request na `chat`
- decisão explícita de:
  - tentar ou não structured
  - reservar tempo para stream fallback
  - evitar leakage repair quando o request já está sem headroom
- latência por estágio em `chat_metrics.metadata_json`
  - `embedding_ms`
  - `expansion_ms`
  - `search_ms`
  - `generation_ms`
  - `sanitization_ms`
- metadados adicionais de orçamento:
  - `time_budget_ms`
  - `budget_elapsed_ms`
  - `budget_remaining_ms`
  - `structured_skipped_for_budget`
  - `structured_timeout_ms`
  - `stream_init_timeout_ms`
  - `leakage_repair_timeout_ms`

## Publicação remota
- GitHub:
  - branch publicada: `origin/session/2026-04-04/HOME/CODEX/RAG-PLAN-RESET`
  - head funcional publicado: `e77ce9b3535b654acf1da6e5af5d7096a9da8d68`
- Vercel:
  - deployment id: `dpl_HgFuvt4mnCVZNwN9ikNCNMedE2aY`
  - status: `READY`
  - production alias: `https://clarainova02.vercel.app`
  - inspector: `https://vercel.com/wilson-m-peixotos-projects/clarainova02/HgFuvt4mnCVZNwN9ikNCNMedE2aY`
- Supabase:
  - function republicada: `chat`
  - versão observada após publish: `26`
  - projeto: `jasqctuzeznwdtbcuixn`

## Validação local antes do publish
- `npm run validate`
  - resultado: `19` suites e `87` testes green

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
  - `avgFinalConfidence = 0.9938`

## Conclusão
- o `R3B` está publicado e aprovado
- a produção manteve o benchmark canônico green mesmo com a nova lógica de budget
- a próxima frente correta passa a ser `R3C`

## Próxima ação
- abrir `R3C` com telemetria explícita do tamanho do prompt e do histórico enviado
