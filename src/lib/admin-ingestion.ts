import { extractText, getDocumentProxy } from "unpdf";

const TARGET_CHUNK_SIZE = 1000;
const MAX_CHUNK_SIZE = 1400;
const MIN_CHUNK_SIZE = 150;
const CHUNK_OVERLAP_SENTENCES = 1;

const SECTION_BREAK_PATTERNS = [
  /^\d+(?:\.\d+)*\s+\S/,           // "3.1 Inclusão..."
  /^[A-Z][A-Z\s\u00C0-\u024F]{4,}/,  // "INCLUSÃO DE DOCUMENTOS"
  /^#{1,4}\s+/,                    // Markdown headings
];

function isSectionBreak(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  return SECTION_BREAK_PATTERNS.some((p) => p.test(trimmed));
}

function splitIntoSegments(text: string): string[][] {
  const lines = text.split('\n');
  const sections: string[][] = [[]];

  for (const line of lines) {
    if (isSectionBreak(line) && sections[sections.length - 1].length > 0) {
      sections.push([]);
    }
    sections[sections.length - 1].push(line);
  }

  return sections.filter((s) => s.some((l) => l.trim().length > 0));
}

function splitSectionIntoParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.trim() === '' && current.length > 0) {
      paragraphs.push(current.join('\n').trim());
      current = [];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    paragraphs.push(current.join('\n').trim());
  }

  return paragraphs.filter((p) => p.length > 0);
}

function getLastSentence(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences[sentences.length - 1] || '';
}

function mergeSegmentsIntoChunks(paragraphs: string[]): string[] {
  const chunks: string[] = [];
  let current = '';
  let prevOverlap = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > MAX_CHUNK_SIZE) {
      if (current.trim()) {
        chunks.push(current.trim());
        prevOverlap = CHUNK_OVERLAP_SENTENCES > 0 ? getLastSentence(current) : '';
        current = '';
      }
      chunks.push(paragraph.trim());
      prevOverlap = CHUNK_OVERLAP_SENTENCES > 0 ? getLastSentence(paragraph) : '';
      continue;
    }

    const proposed = current ? `${current}\n\n${paragraph}` : paragraph;

    if (proposed.length > TARGET_CHUNK_SIZE && current.trim()) {
      chunks.push(current.trim());
      prevOverlap = CHUNK_OVERLAP_SENTENCES > 0 ? getLastSentence(current) : '';
      current = prevOverlap ? `${prevOverlap}\n\n${paragraph}` : paragraph;
    } else {
      current = proposed;
    }
  }

  if (current.trim()) {
    if (current.trim().length < MIN_CHUNK_SIZE && chunks.length > 0) {
      chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}\n\n${current.trim()}`;
    } else {
      chunks.push(current.trim());
    }
  }

  return chunks;
}

function semanticSplit(rawText: string): string[] {
  // eslint-disable-next-line no-control-regex
  const normalized = rawText.replace(/\u0000/g, "").trim();
  if (normalized.length < MIN_CHUNK_SIZE) return normalized.length >= 3 ? [normalized] : [];

  const sections = splitIntoSegments(normalized);
  const allChunks: string[] = [];

  for (const section of sections) {
    const paragraphs = splitSectionIntoParagraphs(section);
    const merged = mergeSegmentsIntoChunks(paragraphs);
    allChunks.push(...merged);
  }

  return allChunks.filter((c) => c.trim().length >= 3);
}

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
  documentHash: string;
}

export function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

async function sha256HexFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeBlobHash(blob: Blob): Promise<string> {
  return sha256HexFromArrayBuffer(await blob.arrayBuffer());
}

export async function computeFileHash(file: File): Promise<string> {
  return computeBlobHash(file);
}

const SECTION_HEADING_PATTERNS: RegExp[] = [
  /^(\d+(?:\.\d+)*)\s+(.{3,80})$/,       // "3.1 Inclusão de Documentos"
  /^([A-Z][A-Z\s\u00C0-\u024F]{4,80})$/,  // "INCLUSÃO DE DOCUMENTOS" (all caps)
  /^(#{1,4})\s+(.{3,80})$/,               // Markdown headings
  /^([A-Z\u00C0-\u024F][a-z\u00C0-\u024F]+(?:\s+[A-Za-z\u00C0-\u024F]+){0,8})$/,  // "Inclusão de Documentos" (title case, short)
];

function detectSectionTitle(pageText: string, chunkContent: string): string | null {
  const chunkStart = pageText.indexOf(chunkContent.slice(0, 60));
  const textBeforeChunk = chunkStart > 0 ? pageText.slice(0, chunkStart) : pageText;

  const lines = textBeforeChunk.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i];
    if (line.length > 80 || line.length < 3) continue;

    for (const pattern of SECTION_HEADING_PATTERNS) {
      if (pattern.test(line)) {
        const match = line.match(pattern);
        const title = match?.[2]?.trim() || match?.[1]?.trim() || line.trim();
        return title.length > 80 ? title.slice(0, 80) : title;
      }
    }
  }

  return null;
}

export async function buildPreparedChunksFromPages(
  pages: PageText[],
  sourceTag: string,
): Promise<PreparedChunk[]> {
  const chunks: PreparedChunk[] = [];

  for (const page of pages) {
    if (!page.text.trim()) continue;
    const pageChunks = semanticSplit(page.text);
    for (const chunk of pageChunks) {
      const sourcePrefix = `[Fonte: ${sourceTag} | Página: ${page.pageNumber}] `;
      chunks.push({
        content: `${sourcePrefix}${chunk}`,
        pageStart: page.pageNumber,
        pageEnd: page.pageNumber,
        sectionTitle: detectSectionTitle(page.text, chunk),
        sourceTag,
      });
    }
  }

  return chunks;
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
  const [pages, documentHash] = await Promise.all([
    extractTextFromPDF(file, onProgress),
    computeFileHash(file),
  ]);
  const fullText = pages.map((page) => page.text).join("\n\n");

  if (fullText.length < 50) {
    throw new Error("PDF parece estar vazio ou conter apenas imagens (sem texto extraível).");
  }

  const chunks = await buildPreparedChunksFromPages(pages, file.name);

  if (chunks.length === 0) {
    throw new Error("Não encontrei fragmentos utilizáveis no PDF.");
  }

  return {
    pages,
    fullText,
    chunks,
    documentHash,
  };
}
