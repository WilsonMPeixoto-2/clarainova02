

# Corrigir Falso Positivo de Processamento e Filtrar Chunks Vazios

## Problema

O frontend marca documentos como "processados" mesmo quando a Edge Function retorna erro no corpo da resposta. Isso acontece porque `supabase.functions.invoke()` so retorna `error` para falhas de transporte (rede). Erros HTTP 400/500 com JSON no body passam despercebidos.

## Mudancas

### 1. Edge Function `embed-chunks` -- filtrar chunks vazios

**Arquivo:** `supabase/functions/embed-chunks/index.ts`

Apos receber os chunks, filtrar strings vazias ou com menos de 3 caracteres antes de enviar ao Gemini. Se todos forem invalidos, retornar erro 400.

```text
Antes:  chunks vao direto para a API do Gemini
Depois: chunks passam por filtro (>= 3 chars) antes do processamento
```

### 2. Frontend `Admin.tsx` -- validar resposta completa

**Arquivo:** `src/pages/Admin.tsx`

Em dois pontos (upload em `processFileClientSide` ~linha 272 e retry em `handleRetry` ~linha 404):

- Capturar o `data` retornado: `const { data: fnData, error: fnErr }`
- Verificar `fnData?.error` alem de `fnErr`
- Se houver erro de aplicacao, lancar excecao

### 3. Frontend `Admin.tsx` -- verificacao pos-processamento

Antes de marcar como "processed" (~linhas 292 e 417), consultar `document_chunks` para confirmar que chunks existem no banco:

```text
Se count == 0 -> lancar erro em vez de marcar como "processed"
```

### 4. Frontend `Admin.tsx` -- preservar estado de uploads anteriores

Na linha 322, trocar `setIngestions([])` por `setIngestions(prev => [...prev])` para nao limpar o progresso de arquivos anteriores durante upload multiplo.

### 5. Deploy automatico

A Edge Function `embed-chunks` sera deployada automaticamente apos a edicao.

## Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/embed-chunks/index.ts` | Filtrar chunks com < 3 caracteres |
| `src/pages/Admin.tsx` | Validar `fnData?.error`, verificar chunks no banco, preservar ingestions |

## Resultado esperado

- Documentos so sao marcados "processed" se chunks realmente existem no banco
- Chunks vazios nunca chegam ao Gemini
- Erros de aplicacao sao exibidos no toast em vez de engolidos
- Upload multiplo nao perde progresso de arquivos anteriores
