

# RAG Completo para CLARA -- com solucao anti-falha de PDF

## O problema do projeto anterior

PDFs gerados ou modificados por Chrome, Edge, Adobe e downloads em dispositivos moveis frequentemente tem formatos internos diferentes. Bibliotecas tradicionais de parsing (como `pdf-parse`) falham silenciosamente ou extraem texto corrompido/vazio nesses casos.

## A solucao: Gemini extrai o texto

Em vez de usar bibliotecas de parsing no servidor, vamos enviar o PDF diretamente para a **API multimodal do Gemini** (`gemini-2.5-flash`), que consegue ler qualquer PDF -- Adobe, Chrome, Edge, escaneado, modificado, etc. O Gemini faz OCR automaticamente quando necessario.

Fluxo:
```text
[Upload PDF no Admin]
    --> Storage bucket "documents"
    --> Edge Function "process-document"
        --> Envia PDF como base64 para Gemini (multimodal)
        --> Gemini extrai texto completo
        --> Divide em fragmentos (~500 palavras)
        --> Gera embeddings (text-embedding-004)
        --> Salva fragmentos + vetores no banco (pgvector)

[Usuario pergunta no chat]
    --> Edge Function "chat"
        --> Gera embedding da pergunta
        --> Busca 5 fragmentos mais relevantes (similaridade cosseno)
        --> Injeta no prompt do Gemini como contexto
        --> Resposta em streaming
```

---

## Etapas de implementacao

### 1. Banco de dados (migracao SQL)

- Ativar extensao `vector` (pgvector)
- Criar tabela `documents` (id, nome, status, created_at)
- Criar tabela `document_chunks` (id, document_id, conteudo, embedding vector(768), posicao)
- Criar funcao SQL `match_chunks(query_embedding, match_count)` para busca por similaridade
- RLS desabilitado (conteudo publico de consulta legislativa)

### 2. Storage bucket

- Criar bucket `documents` (publico) para armazenar os PDFs originais

### 3. Edge Function `process-document` (NOVA)

Arquivo: `supabase/functions/process-document/index.ts`

Fluxo:
1. Recebe `document_id` via POST
2. Baixa o PDF do bucket storage
3. Converte para base64
4. Envia para Gemini como conteudo multimodal com prompt: "Extraia todo o texto deste documento, mantendo a estrutura"
5. Divide o texto extraido em fragmentos de ~500 palavras com 50 palavras de sobreposicao
6. Gera embeddings para cada fragmento usando `text-embedding-004`
7. Salva tudo na tabela `document_chunks`
8. Atualiza status do documento para "processed"

Usa a mesma `GEMINI_API_KEY` ja configurada. Custo zero.

### 4. Atualizar Edge Function `chat`

Modificar `supabase/functions/chat/index.ts`:

- Gerar embedding da pergunta do usuario usando `text-embedding-004`
- Chamar funcao SQL `match_chunks` para buscar os 5 fragmentos mais relevantes
- Adicionar os trechos encontrados no `SYSTEM_PROMPT` como secao "Base de Conhecimento"
- Instruir a CLARA a priorizar informacoes da base de conhecimento nas respostas

### 5. Pagina Admin (frontend)

Nova pagina: `src/pages/Admin.tsx`
- Upload de PDFs com drag-and-drop ou botao
- Lista de documentos com status (processando/pronto/erro)
- Botao para remover documentos
- Rota `/admin` adicionada ao `App.tsx`

---

## Por que isso resolve o problema anterior

| Problema anterior | Solucao agora |
|---|---|
| `pdf-parse` falhava com PDFs do Chrome/Edge | Gemini le qualquer formato de PDF via multimodal |
| PDFs escaneados nao tinham texto extraivel | Gemini faz OCR automaticamente |
| Arquivos modificados por download corrompiam | Gemini processa o arquivo visual, nao depende da estrutura interna |
| Bibliotecas incompativeis com Deno runtime | Sem dependencia de bibliotecas -- so chamada de API |

## Custos

| Componente | Custo |
|---|---|
| Gemini 2.5 Flash (extracao de texto + chat) | Gratuito |
| Gemini text-embedding-004 (embeddings) | Gratuito |
| pgvector no banco | Incluido no plano |
| Storage bucket | Incluido no plano |
| Edge Functions | Incluido no plano |
| **Total** | **R$ 0** |

