import { z } from "npm:zod@4.3.6";
import type { KnowledgeReference } from "./knowledge.ts";

export const claraReferenceSchema = z.object({
  id: z.number().int().positive(),
  tipo: z.enum(["manual", "norma", "pagina_web", "pdf", "guia", "outro"]),
  autorEntidade: z.string().min(1),
  titulo: z.string().min(1),
  subtitulo: z.string().nullable().optional(),
  local: z.string().nullable().optional(),
  editoraOuOrgao: z.string().nullable().optional(),
  ano: z.string().nullable().optional(),
  paginas: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  dataAcesso: z.string().nullable().optional(),
});

export const claraHighlightSchema = z.object({
  texto: z.string().min(1),
  tipo: z.enum(["conceito", "botao", "icone", "atencao", "norma", "prazo", "menu", "acao"]),
});

export const claraProcessStateSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  status: z.enum(["informativo", "concluido", "cautela", "web"]),
});

export const claraStepSchema = z.object({
  numero: z.number().int().positive(),
  titulo: z.string().min(1),
  conteudo: z.string().min(1),
  itens: z.array(z.string()).default([]),
  destaques: z.array(z.string()).default([]),
  alerta: z.string().nullable().optional(),
  citacoes: z.array(z.number().int().positive()).default([]),
});

const DEFAULT_RESPONSE_ANALYSIS = {
  questionUnderstandingConfidence: null,
  finalConfidence: null,
  answerScopeMatch: "exact" as const,
  ambiguityInUserQuestion: false,
  ambiguityInSources: false,
  clarificationRequested: false,
  clarificationQuestion: null,
  clarificationReason: null,
  internalExpansionPerformed: false,
  webFallbackUsed: false,
  userNotice: null,
  cautionNotice: null,
  ambiguityReason: null,
  comparedSources: [],
  prioritizedSources: [],
  processStates: [],
};

export const claraResponseAnalysisSchema = z.object({
  questionUnderstandingConfidence: z.number().min(0).max(1).nullable().default(null),
  finalConfidence: z.number().min(0).max(1).nullable().default(null),
  answerScopeMatch: z.enum(["exact", "probable", "weak", "insufficient"]).default("exact"),
  ambiguityInUserQuestion: z.boolean().default(false),
  ambiguityInSources: z.boolean().default(false),
  clarificationRequested: z.boolean().default(false),
  clarificationQuestion: z.string().nullable().default(null),
  clarificationReason: z.string().nullable().default(null),
  internalExpansionPerformed: z.boolean().default(false),
  webFallbackUsed: z.boolean().default(false),
  userNotice: z.string().nullable().default(null),
  cautionNotice: z.string().nullable().default(null),
  ambiguityReason: z.string().nullable().default(null),
  comparedSources: z.array(z.string()).default([]),
  prioritizedSources: z.array(z.string()).default([]),
  processStates: z.array(claraProcessStateSchema).default([]),
});

export const claraStructuredResponseSchema = z.object({
  tituloCurto: z.string().min(1),
  resumoInicial: z.string().min(1),
  resumoCitacoes: z.array(z.number().int().positive()).default([]),
  modoResposta: z.enum(["passo_a_passo", "explicacao", "checklist", "combinado"]),
  etapas: z.array(claraStepSchema).default([]),
  observacoesFinais: z.array(z.string()).default([]),
  termosDestacados: z.array(claraHighlightSchema).default([]),
  referenciasFinais: z.array(claraReferenceSchema).default([]),
  analiseDaResposta: claraResponseAnalysisSchema.default(DEFAULT_RESPONSE_ANALYSIS),
});

export type ClaraStructuredResponse = z.infer<typeof claraStructuredResponseSchema>;
type ChatResponseMode = "direto" | "didatico";

