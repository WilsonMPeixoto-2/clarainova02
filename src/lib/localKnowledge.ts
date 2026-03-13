export interface LocalKnowledgeChunk {
  id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
}

export interface LocalKnowledgeAnswer {
  found: boolean;
  response: string;
  sources: string[];
  topScore: number;
}

interface RankedChunk extends LocalKnowledgeChunk {
  score: number;
}

interface SummaryLine {
  sentence: string;
  score: number;
  source: string;
}

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
  "eh",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "onde",
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
  "sua",
  "suas",
  "um",
  "uma",
]);

const MIN_CHUNK_SCORE = 8;
const STRONG_CHUNK_SCORE = 18;
const MIN_SENTENCE_SCORE = 10;
const MAX_SELECTED_CHUNKS = 6;
const MAX_SUMMARY_LINES = 4;

let knowledgeChunksPromise: Promise<LocalKnowledgeChunk[]> | null = null;

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
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
    )
  );
}

function buildPhrases(tokens: string[]): string[] {
  const phrases = new Set<string>();

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const current = tokens[index];
    const next = tokens[index + 1];
    if (current && next) {
      phrases.add(`${current} ${next}`);
    }
  }

  return Array.from(phrases);
}

function stripNoise(text: string): string {
  return text
    .replace(/\b(?:[A-ZÀ-Ý]\s+){4,}[A-ZÀ-Ý]\b/g, " ")
    .replace(/\bS\s*U\s*M\s*[AÁ]\s*R\s*I\s*O\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeNoise(sentence: string): boolean {
  const letters = sentence.match(/[A-Za-zÀ-ÿ]/g)?.length ?? 0;
  if (letters === 0) return true;

  const isolatedLetters = sentence.match(/\b[A-Za-zÀ-ÿ]\b/g)?.length ?? 0;
  if (isolatedLetters / letters > 0.25) return true;

  const uppercaseLetters = sentence.match(/[A-ZÀ-Ý]/g)?.length ?? 0;
  if (sentence.length > 40 && uppercaseLetters / letters > 0.7 && !/[.!?]/.test(sentence)) {
    return true;
  }

  return false;
}

function splitSentences(text: string): string[] {
  const compact = stripNoise(text);
  if (!compact) return [];

  return compact
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35 && !looksLikeNoise(sentence));
}

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((score, term) => {
    if (!term) return score;
    return text.includes(term) ? score + 1 : score;
  }, 0);
}

function scoreChunk(questionTokens: string[], phrases: string[], chunk: LocalKnowledgeChunk): number {
  const normalizedContent = normalizeText(chunk.content);
  const normalizedDocumentName = normalizeText(chunk.document_name);
  const tokenHits = countMatches(normalizedContent, questionTokens);
  const phraseHits = countMatches(normalizedContent, phrases);
  const titleHits = countMatches(normalizedDocumentName, questionTokens);

  return tokenHits * 12 + phraseHits * 18 + titleHits * 4;
}

function buildSummaryLines(
  questionTokens: string[],
  phrases: string[],
  rankedChunks: RankedChunk[]
): SummaryLine[] {
  const seen = new Set<string>();
  const candidates: SummaryLine[] = [];

  for (const chunk of rankedChunks) {
    const sentences = splitSentences(chunk.content);

    if (sentences.length === 0) {
      const snippet = stripNoise(chunk.content);
      if (snippet.length >= 35) {
        candidates.push({
          sentence: snippet.slice(0, 320).trimEnd(),
          score: chunk.score,
          source: chunk.document_name,
        });
      }
      continue;
    }

    for (const sentence of sentences) {
      const normalizedSentence = normalizeText(sentence);
      if (seen.has(normalizedSentence)) continue;

      const tokenHits = countMatches(normalizedSentence, questionTokens);
      const phraseHits = countMatches(normalizedSentence, phrases);
      const sentenceScore = tokenHits * 10 + phraseHits * 18 + chunk.score;

      if (sentenceScore < MIN_SENTENCE_SCORE) continue;

      seen.add(normalizedSentence);
      candidates.push({
        sentence,
        score: sentenceScore,
        source: chunk.document_name,
      });
    }
  }

  return candidates.sort((left, right) => right.score - left.score).slice(0, MAX_SUMMARY_LINES);
}

function buildFoundResponse(summaryLines: SummaryLine[], sources: string[], topScore: number): string {
  const intro = topScore >= STRONG_CHUNK_SCORE
    ? "**Resposta baseada na base documental local da CLARA.**"
    : "**Encontrei referencias parciais na base documental local da CLARA.**";

  const summary = summaryLines
    .map((line) => `- ${line.sentence} (${line.source})`)
    .join("\n");

  const citedSources = sources.map((source) => `- ${source}`).join("\n");

  return `${intro}\n\n### Sintese objetiva\n${summary}\n\n### Fontes encontradas\n${citedSources}\n\nSe quiser, posso reorganizar esse material em passo a passo ou checklist.`;
}

function buildNotFoundResponse(): string {
  return `**Nao encontrei uma resposta confiavel na base documental local da CLARA.**\n\n### O que fazer agora\n- Reformule a pergunta com termos mais especificos do procedimento.\n- Cite o nome do sistema, documento ou etapa que voce quer localizar.\n- Se preferir, eu posso tentar buscar por palavras-chave mais objetivas dentro dos PDFs disponiveis.`;
}

export function answerQuestionFromChunks(
  question: string,
  chunks: LocalKnowledgeChunk[]
): LocalKnowledgeAnswer {
  const questionTokens = tokenizeQuestion(question);
  const phrases = buildPhrases(questionTokens);

  if (questionTokens.length === 0) {
    return {
      found: false,
      response: buildNotFoundResponse(),
      sources: [],
      topScore: 0,
    };
  }

  const rankedChunks = chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(questionTokens, phrases, chunk),
    }))
    .filter((chunk) => chunk.score >= MIN_CHUNK_SCORE)
    .sort((left, right) => right.score - left.score || left.chunk_index - right.chunk_index)
    .slice(0, MAX_SELECTED_CHUNKS);

  if (rankedChunks.length === 0) {
    return {
      found: false,
      response: buildNotFoundResponse(),
      sources: [],
      topScore: 0,
    };
  }

  const summaryLines = buildSummaryLines(questionTokens, phrases, rankedChunks);
  if (summaryLines.length === 0) {
    return {
      found: false,
      response: buildNotFoundResponse(),
      sources: [],
      topScore: rankedChunks[0]?.score ?? 0,
    };
  }

  const sources = Array.from(new Set(rankedChunks.map((chunk) => chunk.document_name)));
  const topScore = rankedChunks[0]?.score ?? 0;

  return {
    found: true,
    response: buildFoundResponse(summaryLines, sources, topScore),
    sources,
    topScore,
  };
}

async function loadKnowledgeChunks(): Promise<LocalKnowledgeChunk[]> {
  if (!knowledgeChunksPromise) {
    knowledgeChunksPromise = fetch("/knowledge-base/chunks.json").then(async (response) => {
      if (!response.ok) {
        throw new Error("Nao foi possivel carregar a base documental local.");
      }

      return response.json() as Promise<LocalKnowledgeChunk[]>;
    });
  }

  return knowledgeChunksPromise;
}

export async function answerQuestionWithLocalKnowledge(question: string): Promise<LocalKnowledgeAnswer> {
  const chunks = await loadKnowledgeChunks();
  return answerQuestionFromChunks(question, chunks);
}
