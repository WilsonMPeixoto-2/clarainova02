export type ChatResponseMode = "direto" | "didatico";
export type ChatIntentLabel =
  | "como_fazer"
  | "onde_encontrar"
  | "erro_sistema"
  | "conceito"
  | "rotina_operacional"
  | "indefinido";

export type StructuredResponseQualityIssue =
  | "summary_too_brief"
  | "didactic_summary_needs_more_context"
  | "didactic_steps_too_shallow"
  | "didactic_missing_final_checks"
  | "conceptual_answer_overfragmented"
  | "conceptual_answer_should_be_explanatory"
  | "direct_steps_too_shallow"
  | "truncated_visible_copy"
  | "generic_editorial_copy";

export interface StructuredResponseQualityAssessment {
  needsRepair: boolean;
  score: number;
  issues: StructuredResponseQualityIssue[];
}

type QualityAssessmentResponse = {
  tituloCurto: string;
  resumoInicial: string;
  modoResposta: string;
  etapas: Array<{ conteudo: string; titulo: string }>;
  observacoesFinais: string[];
  analiseDaResposta: {
    clarificationRequested?: boolean;
    answerScopeMatch?: string | null;
  };
};

function countSentences(value: string) {
  return value
    .split(/[.!?]+(?:\s+|$)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .length;
}

function endsWithTruncation(value: string) {
  return /(?:\.\.\.|…)\s*$/.test(value.trim());
}

const GENERIC_EDITORIAL_PATTERNS = [
  /\bresposta documental\b/i,
  /\bleitura guiada\b/i,
  /\bsintese documental\b/i,
  /\borganizei a resposta\b/i,
  /\bpontos mais uteis dos trechos\b/i,
  /\bmantive a resposta\b/i,
];

function hasGenericEditorialCopy(values: string[]) {
  const visibleCopy = values.join(" ");
  return GENERIC_EDITORIAL_PATTERNS.some((pattern) => pattern.test(visibleCopy));
}

export function assessStructuredResponseQuality(
  response: QualityAssessmentResponse,
  options: {
    responseMode: ChatResponseMode;
    intentLabel: ChatIntentLabel;
  },
): StructuredResponseQualityAssessment {
  const issues = new Set<StructuredResponseQualityIssue>();
  const analysis = response.analiseDaResposta;
  const isConceptual = options.intentLabel === "conceito";
  const skipStrictGate =
    Boolean(analysis.clarificationRequested) ||
    analysis.answerScopeMatch === "insufficient" ||
    response.modoResposta === "insuficiente";

  const summarySentences = countSentences(response.resumoInicial);
  const stepSentenceCounts = response.etapas.map((step) => countSentences(step.conteudo));
  const stepLengths = response.etapas.map((step) => step.conteudo.trim().length);
  const shallowDidacticSteps = response.etapas.filter((step) =>
    countSentences(step.conteudo) < 2 || step.conteudo.trim().length < 140
  );
  const shallowDirectSteps = response.etapas.filter((step) =>
    countSentences(step.conteudo) < 1 || step.conteudo.trim().length < 90
  );
  const truncatedCopyDetected = [
    response.resumoInicial,
    ...response.etapas.map((step) => step.conteudo),
    ...response.observacoesFinais,
  ].some(endsWithTruncation);

  if (!skipStrictGate) {
    if (summarySentences < 2 || response.resumoInicial.trim().length < 110) {
      issues.add("summary_too_brief");
    }

    if (options.responseMode === "didatico") {
      if (summarySentences < 3 || response.resumoInicial.trim().length < 170) {
        issues.add("didactic_summary_needs_more_context");
      }

      if (!isConceptual && response.modoResposta === "passo_a_passo") {
        if (response.etapas.length < 2 || shallowDidacticSteps.length > 0) {
          issues.add("didactic_steps_too_shallow");
        }

        if (response.observacoesFinais.length < 1) {
          issues.add("didactic_missing_final_checks");
        }
      }

      if (isConceptual && response.modoResposta === "passo_a_passo") {
        if (response.etapas.length > 1) {
          issues.add("conceptual_answer_overfragmented");
        }

        if (response.etapas.length >= 1) {
          issues.add("conceptual_answer_should_be_explanatory");
        }
      }
    } else if (response.modoResposta === "checklist") {
      if (response.etapas.length > 0 && shallowDirectSteps.length > 0) {
        issues.add("direct_steps_too_shallow");
      }
    }
  }

  if (truncatedCopyDetected) {
    issues.add("truncated_visible_copy");
  }

  if (
    hasGenericEditorialCopy([
      response.tituloCurto,
      response.resumoInicial,
      ...response.etapas.map((step) => `${step.titulo} ${step.conteudo}`),
      ...response.observacoesFinais,
    ])
  ) {
    issues.add("generic_editorial_copy");
  }

  const score =
    Math.max(0, 100
      - issues.size * 14
      - (options.responseMode === "didatico" ? shallowDidacticSteps.length * 6 : shallowDirectSteps.length * 4)
      - (truncatedCopyDetected ? 12 : 0)
      - (summarySentences <= 1 ? 8 : 0)
      - (stepSentenceCounts.some((value) => value === 0) ? 8 : 0)
      - (stepLengths.some((value) => value < 70) ? 4 : 0));

  return {
    needsRepair: issues.size > 0,
    score,
    issues: Array.from(issues),
  };
}