export const claraResponseJsonSchema = {
  type: "object",
  properties: {
    tituloCurto: { type: "string" },
    resumoInicial: { type: "string" },
    resumoCitacoes: {
      type: "array",
      items: { type: "integer" },
    },
    modoResposta: {
      type: "string",
      enum: ["passo_a_passo", "explicacao", "checklist", "combinado"],
    },
    etapas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          numero: { type: "integer" },
          titulo: { type: "string" },
          conteudo: { type: "string" },
          itens: {
            type: "array",
            items: { type: "string" },
          },
          destaques: {
            type: "array",
            items: { type: "string" },
          },
          alerta: { type: ["string", "null"] },
          citacoes: {
            type: "array",
            items: { type: "integer" },
          },
        },
        required: ["numero", "titulo", "conteudo", "itens", "destaques", "citacoes"],
      },
    },
    observacoesFinais: {
      type: "array",
      items: { type: "string" },
    },
    termosDestacados: {
      type: "array",
      items: {
        type: "object",
        properties: {
          texto: { type: "string" },
          tipo: {
            type: "string",
            enum: ["conceito", "botao", "icone", "atencao", "norma", "prazo", "menu", "acao"],
          },
        },
        required: ["texto", "tipo"],
      },
    },
    referenciasFinais: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tipo: {
            type: "string",
            enum: ["manual", "norma", "pagina_web", "pdf", "guia", "outro"],
          },
          autorEntidade: { type: "string" },
          titulo: { type: "string" },
          subtitulo: { type: ["string", "null"] },
          local: { type: ["string", "null"] },
          editoraOuOrgao: { type: ["string", "null"] },
          ano: { type: ["string", "null"] },
          paginas: { type: ["string", "null"] },
          url: { type: ["string", "null"] },
          dataAcesso: { type: ["string", "null"] },
        },
        required: ["id", "tipo", "autorEntidade", "titulo"],
      },
    },
    analiseDaResposta: {
      type: "object",
      properties: {
        questionUnderstandingConfidence: {
          type: ["number", "null"],
          description: "De 0 a 1, quao bem voce entendeu a pergunta do usuario.",
        },
        finalConfidence: {
          type: ["number", "null"],
          description: "De 0 a 1, quao confiante voce esta na resposta final, considerando a base documental disponivel.",
        },
        answerScopeMatch: {
          type: "string",
          enum: ["exact", "probable", "weak", "insufficient"],
        },
        ambiguityInUserQuestion: { type: "boolean" },
        ambiguityInSources: { type: "boolean" },
        clarificationRequested: { type: "boolean" },
        clarificationQuestion: { type: ["string", "null"] },
        clarificationReason: { type: ["string", "null"] },
        userNotice: { type: ["string", "null"] },
        cautionNotice: { type: ["string", "null"] },
      },
      required: [
        "answerScopeMatch",
        "clarificationRequested",
        "finalConfidence",
      ],
    },
  },
  required: [
    "tituloCurto",
    "resumoInicial",
    "modoResposta",
    "etapas",
    "observacoesFinais",
    "termosDestacados",
    "referenciasFinais",
    "analiseDaResposta",
  ],
} as const;

function buildConfidenceLabel(value: number | null) {
  if (value == null) return null;
  if (value >= 0.86) return "confianca alta";
  if (value >= 0.66) return "confianca boa";
  if (value >= 0.45) return "confianca moderada";
  return "confianca reduzida";
}

function takeFirstSentence(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? trimmed).trim();
}

