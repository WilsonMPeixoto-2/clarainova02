import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FILE_API_THRESHOLD = 15_000_000; // 15MB

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

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const fileSize = bytes.length;
    console.log(`Document ${document_id}: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);

    // 3. Build content parts based on file size
    let filePart: Record<string, unknown>;

    if (fileSize > FILE_API_THRESHOLD) {
      console.log("Using Gemini File API for large file...");
      const fileUri = await uploadToGeminiFileAPI(bytes, doc.name, geminiKey);
      filePart = { file_data: { mime_type: "application/pdf", file_uri: fileUri } };
    } else {
      console.log("Using inline_data for small file...");
      const base64 = safeBase64Encode(bytes);
      filePart = { inline_data: { mime_type: "application/pdf", data: base64 } };
    }

    // 4. Send to Gemini to extract text
    const extractResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                filePart,
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

    await supabase.from('usage_logs').insert({
      event_type: 'pdf_extraction',
      metadata: { document_id, text_length: extractedText.length, file_size: fileSize },
    });

    // 5. Split into chunks
    const chunks = splitIntoChunks(extractedText, 500, 50);
    console.log(`Split into ${chunks.length} chunks`);

    // 6. Generate embeddings
    const embeddings = await generateEmbeddings(chunks, geminiKey);

    // 7. Save chunks + embeddings
    const chunkRows = chunks.map((content, i) => ({
      document_id,
      content,
      embedding: JSON.stringify(embeddings[i]),
      chunk_index: i,
    }));

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
        file_size: fileSize,
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

// Safe base64 encoding that never overflows the call stack
function safeBase64Encode(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

// Upload file to Gemini File API for large PDFs (>15MB)
async function uploadToGeminiFileAPI(
  bytes: Uint8Array,
  displayName: string,
  apiKey: string
): Promise<string> {
  const startResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.length),
        "X-Goog-Upload-Header-Content-Type": "application/pdf",
      },
      body: JSON.stringify({
        file: { display_name: displayName },
      }),
    }
  );

  if (!startResponse.ok) {
    const errText = await startResponse.text();
    throw new Error(`Gemini File API start failed: ${errText}`);
  }

  const uploadUrl = startResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("Gemini File API did not return upload URL");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: bytes,
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Gemini File API upload failed: ${errText}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileName = uploadResult.file?.name;
  if (!fileName) {
    throw new Error("Gemini File API did not return file name");
  }

  console.log(`Uploaded to Gemini File API: ${fileName}, waiting for processing...`);

  const fileUri = await waitForFileProcessing(fileName, apiKey);
  return fileUri;
}

// Poll Gemini File API until file status is ACTIVE
async function waitForFileProcessing(
  fileName: string,
  apiKey: string,
  maxWaitMs = 120_000
): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 3000;

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`File status check failed: ${errText}`);
    }

    const result = await response.json();
    const state = result.state;

    if (state === "ACTIVE") {
      console.log(`File ${fileName} is ACTIVE, URI: ${result.uri}`);
      return result.uri;
    }

    if (state === "FAILED") {
      throw new Error(`File processing failed for ${fileName}`);
    }

    console.log(`File ${fileName} state: ${state}, waiting...`);
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new Error(`File processing timed out for ${fileName}`);
}

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
