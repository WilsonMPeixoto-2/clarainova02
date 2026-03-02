

# Fix: Upload de PDF Travado + Feedback Visual Completo

## Diagnostico

O problema principal e que o `config.toml` NAO configura `verify_jwt = false` para a funcao `process-document`. Isso significa que a funcao rejeita as chamadas do frontend com erro 401 silenciosamente -- o documento fica preso em "processing" para sempre.

Alem disso, a funcao `triggerProcessing` usa `fetch().catch(console.error)` (fire-and-forget), entao erros de autenticacao ou rede sao ignorados sem atualizar o status do documento.

## Mudancas

### 1. Configurar `config.toml` com `verify_jwt = false`

Sem isso, nenhum PDF sera processado. A funcao precisa aceitar chamadas com a anon key.

```toml
project_id = "qnyoxmngkimkypfudctf"

[functions.process-document]
verify_jwt = false
```

### 2. Corrigir `triggerProcessing` com tratamento de erro

Substituir o fetch fire-and-forget por `supabase.functions.invoke()`, que ja usa as credenciais corretas. Se falhar, atualizar o status do documento para "error" imediatamente.

### 3. Upload com progresso real em bytes (XMLHttpRequest)

Substituir `supabase.storage.upload()` por upload via `XMLHttpRequest` direto na API REST do Storage. Isso permite:
- Progresso real em percentual por bytes enviados
- Exibicao de "12MB / 28MB" e velocidade estimada
- Funciona com PDFs de 50-100MB

### 4. Botao Cancelar para documentos travados

Adicionar um botao "X" ao lado de documentos em `pending`/`processing` que:
- Atualiza o status para "cancelled"
- Remove chunks parciais do banco

### 5. Deteccao visual de timeout

Se um documento fica em `processing` por mais de 5 minutos:
- Timer muda de cor para vermelho/amarelo
- Texto muda para "Possivel falha - tente reprocessar"

### 6. Fases visuais separadas

Separar claramente na UI:
- **Enviando**: barra com % real de bytes (fase upload)
- **Na fila / Processando**: timer com spinner
- **Possivel falha**: alerta apos 5 min
- **Pronto / Erro**: icones definitivos

## Arquivos a editar

**`supabase/config.toml`**
- Adicionar secao `[functions.process-document]` com `verify_jwt = false`

**`src/pages/Admin.tsx`**
- Substituir `triggerProcessing` por `supabase.functions.invoke("process-document", ...)` com tratamento de erro
- Implementar upload via XMLHttpRequest para progresso real em bytes
- Adicionar estado de upload por arquivo (bytes enviados / total)
- Adicionar botao cancelar (`handleCancel`)
- Adicionar deteccao de timeout visual (5 min)
- Melhorar estados visuais com cores e mensagens claras
- Adicionar formatacao de tamanho (ex: "12.5 MB / 28.0 MB")

