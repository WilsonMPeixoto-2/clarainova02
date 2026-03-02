

# Corrigir Processamento de PDFs Grandes + Erros de Embedding

## Problemas Identificados nos Logs

1. **"Memory limit exceeded"** -- O PDF de 14MB e baixado inteiro para memoria (`Uint8Array`) dentro da edge function. Isso estoura o limite de ~50MB de RAM.
2. **Embedding model 404** -- O modelo `text-embedding-004` retorna erro "not found for API version v1beta". A URL precisa usar `v1` em vez de `v1beta`, ou o modelo precisa do prefixo correto.
3. **Documentos presos na UI** -- Documentos com status "processing" ou "error" ficam sem opcao clara de exclusao. O botao de delete ja existe, mas documentos em "processing" nao mostram ele de forma visivel.

## Plano de Correcao

### 1. Edge Function: Eliminar download do PDF para memoria

**Arquivo:** `supabase/functions/process-document/index.ts`

Em vez de baixar o PDF inteiro para um `Uint8Array` (linha 149), fazer upload para o Gemini File API usando **streaming** -- ler o body do fetch como stream e enviar diretamente ao Gemini sem acumular tudo na memoria.

Mudanca principal na funcao `uploadToGeminiViaUrl`:
- Usar `pdfResponse.body` (ReadableStream) diretamente no corpo do upload ao Gemini, sem chamar `arrayBuffer()`
- Obter o tamanho do arquivo via header `Content-Length` da resposta do signed URL
- Isso reduz o uso de memoria de ~14MB para quase zero

### 2. Edge Function: Corrigir URL do modelo de embeddings

**Arquivo:** `supabase/functions/process-document/index.ts`

O log mostra: `models/text-embedding-004 is not found for API version v1beta`

Correcao: Trocar a URL de embeddings de `v1beta` para `v1`:
```
v1beta/models/text-embedding-004:embedContent
→ v1/models/text-embedding-004:embedContent
```

### 3. Edge Function: Aumentar chunks para textos longos

O log mostra "65595 chars" resultando em apenas 1 chunk. Com `targetWords=500` e um texto de ~10k palavras, algo esta errado. Vou verificar e ajustar o chunking para garantir que textos longos sejam divididos corretamente (provavelmente o problema e que 65k chars ~ 10k palavras, mas o chunk de 500 palavras deveria gerar ~20 chunks -- preciso confirmar se o bug e no log ou no codigo).

### 4. Admin UI: Garantir que documentos em qualquer status possam ser deletados

**Arquivo:** `src/pages/Admin.tsx`

O botao de delete ja existe para todos os documentos, mas vou verificar se esta visivel em todos os estados (inclusive "processing"). Tambem vou garantir que o botao de delete apareca com destaque para documentos com erro ou travados.

## Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/process-document/index.ts` | Streaming upload (sem arrayBuffer), fix URL embeddings v1beta→v1 |
| `src/pages/Admin.tsx` | Pequenos ajustes na visibilidade do botao delete |

## Resultado Esperado

- PDFs de 14MB+ serao processados sem estourar memoria
- Embeddings serao gerados corretamente (sem erro 404)
- Documentos travados/com erro poderao ser deletados facilmente

