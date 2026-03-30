export type KnowledgeTopicScope =
  | 'sei_rio_manual'
  | 'sei_rio_guia'
  | 'sei_rio_norma'
  | 'sei_rio_faq'
  | 'rotina_administrativa'
  | 'material_apoio'
  | 'clara_internal';

export type KnowledgeDocumentKind =
  | 'manual'
  | 'guia'
  | 'norma'
  | 'faq'
  | 'administrativo'
  | 'apoio'
  | 'internal_technical';

export type KnowledgeAuthorityLevel = 'official' | 'institutional' | 'internal' | 'supporting';

export type KnowledgeCorpusCategory =
  | 'nucleo_oficial'
  | 'cobertura_operacional'
  | 'apoio_complementar'
  | 'interno_excluido';

export type KnowledgeIngestionPriority = 'alta' | 'media' | 'baixa';

export const KNOWLEDGE_TOPIC_SCOPES: KnowledgeTopicScope[] = [
  'sei_rio_manual',
  'sei_rio_guia',
  'sei_rio_norma',
  'sei_rio_faq',
  'rotina_administrativa',
  'material_apoio',
  'clara_internal',
];

export const KNOWLEDGE_DOCUMENT_KINDS: KnowledgeDocumentKind[] = [
  'manual',
  'guia',
  'norma',
  'faq',
  'administrativo',
  'apoio',
  'internal_technical',
];

export const KNOWLEDGE_AUTHORITY_LEVELS: KnowledgeAuthorityLevel[] = [
  'official',
  'institutional',
  'internal',
  'supporting',
];

export const KNOWLEDGE_CORPUS_CATEGORIES: KnowledgeCorpusCategory[] = [
  'nucleo_oficial',
  'cobertura_operacional',
  'apoio_complementar',
  'interno_excluido',
];

export const KNOWLEDGE_INGESTION_PRIORITIES: KnowledgeIngestionPriority[] = [
  'alta',
  'media',
  'baixa',
];

export const KNOWLEDGE_TOPIC_SCOPE_LABELS: Record<KnowledgeTopicScope, string> = {
  sei_rio_manual: 'Manual do SEI-Rio',
  sei_rio_guia: 'Guia do SEI-Rio',
  sei_rio_norma: 'Norma do SEI-Rio',
  sei_rio_faq: 'FAQ do SEI-Rio',
  rotina_administrativa: 'Rotina administrativa',
  material_apoio: 'Material de apoio',
  clara_internal: 'Material interno da CLARA',
};

export const KNOWLEDGE_DOCUMENT_KIND_LABELS: Record<KnowledgeDocumentKind, string> = {
  manual: 'Manual',
  guia: 'Guia',
  norma: 'Norma',
  faq: 'FAQ',
  administrativo: 'Administrativo',
  apoio: 'Apoio',
  internal_technical: 'Interno tecnico',
};

export const KNOWLEDGE_AUTHORITY_LEVEL_LABELS: Record<KnowledgeAuthorityLevel, string> = {
  official: 'Oficial',
  institutional: 'Institucional',
  internal: 'Interno',
  supporting: 'Complementar',
};

export const KNOWLEDGE_CORPUS_CATEGORY_LABELS: Record<KnowledgeCorpusCategory, string> = {
  nucleo_oficial: 'Nucleo oficial',
  cobertura_operacional: 'Cobertura operacional',
  apoio_complementar: 'Apoio complementar',
  interno_excluido: 'Interno excluido',
};

export const KNOWLEDGE_INGESTION_PRIORITY_LABELS: Record<KnowledgeIngestionPriority, string> = {
  alta: 'Alta',
  media: 'Media',
  baixa: 'Baixa',
};

export interface KnowledgeDocumentClassification {
  topicScope: KnowledgeTopicScope;
  documentKind: KnowledgeDocumentKind;
  authorityLevel: KnowledgeAuthorityLevel;
  shouldIndex: boolean;
  warning: string | null;
  technicalScore: number;
  proceduralScore: number;
  officialScore: number;
  faqScore: number;
  guideScore: number;
  normativeScore: number;
  manualScore: number;
  searchWeight: number;
  tags: string[];
  excludedFromChatReason: string | null;
}

export interface KnowledgeGovernanceRecommendation {
  corpusCategory: KnowledgeCorpusCategory;
  ingestionPriority: KnowledgeIngestionPriority;
  rationale: string;
}

