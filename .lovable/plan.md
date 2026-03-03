

# Auditoria de Integracao e Limpeza — Relatorio de QA

## 1. Auditoria de Dependencias (package.json)

**Veredicto: OK — nenhuma acao necessaria.**

- `pdfjs-dist` (^4.9.155) — usado em `Admin.tsx` linha 18. Presente.
- `@langchain/textsplitters` (^1.0.1) — usado em `Admin.tsx` linha 19. Presente.
- `react-markdown` (^10.1.0) — usado em `ChatSheet.tsx`. Presente.

**Dependencias orfas: nenhuma encontrada.** Todos os pacotes instalados sao utilizados por componentes ativos do projeto (UI, chat, RAG, motion, etc). Nao ha pacotes residuais de tentativas anteriores.

---

## 2. Verificacao de Contratos (Frontend ↔ Backend)

### 2a. Admin.tsx ↔ Edge Function `embed-chunks`

**Frontend envia** (linha 170-171):
```
{ document_id, chunks: string[], start_index: number }
```

**Backend espera** (`embed-chunks/index.ts` linha ~21):
```
{ document_id, chunks, start_index = 0 }
```

**Veredicto: Contrato OK.** Tipos e nomes de campos batem perfeitamente. O `start_index` tem default no backend.

### 2b. ChatSheet/useChatStore ↔ Edge Function `chat`

**Frontend envia** (`useChatStore.tsx` linha 57):
```
{ messages: ChatMessage[] }   // ChatMessage = { role, content }
```

**Backend espera** (`chat/index.ts` linha ~139):
```
const { messages } = await req.json();
// Itera messages.map(m => ({ role, content }))
```

**Veredicto: Contrato OK.** A desestruturacao bate perfeitamente.

---

## 3. Limpeza de Codigo Morto

### 3a. Edge Function `process-document` — CODIGO MORTO

Esta funcao e o antigo pipeline server-side que foi totalmente substituido pela arquitetura client-side (pdf.js + LangChain no navegador + `embed-chunks`). **Nenhum arquivo do frontend a invoca.** Ela ainda usa `.insert()` em vez de `.upsert()`, nao tem retry, e nao valida chunks — todos os problemas que o hardening resolveu no novo pipeline.

**Acao: Deletar `supabase/functions/process-document/index.ts` e remover a entrada `[functions.process-document]` do `config.toml`.**

### 3b. Console logs em Admin.tsx

Existem 3 ocorrencias de console.warn/error no Admin.tsx:
- Linha 140: `console.warn` no retry — **manter** (util para debug de producao, ocorre raramente)
- Linha 331: `console.error` em falha de batch — **manter** (erro real)
- Linha 494: `console.error` em falha geral — **manter** (erro real)

**Veredicto: Nenhum `console.log` de debug excessivo. Todos os logs sao de erro/warning legitimamente uteis.**

### 3c. Console logs nas Edge Functions

- `chat/index.ts`: 1 `console.log` (linha ~223 "Using model:") e varios `console.warn`/`console.error`. Todos sao operacionais e uteis. **Manter.**
- `embed-chunks/index.ts`: 1 `console.error` para erros de embedding, 1 para upsert. **Manter.**
- `process-document/index.ts`: Muitos `console.log` de debug. **Sera deletado inteiro.**

### 3d. Variaveis nao utilizadas em Admin.tsx

- `TIMEOUT_SECONDS` (linha 153) e `formatTimer` (linha 155) — usados para timers de documentos legacy server-side (linhas 254-273, 654-657, 676-691). Com a remocao do `process-document`, documentos nunca mais terao status "processing" vindo do server. Porem, esses timers protegem contra documentos que ficaram "stuck" no passado, entao **podem ficar** como safety net.

---

## Resumo de Acoes

| Acao | Arquivo | Motivo |
|------|---------|--------|
| Deletar | `supabase/functions/process-document/index.ts` | Pipeline server-side obsoleto, substituido por client-side |
| Remover entrada | `supabase/config.toml` (linhas 9-10) | Config da funcao deletada |

**Total: 2 mudancas. Nenhum pacote a remover. Nenhum contrato quebrado. Nenhum console.log de debug excessivo.**

