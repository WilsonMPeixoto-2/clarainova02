import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    await supabase.from("documents").update({ status: "processing" }).eq("id", document_id);

    // @ts-ignore: EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(
      processDocument(supabase, doc, document_id).catch(async (error) => {
        console.error("Background processing error:", error);
        await supabase.from("documents").update({ status: "error" }).eq("id", document_id);
      })
    );

    return new Response(
      JSON.stringify({ success: true, message: "Processamento iniciado em background" }),
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

// ─── Background processing ───────────────────────────────────────────────────

async function processDocument(
  supabase: ReturnType<typeof createClient>,
  doc: { file_path: string; name: string },
  document_id: string
) {
  const geminiKey = Deno.env.get("GEMINI_API_KEY")!;

  // 1. Get a signed URL for the PDF
  const { data: signedData, error: signedErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 600);

  if (signedErr || !signedData?.signedUrl) {
    throw new Error("Falha ao gerar URL assinada: " + signedErr?.message);
  }

  // 2. Upload PDF to Gemini File API via streaming (no memory accumulation)
  console.log(`Uploading ${doc.name} to Gemini File API (streaming)...`);
  const fileUri = await uploadToGeminiStreaming(signedData.signedUrl, doc.name, geminiKey);

  // 3. Extract text using Gemini
  console.log(`Extracting text from ${doc.name}...`);
  const extractedText = await extractTextWithGemini(fileUri, geminiKey);

  if (!extractedText || extractedText.length < 50) {
    throw new Error("Texto extraído está vazio ou muito curto");
  }

  console.log(`Extracted ${extractedText.length} chars from ${doc.name}`);

  await supabase.from("usage_logs").insert({
    event_type: "pdf_extraction",
    metadata: { document_id, text_length: extractedText.length },
  });

  // 4. Split into chunks
  const chunks = splitIntoChunks(extractedText, 500, 50);
  console.log(`Split into ${chunks.length} chunks`);

  // 5. Generate embeddings
  const embeddings = await generateEmbeddings(chunks, geminiKey);

  // 6. Save to database in batches
  const chunkRows = chunks.map((content, i) => ({
    document_id,
    content,
    embedding: JSON.stringify(embeddings[i]),
    chunk_index: i,
  }));

  for (let i = 0; i < chunkRows.length; i += 20) {
    const batch = chunkRows.slice(i, i + 20);
    const { error: insertErr } = await supabase.from("document_chunks").insert(batch);
    if (insertErr) {
      console.error("Insert error batch", i, insertErr);
      throw new Error("Erro ao salvar fragmentos no banco");
    }
  }

  await supabase.from("usage_logs").insert({
    event_type: "embedding_generation",
    metadata: { document_id, chunks_count: chunks.length },
  });

  await supabase.from("documents").update({ status: "processed" }).eq("id", document_id);
  console.log(`Document ${document_id} processed successfully`);
}

// ─── Gemini File API: streaming upload (zero memory accumulation) ────────────

async function uploadToGeminiStreaming(
  pdfUrl: string,
  displayName: string,
  apiKey: string
): Promise<string> {
  // Fetch PDF as a stream — get Content-Length from headers without buffering body
  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
  }

  const contentLength = pdfResponse.headers.get("Content-Length");
  if (!contentLength) {
    throw new Error("PDF response missing Content-Length header");
  }
  const fileSize = parseInt(contentLength, 10);
  console.log(`PDF size: ${(fileSize / 1024 / 1024).toFixed(1)}MB (streaming, not buffered)`);

  // Initiate resumable upload to Gemini
  const startResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(fileSize),
        "X-Goog-Upload-Header-Content-Type": "application/pdf",
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
    }
  );

  if (!startResponse.ok) {
    const errText = await startResponse.text();
    throw new Error(`Gemini File API start failed: ${errText}`);
  }

  const uploadUrl = startResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) throw new Error("No upload URL returned");

  // Stream the PDF body directly to Gemini — no arrayBuffer(), no Uint8Array
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(fileSize),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: pdfResponse.body, // ReadableStream — streamed directly
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Upload failed: ${errText}`);
  }

  const result = await uploadResponse.json();
  const fileName = result.file?.name;
  if (!fileName) throw new Error("No file name returned");

  console.log(`Uploaded to Gemini: ${fileName}`);
  return await waitForFileActive(fileName, apiKey);
}

async function waitForFileActive(
  fileName: string,
  apiKey: string,
  maxWaitMs = 180_000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`File status check failed: ${t}`);
    }
    const data = await res.json();
    if (data.state === "ACTIVE") {
      console.log(`File ACTIVE: ${data.uri}`);
      return data.uri;
    }
    if (data.state === "FAILED") throw new Error(`File processing failed: ${fileName}`);
    console.log(`File state: ${data.state}, waiting...`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`File processing timed out: ${fileName}`);
}

// ─── Gemini text extraction ──────────────────────────────────────────────────

async function extractTextWithGemini(fileUri: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { file_data: { mime_type: "application/pdf", file_uri: fileUri } },
              {
                text: "Extraia TODO o texto deste documento PDF. Mantenha a estrutura original (títulos, parágrafos, listas, artigos, incisos). Não resuma, não omita nada. Retorne apenas o texto extraído, sem comentários adicionais.",
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 65536, temperature: 0.1 },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini extraction error: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── Chunking ────────────────────────────────────────────────────────────────

function splitIntoChunks(text: string, targetWords: number, overlapWords: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= targetWords) return [text.trim()];
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start += targetWords - overlapWords;
  }
  return chunks;
}

// ─── Embeddings (fixed: v1 instead of v1beta) ───────────────────────────────

async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += 5) {
    const batch = texts.slice(i, i + 5);
    const requests = batch.map((text) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] },
          }),
        }
      ).then(async (r) => {
        if (!r.ok) {
          const errText = await r.text();
          console.error(`Embedding API error (${r.status}):`, errText);
          return { embedding: null };
        }
        return r.json();
      })
    );
    const results = await Promise.all(requests);
    for (const result of results) {
      if (result.embedding?.values) {
        embeddings.push(result.embedding.values);
      } else {
        console.error("Embedding missing values:", JSON.stringify(result));
        embeddings.push(new Array(768).fill(0));
      }
    }
  }
  return embeddings;
}
