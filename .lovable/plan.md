

# Fix: Suporte a PDFs Grandes (50-100MB) + Correcao do Processamento

## Problemas Identificados

1. **Stack overflow na conversao base64** -- o spread operator na linha 64 (`...bytes.subarray()`) estoura a pilha de chamadas
2. **PDFs grandes (50-100MB)** -- o metodo `inline_data` do Gemini tem limite de ~20MB. PDFs maiores precisam ser enviados pela File API do Gemini
3. **Timeout da edge function** -- PDFs grandes podem levar mais de 60s para processar
4. **Sem feedback real** no Admin sobre progresso ou erros

## Solucao

### 1. Conversao base64 segura (edge function)
Substituir o spread operator por loop byte-a-byte que nunca estoura a pilha:

```typescript
for (let j = 0; j < chunk.length; j++) {
  binary += String.fromCharCode(chunk[j]);
}
```

### 2. Gemini File API para PDFs grandes
Para arquivos acima de ~15MB, usar a File API do Gemini em vez de inline_data:
- Fazer upload do PDF para `generativelanguage.googleapis.com/upload/v1beta/files`
- Aguardar o processamento (polling do status)
- Referenciar o arquivo pelo URI no `generateContent`
- Isso suporta arquivos ate 2GB

Logica condicional:
- PDF <= 15MB: usar `inline_data` (mais rapido, direto)
- PDF > 15MB: usar File API (upload + referencia)

### 3. Aumentar timeout da edge function
Configurar `wall_clock_limit` no `config.toml` para 300s (5 minutos), permitindo processar PDFs grandes sem corte.

### 4. Melhorar feedback no Admin UI
- Mostrar tempo decorrido ("Processando... 45s") ao lado de documentos pendentes
- Botao "Reprocessar" para documentos com erro ou travados
- Toast automatico quando status muda para "Pronto" ou "Erro"
- Mostrar tamanho do arquivo na tabela

## Detalhes Tecnicos

### Arquivos a editar

**`supabase/functions/process-document/index.ts`**
- Corrigir loop base64 (linhas 62-65) -- byte-a-byte
- Adicionar funcao `uploadToGeminiFileAPI()` que faz upload via multipart
- Adicionar funcao `waitForFileProcessing()` com polling
- Logica condicional: se `bytes.length > 15_000_000`, usar File API; senao, inline_data
- Ambos os caminhos chamam o mesmo `generateContent` no final

**`supabase/config.toml`**
- Adicionar configuracao de timeout para a funcao process-document:
```toml
[functions.process-document]
verify_jwt = false

[functions.process-document.limits]
wall_clock_limit = 300
```

**`src/pages/Admin.tsx`**
- Adicionar estado `processingStart` para rastrear tempo por documento
- Timer visual com `useEffect` + `setInterval`
- Funcao `handleRetry(doc)` para reprocessar documentos com erro
- Toast ao detectar mudanca de status nos documentos
- Exibir tamanho do arquivo na tabela de documentos

