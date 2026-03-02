

# Etapa 2 — Backend com sua API Gemini (sem Lovable Cloud/AI)

## Garantia de custo zero

- A Edge Function chamara a API do Google Gemini **diretamente** (generativelanguage.googleapis.com)
- **Nenhum uso** do gateway `ai.gateway.lovable.dev` ou do `LOVABLE_API_KEY`
- Voce fornece sua chave gratuita do Google AI Studio
- Tudo roda dentro do plano gratuito do backend

---

## O que sera feito

### 1. Adicionar sua chave da API do Gemini

Antes de criar a funcao, vou solicitar que voce insira sua chave do Google AI Studio como um secret chamado `GEMINI_API_KEY`. Essa chave fica criptografada no servidor e nunca aparece no codigo do frontend.

Se voce ainda nao tem a chave:
1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em "Get API Key" e depois "Create API Key"
3. Copie a chave

### 2. Criar Edge Function `chat`

Arquivo: `supabase/functions/chat/index.ts`

O que faz:
- Recebe as mensagens do chat via POST
- Adiciona o **system prompt** da CLARA (personalidade, especialidades, tom)
- Chama a API do Gemini diretamente em `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- Retorna a resposta em **streaming SSE** (token por token)
- Trata erros: 429 (limite de requisicoes), 403 (chave invalida), falhas de rede

Configuracao no `supabase/config.toml`:
```text
[functions.chat]
verify_jwt = false
```

### 3. Atualizar `useChatStore.tsx`

Mudancas:
- Remover `MOCK_RESPONSES` e `getMockResponse`
- Nova funcao `streamChat` que faz fetch para a Edge Function
- Parsing de SSE linha por linha: extrai tokens de `data: {"choices":[{"delta":{"content":"..."}}]}`
- Atualiza a mensagem do assistente progressivamente (letra por letra)
- Detecta `[DONE]` para encerrar
- Tratamento de erros com mensagens claras em portugues

### 4. Ajustar `ChatSheet.tsx`

Mudanca menor:
- Esconder o spinner assim que o primeiro token chegar (a mensagem ja aparece sendo preenchida)

---

## Arquitetura final

```text
[ChatSheet] --> [useChatStore] --> [Edge Function "chat"] --> [Google Gemini API]
                                   usa GEMINI_API_KEY           generativelanguage
                                   (secret do servidor)         .googleapis.com
                                   
                                   SEM gateway Lovable
                                   SEM LOVABLE_API_KEY
```

## Custo

| Componente | Custo |
|---|---|
| Edge Function | Incluido no plano (500k invocacoes/mes) |
| Google Gemini 2.5 Flash | Gratuito (15 RPM, 1M tokens/min) |
| **Total** | **R$ 0** |

