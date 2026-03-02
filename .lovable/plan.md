

# Adicionar Botao "Reprocessar" Visivel na Tabela de Documentos

## Problema

No mobile, a terceira coluna da tabela (que contem os botoes de acao como Reprocessar e Deletar) esta sendo cortada ou e muito estreita para ser notada. O usuario ve "Possivel falha -- tente reprocessar" mas nao encontra o botao correspondente.

## Solucao

Tornar o botao de reprocessar visivel diretamente abaixo do status quando o documento esta em estado de erro/timeout, em vez de depender exclusivamente da coluna de acoes estreita.

### Mudancas em `src/pages/Admin.tsx`

1. **Adicionar botao "Reprocessar" inline no status**: Quando `canRetry(doc)` for verdadeiro, renderizar um botao clicavel logo abaixo do texto de status, com icone RefreshCw e texto "Reprocessar". Isso garante visibilidade em qualquer tamanho de tela.

2. **Adicionar botao "Excluir" inline tambem**: Para documentos com erro, mostrar um link "Excluir" abaixo do status.

3. **Manter a coluna de acoes existente** para desktop (sem regressao).

### Exemplo visual do resultado

```text
| Nome                    | Status                          |
|-------------------------|---------------------------------|
| SEI-Guia-do-usuario...  | Possivel falha                  |
|                         | [Reprocessar] [Excluir]         |
```

## Detalhe tecnico

Na celula de Status (`TableCell`), apos o `statusLabel`, adicionar condicionalmente:

```tsx
{canRetry(doc) && (
  <div className="flex gap-2 mt-1">
    <Button size="sm" variant="outline" onClick={() => handleRetry(doc)}>
      <RefreshCw className="h-3 w-3 mr-1" /> Reprocessar
    </Button>
    <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
      <Trash2 className="h-3 w-3 mr-1" /> Excluir
    </Button>
  </div>
)}
```

## Arquivo a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Admin.tsx` | Adicionar botoes inline na celula de status para documentos com erro/timeout |

