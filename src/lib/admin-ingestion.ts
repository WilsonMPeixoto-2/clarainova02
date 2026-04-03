import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractText, getDocumentProxy } from "unpdf";

const langChainSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""],
});

export interface PageText {
  pageNumber: number;
  text: string;
}

export interface PreparedChunk {
  content: string;
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
  sourceTag: string | null;
}

export interface PreparedPdfIngestion {
  pages: PageText[];
  fullText: string;
  chunks: PreparedChunk[];
}

export function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

async function splitWithLangChain(rawText: string): Promise<string[]> {
  // eslint-disable-next-line no-control-regex
  const normalized = rawText.replace(/\u0000/g, "").trim();
  const chunks = await langChainSplitter.splitText(normalized);
  return chunks.filter((chunk) => chunk.trim().length >= 3);
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: (pagesRead: number, totalPages: number) => void,
): Promise<PageText[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
  const totalPages = pdf.numPages;

  onProgress?.(0, totalPages);

  const result = await extractText(pdf, { mergePages: false });
  const pageTexts = result.text as unknown as string[];

  onProgress?.(totalPages, totalPages);

  return pageTexts.map((text, index) => ({
    pageNumber: index + 1,
    text,
  }));
}

export async function preparePdfIngestion(
  file: File,
  onProgress?: (pagesRead: number, totalPages: number) => void,
): Promise<PreparedPdfIngestion> {
  const pages = await extractTextFromPDF(file, onProgress);
  const fullText = pages.map((page) => page.text).join("\n\n");

  if (fullText.length < 50) {
    throw new Error("PDF parece estar vazio ou conter apenas imagens (sem texto extraível).");
  }

  const chunks: PreparedChunk[] = [];
  for (const page of pages) {
    if (!page.text.trim()) continue;
    const pageChunks = await splitWithLangChain(page.text);
    for (const chunk of pageChunks) {
      chunks.push({
        content: chunk,
        pageStart: page.pageNumber,
        pageEnd: page.pageNumber,
        sectionTitle: null,
        sourceTag: file.name,
      });
    }
  }

  if (chunks.length === 0) {
    throw new Error("Não encontrei fragmentos utilizáveis no PDF.");
  }

  return {
    pages,
    fullText,
    chunks,
  };
}
