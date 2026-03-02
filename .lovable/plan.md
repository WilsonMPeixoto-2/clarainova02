
# Atualizar Modelos Gemini Deprecados na Clarainova

## Problema Critico

Tres riscos de quebra iminente foram identificados:

1. **text-embedding-004** -- Ja desligado (Jan 2026). Usado em AMBAS as edge functions (chat e process-document). Embeddings estao funcionando por sorte ou cache, mas podem parar a qualquer momento.
2. **gemini-2.0-flash** -- Desliga em 1 Jun 2026. Usado como fallback no chat.
3. **gemini-1.5-flash** -- Modelo legado, ja dando 404.

## Alteracoes

### 1. Migrar embeddings: `text-embedding-004` para `gemini-embedding-001`

**Arquivo:** `supabase/functions/chat/index.ts`
- Linha 272: trocar endpoint de `text-embedding-004` para `gemini-embedding-001`
- Linha 277: trocar model de `models/text-embedding-004` para `models/gemini-embedding-001`

**Arquivo:** `supabase/functions/process-document/index.ts`
- Linha 372: trocar endpoint de `text-embedding-004` para `gemini-embedding-001`
- Linha 377: trocar model de `models/text-embedding-004` para `models/gemini-embedding-001`

### 2. Atualizar fallback de modelos do chat

**Arquivo:** `supabase/functions/chat/index.ts` (linhas 142-146)

De:
```
gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
```

Para:
```
gemini-2.5-flash, gemini-3-flash-preview, gemini-2.5-flash-lite
```

Remove os dois modelos deprecados/legados e adiciona alternativas seguras.

### 3. Redeploy das edge functions

Ambas as functions (`chat` e `process-document`) serao redeployadas apos as alteracoes.

## Nota sobre compatibilidade de embeddings

O `gemini-embedding-001` produz vetores de dimensao 768 por padrao (mesma dimensao do `text-embedding-004`), entao os embeddings existentes no banco continuam compativeis. Nao e necessario reprocessar documentos ja indexados.

## Arquivos editados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/chat/index.ts` | Migrar embedding model + atualizar fallback models |
| `supabase/functions/process-document/index.ts` | Migrar embedding model |
