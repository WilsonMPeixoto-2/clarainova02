

# Relatorio Duplo: Backend da CLARA

## PARTE 1 — O que sera construido aqui no Lovable

### Visao Geral da Arquitetura

A Etapa 1 (interface do chat) ja esta pronta. Todos os 7 pontos de entrada estao conectados e o chat funciona com respostas mockadas. A proxima fase e dar "cerebro" a CLARA — conectar a interface a uma IA real.

```text
Fluxo completo de uma pergunta:

  Usuario clica       Frontend envia        Edge Function        API de IA
  "Iniciar conversa"  mensagem via fetch     recebe, adiciona     processa e
  ou chip de          para Edge Function     system prompt,       retorna resposta
  pergunta rapida     no Supabase            envia para IA        via streaming
        |                   |                      |                    |
        v                   v                      v                    v
  [ChatSheet.tsx] --> [useChatStore.tsx] --> [Edge Function] --> [Gemini / GPT]
                                                   |
                                            retorna tokens
                                            um a um (SSE)
                                                   |
                                                   v
                                           [ChatSheet exibe
                                            letra por letra]
```

### O que e uma Edge Function?

Uma Edge Function e um pequeno programa que roda no servidor (nao no navegador do usuario). Ela existe por dois motivos:

1. **Seguranca**: A chave da API de IA (que custa dinheiro) fica no servidor, invisivel para qualquer pessoa que inspecione o site
2. **Controle**: Voce pode adicionar regras (system prompt, limites de uso, filtros) antes de enviar a pergunta para a IA

Analogia: imagine que o usuario manda um bilhete (pergunta). A Edge Function e a secretaria que recebe o bilhete, adiciona instrucoes internas ("responda em portugues, seja objetiva, cite fontes") e entrega ao especialista (IA). O especialista responde, e a secretaria devolve ao usuario.

### O que sera construido

| Componente | O que faz | Onde vive |
|---|---|---|
| **Edge Function `chat`** | Recebe mensagens do frontend, adiciona o system prompt da CLARA, chama a API de IA, e retorna a resposta em streaming (token por token) | `supabase/functions/chat/index.ts` |
| **System Prompt** | Texto interno que define a personalidade e expertise da CLARA (SEI-Rio, legislacao municipal, rotinas administrativas) | Dentro da Edge Function |
| **Streaming SSE** | Tecnica que permite mostrar a resposta letra por letra em tempo real, em vez de esperar a resposta completa | Frontend (`useChatStore.tsx`) |
| **Tratamento de erros** | Mensagens claras quando a IA esta fora do ar, limite de uso excedido (429), ou creditos esgotados (402) | Edge Function + Frontend |

### Como sera construido no Lovable

1. **Ativar Lovable Cloud** — habilita a infraestrutura de servidor dentro do Lovable
2. **Ativar Lovable AI** — disponibiliza a chave `LOVABLE_API_KEY` automaticamente (voce nao precisa configurar nada)
3. **Criar a Edge Function `chat`** — um unico arquivo TypeScript que:
   - Recebe `{ messages }` do frontend
   - Adiciona o system prompt da CLARA
   - Chama `https://ai.gateway.lovable.dev/v1/chat/completions` com streaming
   - Retorna o stream SSE para o frontend
4. **Atualizar `useChatStore.tsx`** — substituir a funcao `getMockResponse` por uma chamada real com parsing de SSE token a token
5. **Atualizar `ChatSheet.tsx`** — exibir a resposta progressivamente (letra por letra) em vez de esperar a resposta completa

### Modelo de IA

O Lovable AI Gateway oferece acesso a modelos Google Gemini e OpenAI. O modelo padrao sera `google/gemini-3-flash-preview` — rapido, barato e eficiente para o tipo de consulta da CLARA.

---

## PARTE 2 — Guia Estrategico para o Projeto na Vercel

### As opcoes de mercado comparadas

Voce precisa de 3 coisas para o backend funcionar fora do Lovable:

1. **Lugar para rodar a Edge Function** (o "cerebro" que fala com a IA)
2. **API de IA** (o modelo que gera as respostas)
3. **Banco de dados com PDFs** (a base de conhecimento)

Abaixo, cada opcao avaliada:

---

### 1. Onde rodar a Edge Function

| Opcao | Cota Gratuita | Vantagens | Desvantagens |
|---|---|---|---|
| **Vercel Functions** | 100 GB-h/mes, 100k invocacoes | Ja esta no mesmo deploy do frontend; zero config extra; suporta streaming SSE nativamente | Timeout de 10s no plano gratuito (pode cortar respostas longas) |
| **Supabase Edge Functions** | 500k invocacoes/mes, 2M tempo de execucao | Generoso; facil de escalar; bom para adicionar banco depois | Precisa de conta separada e CLI |
| **Google Cloud Functions** | 2M invocacoes/mes | Muito generoso | Setup complexo; console confusa; cold starts |
| **Firebase Functions** | Requer plano Blaze (pague pelo uso) | Integracao com Firebase Auth | Nao tem cota gratuita real para functions |

**Recomendacao**: Comece com **Vercel Functions** (voce ja usa Vercel). Se precisar de mais tempo de execucao ou banco de dados, adicione Supabase depois.

#### Como criar uma Vercel Function

Na raiz do seu projeto, crie a pasta `api/` com um arquivo:

```text
api/
  chat.ts    <-- sua funcao serverless
```

Exemplo de estrutura:

