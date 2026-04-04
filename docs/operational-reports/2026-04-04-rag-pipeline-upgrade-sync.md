## RAG State-of-the-Art — Sincronização de Continuidade

- Data: 2026-04-04
- Base verificada: `origin/main @ 10291b004d4bfbecf50fa09695101c210d59a9eb`
- Deploy de produção observado: `dpl_4FSCwyQZrGGm3BkkeMQijDU4wMQE` (`READY`)
- Escopo verificado no Git: `7` arquivos alterados no commit `c13e425`

### O que foi confirmado no código

#### 1. Search & Retrieval
- `supabase/functions/chat/index.ts` agora executa expansão de consulta com `gemini-3.1-flash-lite-preview`, timeout de `3s` e fallback gracioso para a pergunta original.
- A embedding final da consulta pode combinar a embedding original com a embedding da consulta expandida via média normalizada.
- A chamada ao `hybrid_search_chunks` foi ampliada de `match_count: 8` para `match_count: 12`.
- O chat agora injeta `QUALIDADE DA RECUPERACAO` no prompt com tier, cobertura lexical e diversidade documental.
- O contexto de conhecimento pode ser enriquecido com chunks adjacentes do mesmo documento quando a recuperação é forte.

#### 2. Geração e schema de resposta
- `supabase/functions/chat/response-schema.ts` passou a expor ao Gemini os campos:
  - `questionUnderstandingConfidence`
  - `finalConfidence`
  - `ambiguityInUserQuestion`
  - `ambiguityInSources`
  - `userNotice`
  - `cautionNotice`
- `supabase/functions/chat/knowledge.ts` reforçou as instruções de consolidação multi-fonte com regras explícitas para complementaridade, sobreposição e contradição.

#### 3. Processamento documental
- `src/lib/admin-ingestion.ts` abandonou o splitter fixo e passou a usar chunking semântico por seções, parágrafos e frases.
- O frontend agora detecta `sectionTitle` por heading retrospectivo e inclui esse dado no payload do chunk.
- Houve uma mudança de contrato importante: uploads futuros voltam a incluir prefixo automático `[Fonte: ... | Página: ...]` em `chunk.content`.
- Isso substitui a decisão anterior de manter o texto dos chunks estritamente limpo; a linha atual privilegia compatibilidade com a atribuição de fontes já usada no backend.

#### 4. UI/UX do grounded output
- `src/components/chat/ChatStructuredMessage.tsx` ganhou:
  - badge visual de confiança
  - botão de copiar resposta
  - colapso/expansão de listas longas
  - badges de citação clicáveis com scroll e highlight na lista de referências
- `src/index.css` recebeu o suporte visual para esses elementos.

#### 5. Observabilidade
- `supabase/functions/chat/index.ts` agora calcula e registra:
  - `rag_quality_score`
  - `expanded_query`

### O que foi confirmado no ambiente remoto

- `origin/main` já contém o merge `10291b0` com o uplift do RAG.
- O deploy canônico mais recente de produção está `READY` e corresponde a esse merge:
  - deployment: `dpl_4FSCwyQZrGGm3BkkeMQijDU4wMQE`
  - commit: `10291b004d4bfbecf50fa09695101c210d59a9eb`
- A Edge Function remota `chat` já foi republicada e está em:
  - versão `15`
  - `verify_jwt = false`
- `embed-chunks` e `get-usage-stats` permanecem nas versões já conhecidas do hardening anterior; o uplift do RAG desta rodada não exigiu nova publicação de `embed-chunks`.

### Implicações práticas

- A CLARA já roda em produção com uma camada RAG mais sofisticada do que a continuidade oficial vinha registrando.
- O próximo upload de PDF passará a usar chunking semântico com `sectionTitle` e prefixo automático de fonte/página.
- A documentação anterior que afirmava “chunks novos usam texto limpo, sem prefixo legado” deixou de ser verdade para uploads futuros e foi atualizada nesta rodada.

### Próxima ação recomendada

1. Validar a deduplicação em produção repetindo o reupload do mesmo PDF.
2. Depois disso, abrir a carga curada do corpus inicial já sob a base nova do RAG:
   - query expansion
   - match window maior
   - confidence-aware prompting
   - semantic chunking
   - richer grounded UI
