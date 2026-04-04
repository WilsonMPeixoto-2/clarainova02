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
  retrievalQuality: RetrievalQualityInfo;
  sourceTargetLabel: string | null;
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

const INTERFACE_PATTERNS = [
  /\binterface\b/i,
  /\bicone/i,
  /\bmenu lateral\b/i,
  /\blayout\b/i,
  /\batalho/i,
  /\bcart[oõ]es?\b/i,
  /\beditor\b/i,
];

const VERSION_LABEL_PATTERN = /\b\d+(?:\.\d+)+\b/g;

const TOPIC_SCOPE_SCORE: Record<string, number> = {
  sei_rio_norma: 1.5,
  sei_rio_manual: 1.35,
  sei_rio_guia: 1.15,
  sei_rio_termo: 0.95,
  sei_rio_faq: 0.85,
  pen_manual_compativel: 0.35,
  pen_compatibilidade: 0.18,
  pen_release_note: 0.08,
  interface_update: 0.05,
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

function computeIntentAdjustment(question: string, chunk: ParsedChunk) {
  const normalizedQuestion = normalizeText(question);
  const normalizedChunkIdentity = normalizeText(
    `${chunk.documentName}\n${chunk.documentSourceName ?? ""}\n${chunk.sectionTitle ?? ""}`,
  );

  const asksOfficialNote = normalizedQuestion.includes("nota oficial");
  const asksWiki = normalizedQuestion.includes("wiki");
  const asksUfscar = normalizedQuestion.includes("ufscar");
  const asksVersion = normalizedQuestion.includes("versao") || extractVersionLabels(question).length > 0;
  const asksInterface = countPatternMatches(INTERFACE_PATTERNS, question) > 0;

  let bonus = 0;
  let penalty = 0;

  if (asksOfficialNote) {
    if (chunk.documentTopicScope === "pen_release_note" || chunk.documentTopicScope === "pen_compatibilidade") {
      bonus += 5.2;
    }
    if (normalizedChunkIdentity.includes("ministerio da gestao") || normalizedChunkIdentity.includes("mgi")) {
      bonus += 2.1;
    }
    if (chunk.documentTopicScope?.startsWith("sei_rio_")) {
      penalty += 2.4;
    }
  }

  if (asksWiki) {
    if (chunk.documentTopicScope === "interface_update" || normalizedChunkIdentity.includes("wiki")) {
      bonus += 5.4;
    }
    if (chunk.documentTopicScope?.startsWith("sei_rio_")) {
      penalty += 1.4;
    }
  }

  if (asksUfscar) {
    if (
      normalizedChunkIdentity.includes("ufscar") ||
      normalizedChunkIdentity.includes("universidade federal de sao carlos") ||
      normalizedChunkIdentity.includes("correspondencia de icones")
    ) {
      bonus += 7.5;
    }
    if (chunk.documentTopicScope?.startsWith("sei_rio_")) {
      penalty += 2;
    }
  }

  if (asksInterface) {
    if (chunk.documentTopicScope === "interface_update") {
      bonus += 3.4;
    }
    if (chunk.documentTopicScope === "pen_manual_compativel" || chunk.documentTopicScope === "pen_release_note") {
      bonus += 1.2;
    }
  }

  if (asksVersion) {
    if (
      chunk.documentTopicScope === "pen_manual_compativel" ||
      chunk.documentTopicScope === "pen_compatibilidade" ||
      chunk.documentTopicScope === "pen_release_note" ||
      chunk.documentTopicScope === "interface_update"
    ) {
      bonus += 1.8;
    }
  }

  return { bonus, penalty };
}

// ============================================================
// SOURCE-TARGET ROUTING
// ============================================================

export interface SourceTargetRoute {
  label: string;
  matches: (chunk: ParsedChunk) => boolean;
  versionConstraint: string | null;
  topicScopes: string[];
  sourceNamePatterns: string[];
}

const SOURCE_TARGET_PATTERNS: Array<{
  pattern: RegExp;
  build: (match: RegExpMatchArray) => SourceTargetRoute;
}> = [
  {
    pattern: /(?:segundo|conforme|de acordo com)\s+(?:a\s+)?nota\s+oficial\s+(?:do\s+)?(?:sei|MGI)\s*(\d+(?:\.\d+)*)?/i,
    build: (m) => {
      const version = m[1] ?? null;
      return {
        label: version ? `nota_oficial_sei_${version}` : "nota_oficial",
        versionConstraint: version,
        topicScopes: ["pen_release_note", "pen_compatibilidade"],
        sourceNamePatterns: ["%Ministério da Gestão%", "%MGI%"],
        matches: (chunk) => {
          const scope = chunk.documentTopicScope ?? "";
          const identity = normalizeText(`${chunk.documentName}\n${chunk.documentSourceName ?? ""}`);
          const isReleaseNote = scope === "pen_release_note" || scope === "pen_compatibilidade";
          const isMgi = identity.includes("ministerio da gestao") || identity.includes("mgi");
          if (!isReleaseNote && !isMgi) return false;
          if (version) {
            return containsExactVersionLabel(
              `${chunk.documentName}\n${chunk.content.slice(0, 400)}`.toLowerCase(),
              version,
            );
          }
          return true;
        },
      };
    },
  },
  {
    pattern: /(?:segundo|conforme|de acordo com)\s+(?:a\s+)?wiki\s*(?:do\s+)?(?:sei[- ]?r[jJ]|sei[- ]?rio)?/i,
    build: () => ({
      label: "wiki_sei_rj",
      versionConstraint: null,
      topicScopes: ["interface_update"],
      sourceNamePatterns: ["%wiki%"],
      matches: (chunk) => {
        const scope = chunk.documentTopicScope ?? "";
        const identity = normalizeText(`${chunk.documentName}\n${chunk.documentSourceName ?? ""}`);
        return scope === "interface_update" || identity.includes("wiki");
      },
    }),
  },
  {
    pattern: /(?:segundo|conforme|de acordo com)\s+(?:o\s+)?(?:material|documento|guia)\s+(?:da\s+)?ufscar/i,
    build: () => ({
      label: "material_ufscar",
      versionConstraint: null,
      topicScopes: ["interface_update"],
      sourceNamePatterns: ["%UFSCar%", "%São Carlos%"],
      matches: (chunk) => {
        const identity = normalizeText(`${chunk.documentName}\n${chunk.documentSourceName ?? ""}`);
        return identity.includes("ufscar") || identity.includes("universidade federal de sao carlos");
      },
    }),
  },
  {
    pattern: /(?:segundo|conforme|de acordo com)\s+(?:o\s+)?manual\s+(?:do\s+)?(?:PEN|usuario\s+(?:do\s+)?(?:PEN|SEI\s*4))/i,
    build: () => ({
      label: "manual_pen",
      versionConstraint: null,
      topicScopes: ["pen_manual_compativel"],
      sourceNamePatterns: [],
      matches: (chunk) => {
        const scope = chunk.documentTopicScope ?? "";
        return scope === "pen_manual_compativel";
      },
    }),
  },
];

export function detectSourceTarget(question: string): SourceTargetRoute | null {
  for (const { pattern, build } of SOURCE_TARGET_PATTERNS) {
    const match = question.match(pattern);
    if (match) return build(match);
  }
  return null;
}

const MIN_ROUTED_CHUNKS = 2;
const ROUTE_SCORE_BOOST = 15;

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

function extractVersionLabels(text: string): string[] {
  const labels = text.toLowerCase().match(VERSION_LABEL_PATTERN) ?? [];
  return Array.from(new Set(labels));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsExactVersionLabel(text: string, label: string) {
  const pattern = new RegExp(`(^|[^0-9.])${escapeRegExp(label)}(?=$|[^0-9.])`, "i");
  return pattern.test(text);
}

function scoreChunk(question: string, tokens: string[], chunk: ParsedChunk, index: number) {
  const searchCorpus = `${chunk.documentName}\n${chunk.documentSourceName ?? ""}\n${chunk.sectionTitle ?? ""}\n${chunk.content.slice(0, 1200)}`;
  const overlap = lexicalOverlap(tokens, searchCorpus);
  const questionVersionLabels = extractVersionLabels(question);
  const chunkVersionLabels = extractVersionLabels(searchCorpus);
  const versionOverlap = questionVersionLabels.reduce(
    (score, label) => (containsExactVersionLabel(searchCorpus.toLowerCase(), label) ? score + 1 : score),
    0,
  );
  const versionMismatchPenalty =
    questionVersionLabels.length > 0 &&
    chunkVersionLabels.length > 0 &&
    versionOverlap === 0
      ? 3.5
      : 0;
  const technicalMatches = countPatternMatches(TECHNICAL_PATTERNS, searchCorpus);
  const proceduralMatches = countPatternMatches(PROCEDURAL_PATTERNS, searchCorpus);
  const officialMatches = countPatternMatches(OFFICIAL_DOCUMENT_HINTS, `${chunk.documentName}\n${chunk.documentSourceName ?? ""}\n${chunk.sectionTitle ?? ""}`);
  const technicalQuestion = isTechnicalQuestion(question);
  const topicScopeBonus = chunk.documentTopicScope ? (TOPIC_SCOPE_SCORE[chunk.documentTopicScope] ?? 0) : 0;
  const authorityBonus = chunk.documentAuthorityLevel ? (AUTHORITY_LEVEL_SCORE[chunk.documentAuthorityLevel] ?? 0) : 0;
  const documentKindBonus = chunk.documentKind ? (DOCUMENT_KIND_SCORE[chunk.documentKind] ?? 0) : 0;
  const searchWeightBonus = chunk.documentSearchWeight ? (chunk.documentSearchWeight - 1) * 4 : 0;
  const intentAdjustment = computeIntentAdjustment(question, chunk);

  let finalScore = chunk.similarity * 1000;
  finalScore += overlap * 2.4;
  finalScore += versionOverlap * 4.2;
  finalScore -= versionMismatchPenalty;
  finalScore += proceduralMatches * 0.8;
  finalScore += officialMatches * 0.9;
  finalScore += topicScopeBonus;
  finalScore += authorityBonus;
  finalScore += documentKindBonus;
  finalScore += searchWeightBonus;
  finalScore += intentAdjustment.bonus;
  finalScore -= intentAdjustment.penalty;

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
- Quando multiplos trechos abordam o mesmo procedimento, consolide em um unico passo a passo coerente e completo.
- Priorize o trecho mais especifico e atual quando houver sobreposicao entre fontes.
- Se dois trechos se contradizem, sinalize a divergencia ao usuario com transparencia e priorize a fonte de maior autoridade.
- Quando um trecho complementa outro (ex: um da visao geral e outro o detalhe), integre ambos em uma resposta fluida.
- Cite apenas os numeros das referencias autorizadas quando houver base suficiente.
- Se os trechos nao sustentarem a resposta, admita a limitacao com transparencia.

${blocks.join("\n\n---\n\n")}
--- FIM DA BASE DE CONHECIMENTO INTERNA ---`;
}

export interface RetrievalQualityInfo {
  confidenceTier: 'alta' | 'boa' | 'moderada' | 'fraca';
  topScore: number;
  sourceCount: number;
  uniqueDocuments: number;
  avgOverlap: number;
  chunkCount: number;
}

export function buildRetrievalQualityPrompt(
  quality: RetrievalQualityInfo,
  retrievalMode: string,
): string {
  if (retrievalMode !== 'model_grounded' || quality.chunkCount === 0) {
    return `

QUALIDADE DA RECUPERACAO:
- Modo: sem base documental
- Responda com cautela e sinalize que nao ha base documental suficiente.`;
  }

  return `

QUALIDADE DA RECUPERACAO:
- Modo: base documental ativa | Confianca: ${quality.confidenceTier} (score maximo: ${quality.topScore.toFixed(4)})
- Fontes: ${quality.chunkCount} trecho${quality.chunkCount > 1 ? 's' : ''} de ${quality.uniqueDocuments} documento${quality.uniqueDocuments > 1 ? 's' : ''}
- Cobertura lexica media: ${quality.avgOverlap.toFixed(1)} tokens
- ${quality.confidenceTier === 'alta' || quality.confidenceTier === 'boa'
    ? 'A base documental sustenta bem a resposta. Seja assertivo nas orientacoes.'
    : quality.confidenceTier === 'moderada'
    ? 'A base tem cobertura parcial. Responda o que puder e sinalize limitacoes.'
    : 'A base e fraca. Seja cauteloso e sinalize que validacao oficial pode ser necessaria.'}`;
}

export interface AdjacentChunkRequest {
  documentId: string;
  chunkIndex: number;
}

export function buildSourceTargetPrompt(route: SourceTargetRoute): string {
  return `
FONTE-ALVO NOMEADA PELO USUARIO:
- O usuario pediu explicitamente informacoes "${route.label.replace(/_/g, ' ')}".${route.versionConstraint ? `\n- Versao especifica solicitada: ${route.versionConstraint}.` : ''}
- PRIORIZE as referencias que correspondam a essa fonte na resposta.
- Cite explicitamente essa fonte nas referencias finais.
- Se a base documental nao contiver essa fonte especifica, sinalize ao usuario com transparencia.`;
}

export function identifyAdjacentChunkRequests(
  chunks: RetrievedChunk[],
  selectedChunks: Array<{ similarity: number; document_id?: string; chunk_index?: number }>,
): AdjacentChunkRequest[] {
  const highScoreThreshold = STRONG_RRF_SCORE * 1.5;
  const requests: AdjacentChunkRequest[] = [];
  const existingKeys = new Set(
    selectedChunks.map((c) => `${c.document_id}:${c.chunk_index}`)
  );

  for (const chunk of selectedChunks) {
    if (
      chunk.similarity >= highScoreThreshold &&
      chunk.document_id &&
      typeof chunk.chunk_index === 'number'
    ) {
      for (const offset of [-1, 1]) {
        const adjIndex = chunk.chunk_index + offset;
        const key = `${chunk.document_id}:${adjIndex}`;
        if (adjIndex >= 0 && !existingKeys.has(key)) {
          requests.push({ documentId: chunk.document_id, chunkIndex: adjIndex });
          existingKeys.add(key);
        }
      }
    }

    if (requests.length >= 2) break;
  }

  return requests;
}

export function enrichKnowledgeContextWithAdjacent(
  existingContext: string,
  adjacentChunks: Array<{ content: string; document_name?: string; section_title?: string; page_start?: number }>,
): string {
  if (adjacentChunks.length === 0 || !existingContext) return existingContext;

  const supplementary = adjacentChunks
    .map((chunk) => {
      const label = chunk.document_name || 'Documento';
      const page = chunk.page_start ? ` - Página ${chunk.page_start}` : '';
      return `[Contexto complementar: ${label}${page}]\n${chunk.content}`;
    })
    .join('\n\n---\n\n');

  return existingContext.replace(
    '--- FIM DA BASE DE CONHECIMENTO INTERNA ---',
    `\n---\n\nCONTEXTO COMPLEMENTAR (trechos adjacentes dos mesmos documentos para completude):\n${supplementary}\n--- FIM DA BASE DE CONHECIMENTO INTERNA ---`,
  );
}

export function prepareKnowledgeDecision(
  question: string,
  chunks: RetrievedChunk[],
  sourceTarget?: SourceTargetRoute | null,
): KnowledgeDecision {
  const questionTokens = tokenizeQuestion(question);
  const allScored = chunks
    .filter((chunk) => Number.isFinite(chunk.similarity))
    .sort((left, right) => right.similarity - left.similarity)
    .map(parseChunk)
    .map((chunk, index) => ({
      chunk,
      index,
      score: scoreChunk(question, questionTokens, chunk, index),
      routeMatch: sourceTarget ? sourceTarget.matches(chunk) : false,
    }))
    .filter(({ score }) => score.accept);

  if (sourceTarget) {
    for (const entry of allScored) {
      if (entry.routeMatch) {
        entry.score = { ...entry.score, finalScore: entry.score.finalScore + ROUTE_SCORE_BOOST };
      }
    }
  }

  allScored.sort((left, right) => right.score.finalScore - left.score.finalScore);

  let scoredChunks: typeof allScored;
  if (sourceTarget) {
    const routed = allScored.filter((e) => e.routeMatch);
    const nonRouted = allScored.filter((e) => !e.routeMatch);
    const guaranteedRouted = routed.slice(0, MIN_ROUTED_CHUNKS);
    const remaining = [...routed.slice(MIN_ROUTED_CHUNKS), ...nonRouted]
      .sort((a, b) => b.score.finalScore - a.score.finalScore);
    const merged = [...guaranteedRouted, ...remaining].slice(0, MAX_SELECTED_CHUNKS);
    merged.sort((a, b) => b.score.finalScore - a.score.finalScore);
    scoredChunks = merged;
  } else {
    scoredChunks = allScored.slice(0, MAX_SELECTED_CHUNKS);
  }

  const parsedChunks = scoredChunks.map(({ chunk }) => chunk);

  const emptyQuality: RetrievalQualityInfo = {
    confidenceTier: 'fraca',
    topScore: 0,
    sourceCount: 0,
    uniqueDocuments: 0,
    avgOverlap: 0,
    chunkCount: 0,
  };

  if (parsedChunks.length === 0) {
    return {
      relevantChunks: [],
      knowledgeContext: "",
      topScore: 0,
      sources: [],
      references: [],
      retrievalQuality: emptyQuality,
      sourceTargetLabel: sourceTarget?.label ?? null,
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

  const avgOverlap = scoredChunks.length > 0
    ? scoredChunks.reduce((sum, { score }) => sum + score.overlap, 0) / scoredChunks.length
    : 0;
  const uniqueDocuments = new Set(chunksWithReferences.map((c) => c.documentName)).size;
  const confidenceTier: RetrievalQualityInfo['confidenceTier'] =
    topScore >= 0.016 ? 'alta' :
    topScore >= 0.012 ? 'boa' :
    topScore >= 0.008 ? 'moderada' : 'fraca';

  return {
    relevantChunks,
    knowledgeContext: buildKnowledgeContext(chunksWithReferences),
    topScore,
    sources,
    references,
    retrievalQuality: {
      confidenceTier,
      topScore,
      sourceCount: sources.length,
      uniqueDocuments,
      avgOverlap,
      chunkCount: parsedChunks.length,
    },
    sourceTargetLabel: sourceTarget?.label ?? null,
  };
}
