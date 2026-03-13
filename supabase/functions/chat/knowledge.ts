export interface RetrievedChunk {
  content: string;
  similarity: number;
  document_name?: string | null;
}

export interface KnowledgeDecision {
  relevantChunks: RetrievedChunk[];
  knowledgeContext: string;
  knowledgeOnlyResponse?: string;
  useKnowledgeOnly: boolean;
  topScore: number;
  sources: string[];
}

interface ParsedChunk {
  content: string;
  similarity: number;
  documentName: string;
  pageLabel?: string;
  sourceLabel: string;
}

interface SummaryLine {
  sentence: string;
  score: number;
  sourceLabel: string;
}

const MIN_RRF_SCORE = 0.006;
const STRONG_RRF_SCORE = 0.012;
const MAX_SELECTED_CHUNKS = 4;
const MAX_SUMMARY_LINES = 4;

const STOP_WORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "por",
  "qual",
  "quais",
  "que",
  "se",
  "sem",
  "ser",
  "uma",
  "um",
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
  const pageLabel = match?.[2]?.trim();
  const documentName = chunk.document_name?.trim() || parsedSource || "Documento sem nome";
  const cleanContent = match ? chunk.content.slice(match[0].length).trim() : chunk.content.trim();
  const sourceLabel = pageLabel ? `${documentName} - pagina ${pageLabel}` : documentName;

  return {
    content: cleanContent,
    similarity: chunk.similarity,
    documentName,
    pageLabel,
    sourceLabel,
  };
}

function lexicalOverlap(tokens: string[], text: string): number {
  const normalized = normalizeText(text);
  return tokens.reduce((score, token) => (normalized.includes(token) ? score + 1 : score), 0);
}

function splitSentences(text: string): string[] {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return [];
  return compact
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40);
}

function truncateSnippet(text: string, maxLength = 320): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function buildKnowledgeContext(chunks: ParsedChunk[]): string {
  const blocks = chunks.map(
    (chunk) => `[Fonte Oficial: ${chunk.documentName}]\nTexto extraido em contexto: ${chunk.content}`
  );

  return `\n\n--- BASE DE CONHECIMENTO ---\nOs trechos abaixo vieram da base de conhecimento validada. Use-os como fonte primaria quando forem suficientes para responder.\n\n${blocks.join("\n\n---\n\n")}\n--- FIM DA BASE DE CONHECIMENTO ---`;
}

function buildSummaryLines(questionTokens: string[], chunks: ParsedChunk[]): SummaryLine[] {
  const seen = new Set<string>();
  const candidates: SummaryLine[] = [];

  for (const chunk of chunks) {
    const sentences = splitSentences(chunk.content);
    if (sentences.length === 0) {
      candidates.push({
        sentence: truncateSnippet(chunk.content),
        score: chunk.similarity * 100,
        sourceLabel: chunk.sourceLabel,
      });
      continue;
    }

    for (const sentence of sentences) {
      const overlap = lexicalOverlap(questionTokens, sentence);
      const score = overlap * 10 + chunk.similarity * 100;
      if (overlap === 0 && chunk.similarity < STRONG_RRF_SCORE) continue;

      const normalizedSentence = normalizeText(sentence);
      if (seen.has(normalizedSentence)) continue;
      seen.add(normalizedSentence);

      candidates.push({
        sentence,
        score,
        sourceLabel: chunk.sourceLabel,
      });
    }
  }

  return candidates.sort((left, right) => right.score - left.score).slice(0, MAX_SUMMARY_LINES);
}

function buildKnowledgeOnlyResponse(summaryLines: SummaryLine[], sources: string[]): string | undefined {
  if (summaryLines.length < 2) return undefined;

  const summary = summaryLines
    .map((line) => `- ${line.sentence} (${line.sourceLabel})`)
    .join("\n");

  const citedSources = sources.map((source) => `- ${source}`).join("\n");

  return `**Resposta baseada exclusivamente na base de conhecimento cadastrada.**\n\n### Sintese objetiva\n${summary}\n\n### Fontes encontradas\n${citedSources}\n\nSe quiser, posso reorganizar esse material em passo a passo objetivo.`;
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
      useKnowledgeOnly: false,
      topScore: 0,
      sources: [],
    };
  }

  const relevantChunks = parsedChunks.map((chunk) => ({
    content: chunk.content,
    similarity: chunk.similarity,
    document_name: chunk.documentName,
  }));
  const topScore = parsedChunks[0]?.similarity ?? 0;
  const sources = Array.from(new Set(parsedChunks.map((chunk) => chunk.sourceLabel)));
  const summaryLines = buildSummaryLines(questionTokens, parsedChunks);
  const knowledgeOnlyResponse = topScore >= STRONG_RRF_SCORE
    ? buildKnowledgeOnlyResponse(summaryLines, sources)
    : undefined;

  return {
    relevantChunks,
    knowledgeContext: buildKnowledgeContext(parsedChunks),
    knowledgeOnlyResponse,
    useKnowledgeOnly: Boolean(knowledgeOnlyResponse),
    topScore,
    sources,
  };
}
