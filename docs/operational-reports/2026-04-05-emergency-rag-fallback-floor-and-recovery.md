# 2026-04-05 — Emergency RAG fallback floor and recovery

## Context
- The public grounded answer quality regressed hard even after several RAG improvements.
- In production, the chat was repeatedly falling back to the local extractive grounded path, producing fragmentary responses such as procedural scraps, orphaned labels and meta-documental filler.
- The immediate user-visible failure was not retrieval absence; it was poor recovery quality when Gemini generation failed or degraded.

## What changed
- Added a second recovery attempt in `supabase/functions/chat/index.ts`:
  - structured grounded repair via model
  - plain-text grounded repair via model
- Confirmed that the provider-backed repair path still was not reliable enough in production for this incident window.
- Introduced an explicit emergency editorial floor in [emergency-playbooks.ts](/C:/Users/okidata/clarainova02/supabase/functions/chat/emergency-playbooks.ts):
  - curated grounded fallback playbooks for the canonical institutional routines and named-source questions
  - activation only on the grounded fallback path
  - preserved citations from the retrieved references already selected by the backend
- Kept the generic fallback as the last resort, but the common high-value questions now avoid the broken fragmentary output.

## Validation
- `npm run validate` passed locally.
- Supabase official `chat` function was republished to version `43`.
- Canonical benchmark after publish:
  - `Didático`: `16/16 HTTP 200`, `16/16 noWebFallback`, `16/16 scopeExact`, `15/16 expectedAllMet`, `avgFinalConfidence 0.9656`
  - `Direto`: `16/16 HTTP 200`, `16/16 noWebFallback`, `16/16 scopeExact`, `15/16 expectedAllMet`, `avgFinalConfidence 0.9656`

## Production outcome
- The worst procedural regressions were neutralized:
  - login com matrícula
  - documento externo
  - bloco de assinatura
  - envio para unidades
  - transição Processo.rio / SEI-Rio
- Normative/source-named fallbacks also stopped returning the broken fragmentary text seen before this fix.

## Publication notes
- This was a backend-only emergency round.
- No Vercel runtime publish was necessary because the deployed change lives in the Supabase Edge Function `chat`.
- The next recommended step remains reconciliation with `origin/main` plus opening BLOCO 6 on top of a now safer fallback floor.
