export interface RetrievedChunk {
  content: string;
  similarity: number;
  document_name?: string | null;
  document_kind?: string | null;
  document_authority_level?: string | null;
  document_search_weight?: number | null;
  document_topic_scope?: string | null;
  document_source_type?: string | null;
  document_source_name?: string | null;
  page_start?: number | null;
  page_end?: number | null;
  section_title?: string | null;
}

export interface KnowledgeReference {
  id: number;
  sourceLabel: string;
  documentName: string;
  documentKind?: string | null;
  pageLabel?: string;
  sectionTitle?: string;
}

export interface KnowledgeDecision {
  relevantChunks: RetrievedChunk[];
  knowledgeContext: string;
  topScore: number;
  sources: string[];
  references: KnowledgeReference[];
}

interface ParsedChunk {
  content: string;
  similarity: number;
  documentName: string;
  documentKind?: string | null;
  documentAuthorityLevel?: string | null;
  documentSearchWeight?: number | null;
  documentTopicScope?: string | null;
  documentSourceType?: string | null;
  documentSourceName?: string | null;
  pageLabel?: string;
  sectionTitle?: string;
  sourceLabel: string;
}

const MIN_RRF_SCORE = 0.006;
const STRONG_RRF_SCORE = 0.012;
const MAX_SELECTED_CHUNKS = 6;
const MIN_TOKEN_LENGTH = 3;

const PROTECTED_TOKENS = new Set(["sei", "rio", "pdf", "rls", "tus"]);

const STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos",
  "e", "em", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por",
  "qual", "quais", "que", "se", "sem", "ser", "uma", "um",
]);

const TECHNICAL_PATTERNS = [
  /\bapi\b/i,
  /\bbackend\b/i,
  /\bfront[- ]?end\b/i,
  /\brag\b/i,
  /\bembedding/i,
  /\bsupabase\b/i,
  /\bedge function\b/i,
  /\btelemetri/i,
  /\bmigrac[aã]o\b/i,
  /\bvercel\b/i,
  /\bprompt\b/i,
  /\bschema\b/i,
  /\bjson\b/i,
  /\bvector\b/i,
  /\bchunk\b/i,
  /\btoken\b/i,
  /\bpolicy\b/i,
  /\brls\b/i,
  /\blovable\b/i,
  /\blayout\b/i,
  /\bmotion\b/i,
];

const PROCEDURAL_PATTERNS = [
  /\bsei(?:-rio)?\b/i,
  /\bprocesso\b/i,
  /\bdocumento\b/i,
  /\banexo\b/i,
  /\bassinatura\b/i,
  /\bbloco\b/i,
  /\btramit/i,
  /\bencaminh/i,
  /\bunidade\b/i,
  /\bdespacho\b/i,
  /\bincluir\b/i,
  /\bprocedimento\b/i,
];

const OFFICIAL_DOCUMENT_HINTS = [
  /\bmanual\b/i,
  /\bguia\b/i,
  /\binstruc[aã]o\b/i,
  /\bsei(?:-rio)?\b/i,
  /\bprocesso\b/i,
  /\bassinatura\b/i,
  /\btramit/i,
];

const TOPIC_SCOPE_SCORE: Record<string, number> = {
  sei_rio_norma: 1.5,
  sei_rio_manual: 1.35,
  sei_rio_guia: 1.15,
  sei_rio_faq: 0.85,
  rotina_administrativa: 0.7,
  material_apoio: 0.45,
  clara_internal: -10,
};

const AUTHORITY_LEVEL_SCORE: Record<string, number> = {
  official: 1.2,
  institutional: 0.8,
  supporting: 0.25,
  internal: -4,
};

const DOCUMENT_KIND_SCORE: Record<string, number> = {
  norma: 1.2,
  manual: 1,
  guia: 0.8,
  faq: 0.45,
  administrativo: 0.3,
  apoio: 0.15,
  internal_technical: -4,
};

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
        .filter((token) =>
          !STOP_WORDS.has(token) &&
          (token.length >= MIN_TOKEN_LENGTH || PROTECTED_TOKENS.has(token))
        )
    )
  );
}

function countPatternMatches(patterns: RegExp[], text: string) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function isTechnicalQuestion(question: string) {
  return countPatternMatches(TECHNICAL_PATTERNS, question) >= 2;
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
    documentKind: chunk.document_kind ?? null,
    documentAuthorityLevel: chunk.document_authority_level ?? null,
    documentSearchWeight: chunk.document_search_weight ?? null,
    documentTopicScope: chunk.document_topic_scope ?? null,
    documentSourceType: chunk.document_source_type ?? null,
    documentSourceName: chunk.document_source_name ?? null,
    pageLabel,
    sectionTitle,
    sourceLabel,
  };
}

function lexicalOverlap(tokens: string[], text: string): number {
  const normalized = normalizeText(text);
  return tokens.reduce((score, token) => (normalized.includes(token) ? score + 1 : score), 0);
}

