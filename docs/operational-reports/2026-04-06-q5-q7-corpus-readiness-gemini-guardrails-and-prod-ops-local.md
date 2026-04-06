# 2026-04-06 — Q5-Q7 local: prontidão semântica do corpus, guard-rails Gemini e operações seguras

## Escopo
- Fechar `Q5`, `Q6` e `Q7` do `quality-first reset` sem misturar a frente paralela de layout/dependências.
- Reduzir custo e superfície de falha sem perder o objetivo central da CLARA: responder melhor.

## Q5 — Corpus semanticamente pronto antes de ativar
- [admin-governance.ts](/C:/Users/okidata/clarainova02/src/lib/admin-governance.ts) ganhou `resolveDocumentRuntimeActivation`, separando:
  - intenção de governança (`governance_activation_requested`)
  - ativação real em runtime (`is_active`)
- [Admin.tsx](/C:/Users/okidata/clarainova02/src/pages/Admin.tsx):
  - upload inicial agora insere documento com `is_active = false`
  - documento só volta a ativo quando `groundingEnabled = true`
  - `embedding_pending`, `partial`, `error` e `cancelled` forçam `is_active = false`
  - retry agora usa `metadata_json.governance_activation_requested` como intenção canônica de ativação, em vez de confiar no estado atual de `is_active`
- [reembed_active_corpus.py](/C:/Users/okidata/clarainova02/scripts/corpus/reembed_active_corpus.py):
  - passou a considerar documentos com `governance_activation_requested = true`, mesmo que temporariamente inativos
  - reativa `is_active` só quando o rebuild deixa o documento realmente pronto

## Q6 — Camada Gemini sob free tier apertado
- [generation-strategy.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/generation-strategy.ts):
  - perguntas simples e diretas agora tentam apenas `Flash-Lite`
  - `Pro` fica reservado para source-target, conceito, erro de sistema e retrieval fraco
  - temperaturas foram elevadas para sair do regime excessivamente rígido
- [provider-circuit.ts](/C:/Users/okidata/clarainova02/supabase/functions/_shared/provider-circuit.ts):
  - novo helper compartilhado para cooldown/circuit breaker curto por provedor
- [index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts):
  - embedding de consulta usa cooldown de provedor após `quota / spending cap / 429`
  - structured e stream deixam de insistir em outro modelo quando o erro já é claramente de indisponibilidade do provedor
  - stream passou a usar [stream-output.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/stream-output.ts) para filtrar partes `thought` e não confiar em `chunk.text` cru
- [embed-chunks/index.ts](/C:/Users/okidata/clarainova02/supabase/functions/embed-chunks/index.ts):
  - `EMBED_API_BATCH_SIZE` subiu de `5` para `10`
  - batches deixam de continuar cegamente quando a Google já entrou em quota/cooldown

## Q7 — Guard-rails operacionais e menos sistema servindo a si mesmo
- [index.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/index.ts):
  - `search_metrics` só roda com `CLARA_ENABLE_VERBOSE_SEARCH_METRICS=true`
- [evaluate_rag_batch.py](/C:/Users/okidata/clarainova02/scripts/corpus/evaluate_rag_batch.py):
  - benchmark canônico não pode mais atingir a produção oficial por acidente
  - produção exige `--allow-production` ou `CLARA_ALLOW_PRODUCTION_OPERATIONS=1`
- [reembed_active_corpus.py](/C:/Users/okidata/clarainova02/scripts/corpus/reembed_active_corpus.py):
  - re-embed oficial também ficou protegido por opt-in explícito
- [package.json](/C:/Users/okidata/clarainova02/package.json):
  - scripts explícitos de produção foram separados:
    - `rag:evaluate:canonical:production`
    - `rag:reembed:active:production`

## Testes e validação
- `python -m py_compile scripts/corpus/evaluate_rag_batch.py scripts/corpus/reembed_active_corpus.py`
- `npm test -- src/test/admin-governance.test.ts src/test/chat-generation-strategy.test.ts src/test/chat-provider-circuit.test.ts src/test/chat-stream-output.test.ts src/test/chat-telemetry-quality.test.ts src/test/chat-emergency-playbooks.test.ts src/test/ChatStructuredMessage.test.tsx`
- `npm run typecheck`
- `npm run validate`

## Resultado
- `npm run validate` green com `35` suites e `135` testes.
- Guard-rails de produção provados localmente:
  - benchmark canônico sem `--allow-production` agora falha antes de atingir a produção
  - re-embed oficial sem `--allow-production` agora falha antes de atingir a produção

## Próxima ação
- Publicar de forma limpa o pacote `Q1-Q7`, sem empacotar automaticamente arquivos paralelos de layout/dependências.
- Depois da publicação, validar remotamente:
  - qualidade real das respostas
  - redução de fan-out/custo
  - ativação correta do corpus após reprocessamento