```typescript
// api/chat.ts
export const config = { runtime: 'edge' };   // roda no edge, mais rapido

export default async function handler(req: Request) {
  const { messages } = await req.json();
  
  const response = await fetch('URL_DA_API_DE_IA', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Voce e a CLARA...' },
        ...messages,
      ],
      stream: true,
    }),
  });

  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

A chave `AI_API_KEY` fica em **Vercel > Settings > Environment Variables**.

---

### 2. Qual API de IA usar

| Provedor | Modelo | Cota Gratuita | Custo apos cota | Qualidade |
|---|---|---|---|---|
| **Google AI Studio** | Gemini 2.5 Flash | 15 RPM, 1M tokens/min (gratuito) | $0.075/1M tokens entrada | Excelente custo-beneficio |
| **Google AI Studio** | Gemini 2.5 Pro | 5 RPM (gratuito, mais lento) | $1.25/1M tokens entrada | Melhor qualidade, mais caro |
| **OpenAI** | GPT-4o-mini | Sem cota gratuita; $5 credito inicial | $0.15/1M tokens entrada | Bom, mas sem cota gratuita permanente |
| **OpenAI** | GPT-4o | Sem cota gratuita | $2.50/1M tokens entrada | Top de linha, caro |

**Recomendacao**: **Google AI Studio com Gemini 2.5 Flash**. E gratuito dentro de limites generosos e a qualidade e excelente para o caso da CLARA.

Como obter a chave:
1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em "Get API Key" e depois "Create API Key"
3. Copie e cole em `Vercel > Settings > Environment Variables` como `AI_API_KEY`

---

### 3. Base de conhecimento (10 PDFs)

Os 10 PDFs sao a "memoria" da CLARA — legislacao, manuais, procedimentos. Existem duas abordagens:

#### Abordagem A: Embeddings + Banco Vetorial (recomendada para escala)

```text
PDF --> Extrair texto --> Dividir em trechos --> Gerar embeddings --> Salvar no banco
                                                                          |
Pergunta do usuario --> Gerar embedding --> Buscar trechos similares --> Enviar como contexto para IA
```

| Onde hospedar | Cota Gratuita | Como funciona |
|---|---|---|
| **Supabase (pgvector)** | 500 MB de banco gratuito | PostgreSQL com extensao vetorial; busca semantica nativa |
| **Pinecone** | 100k vetores gratuitos | Banco vetorial dedicado; muito rapido |
| **Qdrant Cloud** | 1 GB gratuito | Open source, boa performance |

**Recomendacao**: **Supabase com pgvector**. Voce ganha banco relacional + vetorial no mesmo lugar, e a cota gratuita de 500 MB comporta facilmente 10 PDFs.

Passo a passo:
1. Crie projeto gratuito em [supabase.com](https://supabase.com)
2. Ative a extensao pgvector no SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Crie tabela de documentos com coluna de embedding
4. Use um script (pode ser local, Node.js) para extrair texto dos PDFs, gerar embeddings via API do Google, e inserir no banco
5. Na Edge Function, antes de chamar a IA, busque trechos relevantes e inclua no prompt

#### Abordagem B: Contexto Direto no Prompt (rapida, para poucos PDFs)

Se os 10 PDFs somam menos de ~50 paginas de texto util, voce pode simplesmente colar o conteudo resumido dentro do system prompt. Sem banco de dados.

Vantagens: zero infraestrutura extra
Desvantagens: nao escala; consome mais tokens; limite de contexto

**Recomendacao para comecar**: Use a Abordagem B primeiro (rapido, sem banco). Quando precisar de mais precisao ou mais documentos, migre para Abordagem A.

---

### 4. Dados e Analytics — o que vale a pena medir

| Dado | Por que medir | Como implementar |
|---|---|---|
| **Perguntas mais frequentes** | Identificar gaps na documentacao e treinamento | Salvar cada pergunta no banco com timestamp |
| **Topicos recorrentes** | Priorizar conteudo e atualizacoes | Classificar perguntas por categoria (pode ser feito pela propria IA) |
| **Taxa de satisfacao** | Saber se as respostas ajudam | Botao polegar cima/baixo apos cada resposta |
| **Tempo medio de resposta** | Monitorar performance | Registrar timestamp de envio e recebimento |
| **Perguntas sem resposta** | Identificar limitacoes da base | Detectar quando a IA responde "nao sei" ou variantes |

Para implementar: basta adicionar uma tabela `analytics` no Supabase e inserir um registro a cada interacao. Nao precisa de ferramenta externa.

---

### 5. Outras ferramentas mencionadas

| Ferramenta | Serve para CLARA? | Veredicto |
|---|---|---|
| **Google Workspace** | Nao. E para email/docs/drive corporativo | Irrelevante para o backend |
| **Firebase** | Possivel, mas sem cota gratuita para Functions e mais complexo que Supabase | Nao recomendado |
| **Google Cloud (GCP)** | Poderoso, mas overkill e complexo para este projeto | So se voce ja usar GCP |

---

### Resumo da Estrategia Recomendada (Vercel)

```text
Fase 1 (agora):
  Frontend (Vercel) + Vercel Edge Function + Google Gemini Flash (gratis)
  System prompt com conteudo resumido dos PDFs

Fase 2 (quando precisar de mais):
  + Supabase (banco + pgvector) para embeddings dos PDFs
  + Tabela analytics para medir uso
  + Busca semantica antes de cada resposta

Fase 3 (opcional):
  + Supabase Auth para login por email
  + Historico de conversas por usuario
```

---

### Proxima Acao

Aqui no Lovable, implementarei a Etapa 2 completa: ativar Cloud, criar a Edge Function `chat`, conectar o streaming ao `useChatStore` e ao `ChatSheet`. Resultado: chat com IA real respondendo em tempo real.

Para o projeto na Vercel, voce pode seguir o guia acima criando o arquivo `api/chat.ts` e configurando a chave do Google AI Studio nas variaveis de ambiente.