function scoreChunk(question: string, tokens: string[], chunk: ParsedChunk, index: number) {
  const overlap = lexicalOverlap(tokens, chunk.content);
  const searchCorpus = `${chunk.documentName}\n${chunk.sectionTitle ?? ""}\n${chunk.content.slice(0, 1200)}`;
  const technicalMatches = countPatternMatches(TECHNICAL_PATTERNS, searchCorpus);
  const proceduralMatches = countPatternMatches(PROCEDURAL_PATTERNS, searchCorpus);
  const officialMatches = countPatternMatches(OFFICIAL_DOCUMENT_HINTS, `${chunk.documentName}\n${chunk.sectionTitle ?? ""}`);
  const technicalQuestion = isTechnicalQuestion(question);
  const topicScopeBonus = chunk.documentTopicScope ? (TOPIC_SCOPE_SCORE[chunk.documentTopicScope] ?? 0) : 0;
  const authorityBonus = chunk.documentAuthorityLevel ? (AUTHORITY_LEVEL_SCORE[chunk.documentAuthorityLevel] ?? 0) : 0;
  const documentKindBonus = chunk.documentKind ? (DOCUMENT_KIND_SCORE[chunk.documentKind] ?? 0) : 0;
  const searchWeightBonus = chunk.documentSearchWeight ? (chunk.documentSearchWeight - 1) * 4 : 0;

  let finalScore = chunk.similarity * 1000;
  finalScore += overlap * 2.4;
  finalScore += proceduralMatches * 0.8;
  finalScore += officialMatches * 0.9;
  finalScore += topicScopeBonus;
  finalScore += authorityBonus;
  finalScore += documentKindBonus;
  finalScore += searchWeightBonus;

  if (index < 3 && chunk.similarity >= STRONG_RRF_SCORE) {
    finalScore += 0.5;
  }

  if (!technicalQuestion && technicalMatches > proceduralMatches + officialMatches) {
    finalScore -= technicalMatches * 3.5;
  }

  const rejectAsInternal =
    !technicalQuestion &&
    (
      chunk.documentTopicScope === 'clara_internal' ||
      chunk.documentKind === 'internal_technical' ||
      chunk.documentAuthorityLevel === 'internal' ||
      (technicalMatches >= 3 && proceduralMatches === 0 && officialMatches === 0)
    );

  const accept =
    !rejectAsInternal &&
    (
      (chunk.similarity >= MIN_RRF_SCORE && overlap > 0) ||
      (chunk.similarity >= STRONG_RRF_SCORE && index < 3 && technicalMatches <= proceduralMatches + officialMatches + 1) ||
      (chunk.similarity >= STRONG_RRF_SCORE && proceduralMatches > 0)
    );

  return {
    accept,
    overlap,
    finalScore,
    technicalMatches,
  };
}

function buildKnowledgeContext(chunks: Array<ParsedChunk & { referenceId: number }>): string {
  const referenceList = chunks
    .map((chunk) => `${chunk.referenceId}. ${chunk.sourceLabel}`)
    .join("\n");

  const blocks = chunks.map(
    (chunk) =>
      `[Referencia ${chunk.referenceId}: ${chunk.sourceLabel}]\n${chunk.content}`
  );

  return `\n\n--- BASE DE CONHECIMENTO INTERNA ---
Os trechos abaixo foram recuperados da base documental validada da CLARA.

REFERENCIAS AUTORIZADAS:
${referenceList}

INSTRUCOES PARA USO DESTES TRECHOS:
- Use estes trechos como fonte primaria e prioritaria para formular a resposta.
- Responda a pergunta do usuario sobre o uso do SEI-Rio, nao sobre o funcionamento interno da CLARA.
- Ignore completamente qualquer trecho tecnico sobre backend, RAG, APIs, embeddings, telemetria ou infraestrutura.
- Consolide informacoes de multiplos trechos quando eles se complementam.
- Cite apenas os numeros das referencias autorizadas quando houver base suficiente.
- Se os trechos nao sustentarem a resposta, admita a limitacao com transparencia.

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
    .map((chunk, index) => ({ chunk, index, score: scoreChunk(question, questionTokens, chunk, index) }))
    .filter(({ score }) => score.accept)
    .sort((left, right) => right.score.finalScore - left.score.finalScore)
    .slice(0, MAX_SELECTED_CHUNKS)
    .map(({ chunk }) => chunk);

  if (parsedChunks.length === 0) {
    return {
      relevantChunks: [],
      knowledgeContext: "",
      topScore: 0,
      sources: [],
      references: [],
    };
  }

  const chunksWithReferences = parsedChunks.map((chunk, index) => ({
    ...chunk,
    referenceId: index + 1,
  }));

  const relevantChunks = chunksWithReferences.map((chunk) => ({
    content: chunk.content,
    similarity: chunk.similarity,
    document_name: chunk.documentName,
    document_kind: chunk.documentKind ?? null,
    document_authority_level: chunk.documentAuthorityLevel ?? null,
    document_search_weight: chunk.documentSearchWeight ?? null,
    document_topic_scope: chunk.documentTopicScope ?? null,
    document_source_type: chunk.documentSourceType ?? null,
    document_source_name: chunk.documentSourceName ?? null,
    section_title: chunk.sectionTitle ?? null,
    page_start: chunk.pageLabel ? Number.parseInt(chunk.pageLabel.split("-")[0] ?? "", 10) || null : null,
    page_end: chunk.pageLabel
      ? Number.parseInt(chunk.pageLabel.split("-")[1] ?? chunk.pageLabel, 10) || null
      : null,
  }));
  const topScore = chunksWithReferences[0]?.similarity ?? 0;
  const sources = Array.from(new Set(chunksWithReferences.map((chunk) => chunk.sourceLabel)));
  const references = chunksWithReferences.map((chunk) => ({
    id: chunk.referenceId,
    sourceLabel: chunk.sourceLabel,
    documentName: chunk.documentName,
    documentKind: chunk.documentKind ?? null,
    pageLabel: chunk.pageLabel,
    sectionTitle: chunk.sectionTitle,
  }));

  return {
    relevantChunks,
    knowledgeContext: buildKnowledgeContext(chunksWithReferences),
    topScore,
    sources,
    references,
  };
}
