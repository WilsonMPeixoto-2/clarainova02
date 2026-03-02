import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id } = await req.json();
    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "document_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get document record
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docErr || !doc) {
      return new Response(
        JSON.stringify({ error: "Documento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase.from("documents").update({ status: "processing" }).eq("id", document_id);

    // 2. Download PDF from storage
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (fileErr || !fileData) {
      await supabase.from("documents").update({ status: "error" }).eq("id", document_id);
      return new Response(
        JSON.stringify({ error: "Erro ao baixar arquivo do storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // 4. Send to Gemini multimodal to extract text
    const extractResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64,
                  },
                },
                {
                  text: "Extraia TODO o texto deste documento PDF. Mantenha a estrutura original (títulos, parágrafos, listas, artigos, incisos). Não resuma, não omita nada. Retorne apenas o texto extraído, sem comentários adicionais.",
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 65536,
            temperature: 0.1,
          },
        }),
      }
    );

    if (!extractResponse.ok) {
      const errText = await extractResponse.text();
      console.error("Gemini extraction error:", errText);
      await supabase.from("documents").update({ status: "error" }).eq("id", document_id);
      return new Response(
        JSON.stringify({ error: "Erro na extração de texto pelo Gemini" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractData = await extractResponse.json();
    const extractedText =
      extractData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!extractedText || extractedText.length < 50) {
      await supabase.from("documents").update({ status: "error" }).eq("id", document_id);
      return new Response(
        JSON.stringify({ error: "Texto extraído está vazio ou muito curto" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${extractedText.length} chars from document ${document_id}`);

    // Log PDF extraction
    await supabase.from('usage_logs').insert({
      event_type: 'pdf_extraction',
      metadata: { document_id, text_length: extractedText.length },
    });

    // 5. Split into chunks (~500 words, 50 word overlap)
    const chunks = splitIntoChunks(extractedText, 500, 50);
    console.log(`Split into ${chunks.length} chunks`);

    // 6. Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks, geminiKey);

    // 7. Save chunks + embeddings to database
    const chunkRows = chunks.map((content, i) => ({
      document_id,
      content,
      embedding: JSON.stringify(embeddings[i]),
      chunk_index: i,
    }));

    // Insert in batches of 20
    for (let i = 0; i < chunkRows.length; i += 20) {
      const batch = chunkRows.slice(i, i + 20);
      const { error: insertErr } = await supabase
        .from("document_chunks")
        .insert(batch);
      if (insertErr) {
        console.error("Insert error batch", i, insertErr);
        await supabase.from("documents").update({ status: "error" }).eq("id", document_id);
        return new Response(
          JSON.stringify({ error: "Erro ao salvar fragmentos no banco" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Log embedding generation
    await supabase.from('usage_logs').insert({
      event_type: 'embedding_generation',
      metadata: { document_id, chunks_count: chunks.length },
    });

    // 8. Update document status
    await supabase.from("documents").update({ status: "processed" }).eq("id", document_id);

    return new Response(
      JSON.stringify({
        success: true,
        chunks_count: chunks.length,
        text_length: extractedText.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process document error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno no processamento" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function splitIntoChunks(
  text: string,
  targetWords: number,
  overlapWords: number
): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= targetWords) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    start += targetWords - overlapWords;
    if (end >= words.length) break;
  }

  return chunks;
}

async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Process in batches of 5
  for (let i = 0; i < texts.length; i += 5) {
    const batch = texts.slice(i, i + 5);
    const requests = batch.map((text) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] },
          }),
        }
      ).then((r) => r.json())
    );

    const results = await Promise.all(requests);
    for (const result of results) {
      if (result.embedding?.values) {
        embeddings.push(result.embedding.values);
      } else {
        console.error("Embedding error:", JSON.stringify(result));
        embeddings.push(new Array(768).fill(0));
      }
    }
  }

  return embeddings;
}
