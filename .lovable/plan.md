

# Painel de Uso na pagina Admin

## Objetivo

Adicionar um card de monitoramento na pagina `/admin` para acompanhar o consumo das Edge Functions (Cloud) e chamadas a API do Gemini, sem depender de APIs externas de billing.

## Abordagem

Como nao existe API para consultar o saldo do Lovable Cloud nem do Google AI Studio diretamente, a solucao e **registrar cada chamada internamente** no banco de dados e exibir os totais no Admin.

## Etapas

### 1. Criar tabela `usage_logs` (migracao SQL)

Tabela simples para registrar cada chamada:

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | Chave primaria |
| event_type | text | `chat_message`, `embedding_query`, `pdf_extraction`, `embedding_generation` |
| created_at | timestamptz | Data/hora do evento |
| metadata | jsonb | Dados opcionais (ex: tokens estimados, document_id) |

- RLS: leitura publica (dados nao sensiveis, apenas contadores)
- Sem foreign keys complexas

### 2. Atualizar Edge Function `chat`

Ao final de cada resposta bem-sucedida, inserir 1-2 registros na tabela `usage_logs`:
- `chat_message` (1 por pergunta)
- `embedding_query` (1 por busca RAG, quando ocorre)

Impacto minimo: apenas um INSERT adicional por mensagem.

### 3. Atualizar Edge Function `process-document`

Registrar eventos durante o processamento:
- `pdf_extraction` (1 por PDF enviado ao Gemini)
- `embedding_generation` (1 por PDF, com quantidade de chunks no metadata)

### 4. Adicionar card de uso no Admin

Novo card na pagina `Admin.tsx` exibindo:

- **Mensagens do chat** (total do mes atual)
- **Buscas RAG** (total do mes atual)
- **PDFs processados** (total do mes atual)
- **Embeddings gerados** (total do mes atual)

Informacoes contextuais fixas (texto explicativo):
- "Edge Functions: incluidas nos US$ 25/mes do Cloud"
- "API Gemini: uso gratuito via Google AI Studio"
- "Gateway Lovable AI (US$ 1/mes): nao utilizado"

### 5. Criar Edge Function `get-usage-stats`

Uma funcao simples que consulta a tabela `usage_logs` agrupando por `event_type` no mes atual e retorna os totais. O Admin chama essa funcao para exibir os dados.

---

## Resumo tecnico

| Componente | Alteracao |
|---|---|
| Nova tabela `usage_logs` | Migracao SQL |
| `supabase/functions/chat/index.ts` | Adicionar INSERT de log |
| `supabase/functions/process-document/index.ts` | Adicionar INSERT de log |
| Nova Edge Function `get-usage-stats` | Consulta agrupada |
| `src/pages/Admin.tsx` | Novo card com estatisticas |

Custo adicional: praticamente zero (INSERTs leves no banco ja incluso).