function renumberSteps(steps: ClaraStructuredResponse["etapas"]) {
  return steps.map((step, index) => ({
    ...step,
    numero: index + 1,
  }));
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function dedupeStrings(values: string[], limit: number) {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const normalized = normalizeComparableText(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    next.push(value);
    if (next.length >= limit) {
      break;
    }
  }

  return next;
}

function adaptStructuredResponseForMode(
  response: ClaraStructuredResponse,
  responseMode: ChatResponseMode,
): ClaraStructuredResponse {
  if (responseMode === "didatico") {
    return {
      ...response,
      modoResposta: response.etapas.length > 0 ? "passo_a_passo" : "explicacao",
      etapas: renumberSteps(
        response.etapas.slice(0, 5).map((step) => ({
          ...step,
          itens: dedupeStrings(step.itens, 4),
          destaques: dedupeStrings(step.destaques, 3),
        })),
      ),
      observacoesFinais: dedupeStrings(response.observacoesFinais, 3),
      analiseDaResposta: {
        ...response.analiseDaResposta,
        processStates: response.analiseDaResposta.processStates.slice(0, 4),
      },
    };
  }

  const conciseProcessStates = response.analiseDaResposta.processStates
    .filter((state) => state.status !== "concluido")
    .slice(0, 2);

  return {
    ...response,
    resumoInicial: takeFirstSentence(response.resumoInicial),
    modoResposta: response.etapas.length > 0 ? "checklist" : "explicacao",
    etapas: renumberSteps(
      response.etapas.slice(0, 3).map((step) => ({
        ...step,
        conteudo: takeFirstSentence(step.conteudo),
        itens: dedupeStrings(step.itens, 2),
        destaques: dedupeStrings(step.destaques, 2),
        alerta: step.alerta ? takeFirstSentence(step.alerta) : step.alerta,
      })),
    ),
    observacoesFinais: dedupeStrings(response.observacoesFinais.map(takeFirstSentence), 1),
    termosDestacados: response.termosDestacados
      .filter((highlight, index, all) => {
        const normalized = normalizeComparableText(highlight.texto);
        return all.findIndex((candidate) => normalizeComparableText(candidate.texto) === normalized) === index;
      })
      .slice(0, 4),
    analiseDaResposta: {
      ...response.analiseDaResposta,
      userNotice: null,
      clarificationReason: response.analiseDaResposta.clarificationReason
        ? takeFirstSentence(response.analiseDaResposta.clarificationReason)
        : null,
      cautionNotice: response.analiseDaResposta.cautionNotice
        ? takeFirstSentence(response.analiseDaResposta.cautionNotice)
        : null,
      processStates: conciseProcessStates,
    },
  };
}

export function formatReferenceAbnt(reference: ClaraStructuredResponse["referenciasFinais"][number]) {
  const parts: string[] = [];

  parts.push(`${reference.autorEntidade}.`);
  parts.push(reference.subtitulo ? `${reference.titulo}: ${reference.subtitulo}.` : `${reference.titulo}.`);

  const placeAndPublisher = [reference.local, reference.editoraOuOrgao].filter(Boolean).join(": ");
  if (placeAndPublisher && reference.ano) {
    parts.push(`${placeAndPublisher}, ${reference.ano}.`);
  } else if (placeAndPublisher) {
    parts.push(`${placeAndPublisher}.`);
  } else if (reference.ano) {
    parts.push(`${reference.ano}.`);
  }

  if (reference.paginas) parts.push(`p. ${reference.paginas}.`);
  if (reference.url) parts.push(`Disponivel em: ${reference.url}.`);
  if (reference.dataAcesso) parts.push(`Acesso em: ${reference.dataAcesso}.`);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function renderStructuredResponseToPlainText(response: ClaraStructuredResponse) {
  const lines: string[] = [response.tituloCurto, "", response.resumoInicial];
  const analysis = response.analiseDaResposta;

  if (analysis.clarificationRequested && analysis.clarificationQuestion) {
    lines.push("", "Antes de seguir");
    if (analysis.clarificationReason) {
      lines.push(analysis.clarificationReason);
    }
    lines.push(analysis.clarificationQuestion);
  }

  if (response.etapas.length > 0) {
    lines.push("", "Passo a passo");
    for (const step of response.etapas) {
      lines.push(`${step.numero}. ${step.titulo}`);
      lines.push(step.conteudo);
      for (const item of step.itens) {
        lines.push(`- ${item}`);
      }
      if (step.alerta) {
        lines.push(`Observacao: ${step.alerta}`);
      }
      lines.push("");
    }
  }

  if (response.observacoesFinais.length > 0) {
    lines.push("Observacoes finais");
    for (const observation of response.observacoesFinais) {
      lines.push(`- ${observation}`);
    }
    lines.push("");
  }

  if (response.referenciasFinais.length > 0) {
    lines.push("Referencias");
    for (const reference of response.referenciasFinais) {
      lines.push(`[${reference.id}] ${formatReferenceAbnt(reference)}`);
    }
  }

  return lines.join("\n").trim();
}

export function parseStructuredResponsePayload(value: unknown): ClaraStructuredResponse | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    const result = claraStructuredResponseSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

const INTERNAL_PROCESS_LEAK_PATTERNS = [
  /\bbase interna\b/i,
  /\banalise interna\b/i,
  /\bcomparei\b/i,
  /\bcomparando\b/i,
  /\brag\b/i,
  /\bbackend\b/i,
  /\bembedding/i,
  /\bsupabase\b/i,
  /\btelemetri/i,
  /\bweb fallback\b/i,
  /\bprompt\b/i,
  /\bschema\b/i,
  /\bjson\b/i,
  /\bvetor(es|ial)?\b/i,
  /\bchunk(s)?\b/i,
  /\bedge function/i,
  /\bapi key\b/i,
  /\bgemini\b/i,
  /\bmodelo de linguagem\b/i,
  /\bllm\b/i,
  /\bconsulta (na|a) base\b/i,
  /\bbusca sem[aâ]ntica\b/i,
];

const LEAK_REPLACEMENT_PATTERNS: Array<[RegExp, string]> = [
  [/\b(com base|baseado) (na|em) minha (base|analise) interna\b/gi, "com base nas orientações disponíveis"],
  [/\b(consultei|analisei|comparei) (a|as|os?) (base|fontes?|documentos?) (interna|internas?)\b/gi, "conforme as orientações disponíveis"],
  [/\butilizando (o )?RAG\b/gi, ""],
  [/\b(embedding|embeddings|vetor semântico)\b/gi, ""],
  [/\b(busca|pesquisa) sem[aâ]ntica\b/gi, "pesquisa na base documental"],
];

function sanitizeText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of LEAK_REPLACEMENT_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function inferReferenceType(documentName: string): ClaraStructuredResponse["referenciasFinais"][number]["tipo"] {
  const normalized = documentName.toLowerCase();
  if (normalized.includes("manual")) return "manual";
  if (normalized.includes("guia")) return "guia";
  if (normalized.endsWith(".pdf")) return "pdf";
  return "outro";
}

function inferReferenceTypeFromMetadata(reference: KnowledgeReference): ClaraStructuredResponse["referenciasFinais"][number]["tipo"] {
  if (reference.documentKind === "manual") return "manual";
  if (reference.documentKind === "guia") return "guia";
  if (reference.documentKind === "norma") return "norma";
  return inferReferenceType(reference.documentName);
}

function filterCitationIds(values: number[], validIds: Set<number>) {
  return Array.from(new Set(values.filter((value) => validIds.has(value))));
}

export function buildGroundedReferences(
  references: KnowledgeReference[],
): ClaraStructuredResponse["referenciasFinais"] {
  return references.map((reference) => ({
    id: reference.id,
    tipo: inferReferenceTypeFromMetadata(reference),
    autorEntidade: "Base documental CLARA",
    titulo: reference.documentName,
    subtitulo: reference.sectionTitle ?? null,
    local: null,
    editoraOuOrgao: null,
    ano: null,
    paginas: reference.pageLabel ?? null,
    url: null,
    dataAcesso: null,
  }));
}

export function sanitizeStructuredResponse(
  response: ClaraStructuredResponse,
  options: {
    groundedReferences: ClaraStructuredResponse["referenciasFinais"];
    usedRag: boolean;
    responseMode: ChatResponseMode;
  },
): ClaraStructuredResponse {
  const validIds = new Set(options.groundedReferences.map((reference) => reference.id));
  const sanitized = {
    ...response,
    tituloCurto: sanitizeText(response.tituloCurto),
    resumoInicial: sanitizeText(response.resumoInicial),
    resumoCitacoes: options.usedRag ? filterCitationIds(response.resumoCitacoes, validIds) : [],
    etapas: response.etapas.map((step) => ({
      ...step,
      titulo: sanitizeText(step.titulo),
      conteudo: sanitizeText(step.conteudo),
      itens: step.itens.map(sanitizeText),
      destaques: step.destaques.map(sanitizeText),
      alerta: step.alerta ? sanitizeText(step.alerta) : step.alerta,
      citacoes: options.usedRag ? filterCitationIds(step.citacoes, validIds) : [],
    })),
    observacoesFinais: response.observacoesFinais.map(sanitizeText),
    referenciasFinais: options.usedRag ? options.groundedReferences : [],
  };

  return adaptStructuredResponseForMode(sanitized, options.responseMode);
}

export function responseHasInternalProcessLeakage(response: ClaraStructuredResponse) {
  const texts = [
    response.tituloCurto,
    response.resumoInicial,
    ...response.etapas.flatMap((step) => [step.titulo, step.conteudo, ...step.itens, ...step.destaques, step.alerta ?? ""]),
    ...response.observacoesFinais,
  ];

  return texts.some((text) => INTERNAL_PROCESS_LEAK_PATTERNS.some((pattern) => pattern.test(text)));
}
