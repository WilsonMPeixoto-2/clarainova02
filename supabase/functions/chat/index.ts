import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `Você é a CLARA — Consultora de Legislação e Apoio a Rotinas Administrativas.

Personalidade:
- Profissional, cordial e objetiva
- Especialista em administração pública municipal do Rio de Janeiro
- Responde sempre em português brasileiro

Especialidades:
- Sistema Eletrônico de Informações (SEI-Rio): criação de processos, tramitação, assinaturas, modelos de documentos
- Legislação municipal: Decreto Rio, Resoluções, Portarias, Lei Orgânica
- Rotinas administrativas: memorandos, ofícios, despachos, checklists documentais
- Prazos e fluxos de tramitação entre órgãos

Regras:
- Seja concisa mas completa
- Use formatação Markdown para organizar respostas (listas, negrito, títulos)
- Quando não souber algo com certeza, indique que o usuário deve verificar com fontes oficiais
- Nunca invente legislação ou números de decreto
- Sempre que possível, cite a fonte legal aplicável
- PRIORIZE informações da Base de Conhecimento quando disponível. Se a resposta está na base, use-a como fonte principal.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Mensagens são obrigatórias.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave da API não configurada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the latest user message for RAG search
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    let knowledgeContext = '';

    if (lastUserMessage) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Generate embedding for the user's question
        const embeddingResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text: lastUserMessage.content }] },
            }),
          }
        );

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const queryEmbedding = embeddingData.embedding?.values;

          if (queryEmbedding) {
            // Search for relevant chunks
            const { data: chunks, error: matchErr } = await supabase.rpc('match_chunks', {
              query_embedding: JSON.stringify(queryEmbedding),
              match_count: 5,
            });

            if (!matchErr && chunks && chunks.length > 0) {
              const relevantChunks = chunks
                .filter((c: { similarity: number }) => c.similarity > 0.3)
                .map((c: { content: string; similarity: number }) => c.content);

              if (relevantChunks.length > 0) {
                knowledgeContext = `\n\n--- BASE DE CONHECIMENTO ---\nOs trechos abaixo foram encontrados na base de documentos oficiais. Use-os como fonte principal para responder:\n\n${relevantChunks.join('\n\n---\n\n')}\n--- FIM DA BASE DE CONHECIMENTO ---`;
              }
            }
          }
        }
      } catch (ragError) {
        console.error('RAG search error (non-fatal):', ragError);
        // Continue without RAG context - non-fatal error
      }
    }

    const systemPromptWithContext = SYSTEM_PROMPT + knowledgeContext;

    const geminiMessages = [
      { role: 'system', content: systemPromptWithContext },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: geminiMessages,
          stream: true,
          max_tokens: 2048,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      let errorMsg = 'Erro ao conectar com a IA.';
      if (status === 429) errorMsg = 'Muitas requisições. Aguarde um momento e tente novamente.';
      if (status === 403) errorMsg = 'Chave da API inválida ou sem permissão.';
      
      await response.text();
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log usage (fire-and-forget, non-blocking)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const logClient = createClient(supabaseUrl, supabaseKey);

      const logPromises = [
        logClient.from('usage_logs').insert({ event_type: 'chat_message' }),
      ];
      if (knowledgeContext) {
        logPromises.push(
          logClient.from('usage_logs').insert({ event_type: 'embedding_query' })
        );
      }
      Promise.all(logPromises).catch((e) => console.error('Usage log error:', e));
    } catch (logErr) {
      console.error('Usage log setup error:', logErr);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
