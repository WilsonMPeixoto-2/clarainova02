

# Guia Completo: Backend da CLARA sem Lovable Cloud

## Visao Geral

Este guia vai te levar do zero ate ter o chat da CLARA funcionando com IA, usando **sua propria conta Supabase** (gratuita) e o **Vercel** que voce ja usa. Nenhuma dependencia do Lovable.

---

## Arquitetura Final

```text
+------------------+       +-------------------+       +--------------------+
|   Frontend       |       |   Supabase        |       |   API de IA        |
|   (Vercel)       | ----> |   Edge Function   | ----> |   (OpenAI / Google)|
|                  |       |   "chat"          |       |                    |
|  React + Vite    | <---- |                   | <---- |                    |
+------------------+       +-------------------+       +--------------------+
                           |   PostgreSQL      |
                           |   (opcional fase 3)|
                           +-------------------+
```

---

## ETAPA 1 - Interface do Chat (Frontend puro, sem backend)

**Objetivo:** Criar o visual do chat e conectar todos os 7 botoes. Tudo funciona local, sem API.

### 1.1 Criar o estado global do chat

Criar arquivo `src/hooks/useChatStore.ts`:

```typescript
// Um React Context simples para:
// - abrir/fechar o chat (isOpen)
// - armazenar mensagens em memoria [{role, content}]
// - pre-preencher uma pergunta (pendingQuestion)
// - funcao sendMessage (por enquanto, responde com mensagem fixa)
```

O estado precisa de:
- `isOpen: boolean`
- `messages: {role: 'user' | 'assistant', content: string}[]`
- `pendingQuestion: string | null`
- `openChat(question?: string): void`
- `closeChat(): void`
- `sendMessage(text: string): void`

### 1.2 Criar o componente ChatSheet

Criar arquivo `src/components/ChatSheet.tsx`:

- No **desktop**: um drawer lateral direito (usa o componente Sheet que ja existe)
- No **mobile**: sheet fullscreen
- Dentro: lista de mensagens + campo de input + botao enviar
- Renderizar markdown nas respostas (instalar `react-markdown`)

### 1.3 Conectar os 7 pontos de entrada

Todos os botoes abaixo chamarao `openChat()`:

| Componente | Botao/Elemento | Acao |
|---|---|---|
| `HeroSection.tsx` | "Iniciar conversa" | `openChat()` |
| `HeroSection.tsx` | 12 chips de perguntas | `openChat(question)` |
| `Header.tsx` | Botao "Chat" no header | `openChat()` |
| `Header.tsx` | "Chat com CLARA" no drawer | `openChat()` |
| `FeaturesSection.tsx` | 3x "Explorar no chat" | `openChat(feature.title)` |
| `FAQSection.tsx` | "Levar essa duvida para o chat" | `openChat(faq.question)` |
| `FeaturesSection.tsx` | "Iniciar analise com a CLARA" | `openChat()` |

### 1.4 Renderizar na pagina

Em `Index.tsx`, adicionar `<ChatSheet />` e envolver com o Provider do chat.

**Resultado da Etapa 1:** Chat visual funcionando, botoes conectados, respostas mockadas.

**Dependencia para instalar:** `react-markdown`

---

## ETAPA 2 - Supabase Proprio + Edge Function

**Objetivo:** Criar sua conta Supabase, uma Edge Function que chama a API de IA, e conectar o frontend.

### 2.1 Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em "New Project"
3. Escolha nome (ex: `clara-backend`), senha do banco, e regiao (`South America` se disponivel)
4. Aguarde o projeto ser criado (~2 min)
5. Va em **Project Settings > API** e anote:
   - `Project URL` (ex: `https://abcdefg.supabase.co`)
   - `anon public key` (a chave publica, comeca com `eyJ...`)

### 2.2 Instalar Supabase CLI no seu computador

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via npm (qualquer sistema)
npm install -g supabase
```

### 2.3 Inicializar Supabase no seu projeto

Na raiz do seu projeto (o que esta no Vercel):

```bash
supabase init
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

O `project-ref` e o ID que aparece na URL do seu projeto Supabase (ex: `abcdefg` de `https://abcdefg.supabase.co`).

### 2.4 Obter chave de API de IA

Voce precisa de UMA chave de API de um provedor de IA. Opcoes:

