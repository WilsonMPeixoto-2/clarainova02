

# Substituir splitIntoChunks por LangChain RecursiveCharacterTextSplitter

## Resumo

Trocar a funcao customizada de chunking por palavra (`splitIntoChunks`) pelo `RecursiveCharacterTextSplitter` do LangChain, que prioriza quebras de paragrafo e limites semanticos. Nenhuma outra parte do pipeline sera alterada.

## Mudancas

### 1. Instalar dependencia

Adicionar `langchain` ao `package.json` (dependencies). O import sera:

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
```

### 2. Editar `src/pages/Admin.tsx`

**Remover** (linhas 42-56): a funcao `splitIntoChunks` e o comentario associado.

**Adicionar** no topo do arquivo (apos os imports existentes):

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const langChainSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""],
});

async function splitWithLangChain(rawText: string): Promise<string[]> {
  const normalized = rawText.replace(/\u0000/g, "").trim();
  const chunks = await langChainSplitter.splitText(normalized);
  return chunks.filter((c) => c.trim().length >= 3);
}
```

**Substituir** as duas chamadas a `splitIntoChunks`:

- Linha 211: `const chunks = splitIntoChunks(text, 500, 50);` vira `const chunks = await splitWithLangChain(text);`
- Linha 409: `const chunks = splitIntoChunks(text, 500, 50);` vira `const chunks = await splitWithLangChain(text);`

Ambos os pontos ja estao dentro de funcoes `async`, entao basta adicionar `await`.

### 3. Nenhuma outra alteracao

O resto do pipeline permanece identico: upload, progresso, chamadas ao `embed-chunks`, validacao de `fnData?.error`, verificacao de chunks salvos no banco, e marcacao de status "processed".

## Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Admin.tsx` | Remover `splitIntoChunks`, importar LangChain, criar `splitWithLangChain`, substituir 2 chamadas |

## Impacto no chunking

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Unidade de medida | 500 palavras | 1000 caracteres |
| Overlap | 50 palavras | 200 caracteres |
| Separadores | Nenhum (split por whitespace) | `\n\n`, `\n`, ` `, `""` (prioriza paragrafos) |
| Filtragem | Nenhuma | Remove chunks < 3 chars e caracteres NUL |