const TECHNICAL_PATTERNS = [
  /\bapi\b/i,
  /\bbackend\b/i,
  /\bfront[- ]?end\b/i,
  /\brag\b/i,
  /\bembedding/i,
  /\bembeddings\b/i,
  /\bprompt\b/i,
  /\bschema\b/i,
  /\bjson\b/i,
  /\bsupabase\b/i,
  /\bedge function\b/i,
  /\btelemetri/i,
  /\bmigrac[aã]o\b/i,
  /\bvercel\b/i,
  /\bvector\b/i,
  /\bchunk\b/i,
  /\bchunks\b/i,
  /\btoken\b/i,
  /\brls\b/i,
  /\bpolicy\b/i,
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
  /\brotina administrativa\b/i,
];

const OFFICIAL_PATTERNS = [
  /\bsecretaria municipal\b/i,
  /\bprefeitura\b/i,
  /\brio de janeiro\b/i,
  /\bsei-rio\b/i,
  /\bmanual operacional\b/i,
  /\bguia pratico\b/i,
];

const FAQ_PATTERNS = [
  /\bfaq\b/i,
  /\bperguntas frequentes\b/i,
  /\bd[uú]vidas frequentes\b/i,
];

const GUIDE_PATTERNS = [
  /\bguia\b/i,
  /\broteiro\b/i,
  /\bcartilha\b/i,
  /\btutorial\b/i,
  /\bpasso a passo\b/i,
];

const MANUAL_PATTERNS = [
  /\bmanual\b/i,
  /\bmanual operacional\b/i,
  /\bmanual de uso\b/i,
];

const NORMATIVE_PATTERNS = [
  /\bportaria\b/i,
  /\binstruc[aã]o normativa\b/i,
  /\bresolu[cç][aã]o\b/i,
  /\bdecreto\b/i,
  /\blei\b/i,
  /\bnorma\b/i,
];

function countMatches(patterns: RegExp[], text: string) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function buildTags(input: {
  proceduralScore: number;
  officialScore: number;
  faqScore: number;
  guideScore: number;
  normativeScore: number;
  manualScore: number;
}) {
  const tags: string[] = [];

  if (input.proceduralScore > 0) tags.push('sei-rio');
  if (input.officialScore > 0) tags.push('fonte-oficial');
  if (input.manualScore > 0) tags.push('manual');
  if (input.guideScore > 0) tags.push('guia');
  if (input.normativeScore > 0) tags.push('norma');
  if (input.faqScore > 0) tags.push('faq');

  return tags;
}

