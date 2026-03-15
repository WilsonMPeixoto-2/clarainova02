export interface RetrievedChunk {
  content: string;
  similarity: number;
  document_name?: string | null;
  page_start?: number | null;
  page_end?: number | null;
  section_title?: string | null;
}

export interface KnowledgeDecision {
  relevantChunks: RetrievedChunk[];
  knowledgeContext: string;
  topScore: number;
  sources: string[];
}

interface ParsedChunk {
  content: string;
  similarity: number;
  documentName: string;
  pageLabel?: string;
  sectionTitle?: string;
  sourceLabel: string;
}

const MIN_RRF_SCORE = 0.006;
const STRONG_RRF_SCORE = 0.012;
const MAX_SELECTED_CHUNKS = 6;

const STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos",
  "e", "em", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por",
  "qual", "quais", "que", "se", "sem", "ser", "uma", "um",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenizeQuestion(question: string): string[] {
  return Array.from(
    new Set(
      normalizeText(question)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
    )
  );
}

function parseChunk(chunk: RetrievedChunk): ParsedChunk {
  const match = chunk.content.match(/^\[Fonte:\s*([^\]|]+?)(?:\s*\|\s*P[aá]gina:\s*([^\]]+))?\]\s*/i);
  const parsedSource = match?.[1]?.trim();
  const explicitPageLabel =
    typeof chunk.page_start === "number"
      ? chunk.page_end && chunk.page_end !== chunk.page_start
        ? `${chunk.page_start}-${chunk.page_end}`
        : `${chunk.page_start}`
      : undefined;
  const pageLabel = explicitPageLabel ?? match?.[2]?.trim();
  const sectionTitle = chunk.section_title?.trim() || undefined;
  const documentName = chunk.document_name?.trim() || parsedSource || "Documento sem nome";
  const cleanContent = match ? chunk.content.slice(match[0].length).trim() : chunk.content.trim();
  const sourceBase = sectionTitle ? `${documentName} - ${sectionTitle}` : documentName;
  const sourceLabel = pageLabel ? `${sourceBase} - Página ${pageLabel}` : sourceBase;

  return {
    content: cleanContent,
    similarity: chunk.similarity,
    documentName,
    pageLabel,
    sectionTitle,
    sourceLabel,
  };
}

function lexicalOverlap(tokens: string[], text: string): number {
  const normalized = normalizeText(text);
  return tokens.reduce((score, token) => (normalized.includes(token) ? score + 1 : score), 0);
}

function buildKnowledgeContext(chunks: ParsedChunk[]): string {
  const blocks = chunks.map(
    (chunk) =>
      `[Fonte Oficial: ${chunk.sourceLabel}]\n${chunk.content}`
  );

  return `\n\n--- BASE DE CONHECIMENTO INTERNA ---
Os trechos abaixo foram recuperados da base documental validada da CLARA.

INSTRUCOES PARA USO DESTES TRECHOS:
- Use estes trechos como fonte PRIMARIA e PRIORITARIA para formular sua resposta.
- Consolide informacoes de MULTIPLOS trechos quando eles se complementam.
- Se houver pequenas divergencias entre documentos, identifique e explique com cautela.
- As fontes devem ser citadas APENAS ao final da resposta, na secao "Fontes", NUNCA espalhadas no meio do texto.
- Use o formato: Nome do Documento - Pagina X (quando disponivel).
- Se os trechos NAO respondem a pergunta do usuario, IGNORE-OS e responda com seu conhecimento geral, sinalizando isso.

${blocks.join("\n\n---\n\n")}
--- FIM DA BASE DE CONHECIMENTO INTERNA ---`;
}

export function prepareKnowledgeDecision(
  question: string,
  chunks: RetrievedChunk[]
): KnowledgeDecision {
  const questionTokens = tokenizeQuestion(question);
  const parsedChunks = chunks
    .filter((chunk) => Number.isFinite(chunk.similarity))
    .sort((left, right) => right.similarity - left.similarity)
    .map(parseChunk)
    .filter((chunk, index) => {
      const overlap = lexicalOverlap(questionTokens, chunk.content);
      if (chunk.similarity >= MIN_RRF_SCORE && overlap > 0) return true;
      if (index === 0 && chunk.similarity >= STRONG_RRF_SCORE) return true;
      return false;
    })
    .slice(0, MAX_SELECTED_CHUNKS);

  if (parsedChunks.length === 0) {
    return {
      relevantChunks: [],
      knowledgeContext: "",
      topScore: 0,
      sources: [],
    };
  }

  const relevantChunks = parsedChunks.map((chunk) => ({
    content: chunk.content,
    similarity: chunk.similarity,
    document_name: chunk.documentName,
    section_title: chunk.sectionTitle ?? null,
  }));
  const topScore = parsedChunks[0]?.similarity ?? 0;
  const sources = Array.from(new Set(parsedChunks.map((chunk) => chunk.sourceLabel)));

  return {
    relevantChunks,
    knowledgeContext: buildKnowledgeContext(parsedChunks),
    topScore,
    sources,
  };
}
