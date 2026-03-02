

# Corrigir Extração de PDF: Modelos Atualizados + Build Errors

## Diagnóstico

Confirmei na documentação oficial do Google que os seguintes modelos estao disponíveis com tier gratuito e suportam PDF como input:

- **gemini-3-flash-preview** -- modelo mais recente, suporta PDF, 1M tokens de input
- **gemini-2.5-flash** -- modelo estável, excelente custo-benefício
- **gemini-2.0-flash** -- quota esgotada na sua chave, mas mantido como fallback

O problema atual e que:
1. `gemini-2.0-flash` tem quota 0 na sua chave gratuita
2. `gemini-1.5-flash` retorna 404 porque a URL usa `v1beta` em vez de `v1`
3. Modelos mais novos (`gemini-3-flash-preview`, `gemini-2.5-flash`) tem quotas separadas e provavelmente disponíveis

## Plano de Correção

### 1. Atualizar modelos de extração

**Arquivo:** `supabase/functions/process-document/index.ts`

Trocar a lista de modelos para:
```
gemini-3-flash-preview -> gemini-2.5-flash -> gemini-2.0-flash
```

Cada modelo tem quota independente no tier gratuito, entao se um esgotar, o próximo assume.

### 2. Corrigir URL da API: v1beta para v1

Na funcao `extractTextWithGemini`, trocar:
```
v1beta/models/{model}:generateContent
```
por:
```
v1/models/{model}:generateContent
```

Isso resolve o erro 404 que impedia modelos como `gemini-1.5-flash` de funcionar e garante compatibilidade com todos os modelos.

### 3. Limpar documento travado

Atualizar o documento preso em "processing" para "error" no banco para permitir exclusao.

### 4. Corrigir build errors no chart.tsx

Os erros de TypeScript em `chart.tsx` sao causados por incompatibilidade de tipos com a versao atual do `recharts`. Correcao com type assertions para resolver.

## Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/process-document/index.ts` | Modelos: gemini-3-flash-preview, 2.5-flash, 2.0-flash + URL v1 |
| `src/components/ui/chart.tsx` | Fix TypeScript errors com type assertions |

## Resultado esperado

- Extração usara gemini-3-flash-preview (mais recente, quota separada)
- Se falhar, tenta gemini-2.5-flash, depois gemini-2.0-flash
- URL correta (v1) para todos os modelos
- Build sem erros

