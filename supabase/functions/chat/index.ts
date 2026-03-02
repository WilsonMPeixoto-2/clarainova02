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
- Sempre que possível, cite a fonte legal aplicável`;

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

    const geminiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
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
      
      // Consume body to prevent leak
      await response.text();
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response directly to the client
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