export function classifyKnowledgeDocument(fileName: string, text: string): KnowledgeDocumentClassification {
  const corpus = `${fileName}\n${text.slice(0, 8000)}`;
  const technicalScore = countMatches(TECHNICAL_PATTERNS, corpus);
  const proceduralScore = countMatches(PROCEDURAL_PATTERNS, corpus);
  const officialScore = countMatches(OFFICIAL_PATTERNS, corpus);
  const faqScore = countMatches(FAQ_PATTERNS, corpus);
  const guideScore = countMatches(GUIDE_PATTERNS, corpus);
  const normativeScore = countMatches(NORMATIVE_PATTERNS, corpus);
  const manualScore = countMatches(MANUAL_PATTERNS, corpus);
  const tags = buildTags({
    proceduralScore,
    officialScore,
    faqScore,
    guideScore,
    normativeScore,
    manualScore,
  });

  if (technicalScore >= 3 && technicalScore > proceduralScore) {
    return {
      topicScope: 'clara_internal',
      documentKind: 'internal_technical',
      authorityLevel: 'internal',
      shouldIndex: false,
      warning: 'Este arquivo parece descrever backend, RAG, APIs ou infraestrutura da CLARA. Ele sera salvo como material interno e ficara fora da busca do chat.',
      technicalScore,
      proceduralScore,
      officialScore,
      faqScore,
      guideScore,
      normativeScore,
      manualScore,
      searchWeight: 0,
      tags: ['interno-tecnico'],
      excludedFromChatReason: 'internal_technical',
    };
  }

  if (normativeScore > 0 && proceduralScore > 0) {
    return {
      topicScope: 'sei_rio_norma',
      documentKind: 'norma',
      authorityLevel: officialScore > 0 ? 'official' : 'institutional',
      shouldIndex: true,
      warning: null,
      technicalScore,
      proceduralScore,
      officialScore,
      faqScore,
      guideScore,
      normativeScore,
      manualScore,
      searchWeight: officialScore > 0 ? 1.35 : 1.2,
      tags,
      excludedFromChatReason: null,
    };
  }

  if (manualScore > 0 && proceduralScore > 0) {
    return {
      topicScope: 'sei_rio_manual',
      documentKind: 'manual',
      authorityLevel: officialScore > 0 ? 'official' : 'institutional',
      shouldIndex: true,
      warning: null,
      technicalScore,
      proceduralScore,
      officialScore,
      faqScore,
      guideScore,
      normativeScore,
      manualScore,
      searchWeight: officialScore > 0 ? 1.3 : 1.15,
      tags,
      excludedFromChatReason: null,
    };
  }

  if (guideScore > 0 && proceduralScore > 0) {
    return {
      topicScope: 'sei_rio_guia',
      documentKind: 'guia',
      authorityLevel: officialScore > 0 ? 'official' : 'institutional',
      shouldIndex: true,
      warning: null,
      technicalScore,
      proceduralScore,
      officialScore,
      faqScore,
      guideScore,
      normativeScore,
      manualScore,
      searchWeight: officialScore > 0 ? 1.18 : 1.05,
      tags,
      excludedFromChatReason: null,
    };
  }

  if (faqScore > 0 && proceduralScore > 0) {
    return {
      topicScope: 'sei_rio_faq',
      documentKind: 'faq',
      authorityLevel: officialScore > 0 ? 'official' : 'institutional',
      shouldIndex: true,
      warning: null,
      technicalScore,
      proceduralScore,
      officialScore,
      faqScore,
      guideScore,
      normativeScore,
      manualScore,
      searchWeight: 0.92,
      tags,
      excludedFromChatReason: null,
    };
  }

  if (proceduralScore >= 2) {
    return {
      topicScope: 'rotina_administrativa',
      documentKind: 'administrativo',
      authorityLevel: officialScore > 0 ? 'institutional' : 'supporting',
      shouldIndex: true,
      warning: null,
      technicalScore,
      proceduralScore,
      officialScore,
      faqScore,
      guideScore,
      normativeScore,
      manualScore,
      searchWeight: 0.95,
      tags,
      excludedFromChatReason: null,
    };
  }

  return {
    topicScope: 'material_apoio',
    documentKind: 'apoio',
    authorityLevel: officialScore > 0 ? 'institutional' : 'supporting',
    shouldIndex: true,
    warning: null,
    technicalScore,
    proceduralScore,
    officialScore,
    faqScore,
    guideScore,
    normativeScore,
    manualScore,
    searchWeight: 0.8,
    tags,
    excludedFromChatReason: null,
  };
}

export function recommendKnowledgeGovernance(
  classification: KnowledgeDocumentClassification,
): KnowledgeGovernanceRecommendation {
  if (!classification.shouldIndex || classification.topicScope === 'clara_internal') {
    return {
      corpusCategory: 'interno_excluido',
      ingestionPriority: 'baixa',
      rationale: 'Material tecnico ou interno da CLARA: manter fora do chat e apenas como registro operacional.',
    };
  }

  if (
    classification.documentKind === 'norma' ||
    (classification.documentKind === 'manual' && classification.authorityLevel === 'official')
  ) {
    return {
      corpusCategory: 'nucleo_oficial',
      ingestionPriority: 'alta',
      rationale: 'Documento nuclear do corpus inicial: deve entrar antes dos materiais complementares.',
    };
  }

  if (
    classification.documentKind === 'guia' ||
    classification.documentKind === 'faq' ||
    classification.documentKind === 'administrativo'
  ) {
    return {
      corpusCategory: 'cobertura_operacional',
      ingestionPriority: classification.documentKind === 'guia' ? 'alta' : 'media',
      rationale: 'Documento util para ampliar cobertura operacional depois do nucleo oficial.',
    };
  }

  return {
    corpusCategory: 'apoio_complementar',
    ingestionPriority: 'baixa',
    rationale: 'Material complementar: usar apenas para fechar lacunas reais do corpus principal.',
  };
}