| Provedor | Modelo Recomendado | Custo |
|---|---|---|
| Google AI Studio | Gemini 2.5 Flash | Gratuito ate certo limite |
| OpenAI | GPT-4o-mini | ~$0.15/1M tokens |

**Google AI Studio (recomendado para comecar gratis):**
1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em "Get API Key" > "Create API Key"
3. Copie a chave

### 2.5 Adicionar a chave como Secret no Supabase

```bash
supabase secrets set AI_API_KEY=sua_chave_aqui
```

### 2.6 Criar a Edge Function

```bash
supabase functions new chat
```

Isso cria `supabase/functions/chat/index.ts`. Substitua o conteudo por:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const AI_API_KEY = Deno.env.get("AI_API_KEY");

    if (!AI_API_KEY) throw new Error("AI_API_KEY not configured");

    // === Google Gemini ===
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Voce e a CLARA - Consultora de Legislacao e Apoio a 
              Rotinas Administrativas. Especializada em SEI-Rio, processos 
              administrativos, legislacao municipal do Rio de Janeiro, e 
              rotinas de gestao publica. Responda sempre em portugues 
              brasileiro, de forma clara e fundamentada.`,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro na API de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 2.7 Deploy da Edge Function

```bash
supabase functions deploy chat --no-verify-jwt
```

O `--no-verify-jwt` permite chamadas publicas (sem login). Voce pode restringir depois na Etapa 4.

### 2.8 Testar a funcao

```bash
curl -X POST https://SEU_PROJECT_REF.supabase.co/functions/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -d '{"messages": [{"role": "user", "content": "O que e o SEI?"}]}'
```

### 2.9 Conectar o frontend

No seu projeto, crie/atualize o arquivo `.env`:

```
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua_anon_key...
```

No `useChatStore.ts`, substitua a resposta mockada por uma chamada real:

```typescript
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Na funcao sendMessage, fazer fetch com streaming SSE
// (codigo de streaming fornecido no contexto acima)
```

### 2.10 Configurar variaveis no Vercel

No painel do Vercel:
1. Va em **Settings > Environment Variables**
2. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Faca redeploy

**Resultado da Etapa 2:** Chat funcional com IA respondendo em tempo real via streaming.

---

## ETAPA 3 - Persistencia de Conversas (Banco de Dados)

**Objetivo:** Salvar conversas para o usuario poder retomar depois.

### 3.1 Criar tabelas no Supabase

No painel do Supabase, va em **SQL Editor** e execute:

```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
```

### 3.2 Habilitar RLS (Row Level Security)

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politica publica (sem auth por enquanto)
CREATE POLICY "allow_all_conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "allow_all_messages" ON messages FOR ALL USING (true);
```

### 3.3 Atualizar o frontend

- Ao iniciar conversa: criar registro em `conversations`
- A cada mensagem enviada/recebida: inserir em `messages`
- No ChatSheet: adicionar botao "Historico" que lista conversas anteriores

**Resultado da Etapa 3:** Conversas persistem e podem ser retomadas.

---

## ETAPA 4 - Autenticacao (Opcional)

**Objetivo:** Identificar usuarios para conversas privadas.

### 4.1 Ativar Auth no Supabase

No painel: **Authentication > Providers > Email** (ja vem ativado por padrao).

### 4.2 Adicionar coluna user_id

```sql
ALTER TABLE conversations ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Atualizar politicas RLS
DROP POLICY "allow_all_conversations" ON conversations;
CREATE POLICY "user_conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY "allow_all_messages" ON messages;
CREATE POLICY "user_messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

### 4.3 Criar tela de login

Adicionar pagina `/login` com magic link (email sem senha) usando `supabase.auth.signInWithOtp()`.

**Resultado da Etapa 4:** Cada usuario ve apenas suas proprias conversas.

---

## Resumo de Ordem e Tempo Estimado

```text
Etapa 1: Interface do Chat ............ ~2-3 horas
Etapa 2: Supabase + Edge Function ..... ~1-2 horas
Etapa 3: Persistencia ................. ~1-2 horas
Etapa 4: Autenticacao ................. ~1-2 horas
```

Cada etapa funciona de forma independente. Voce pode parar apos qualquer uma e ja ter valor entregue.

## Proxima Acao

Ao aprovar, comeco implementando a **Etapa 1** completa aqui no Lovable: crio o `useChatStore`, o `ChatSheet` e conecto todos os 7 botoes. Voce depois copia esses arquivos para o seu projeto no Vercel.

