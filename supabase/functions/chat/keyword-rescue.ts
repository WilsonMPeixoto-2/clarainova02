import type { SourceTargetRoute } from "./knowledge.ts";

export interface DocumentRescuePlan {
  namePatterns: string[];
  sourceNamePatterns: string[];
  topicScopes: string[];
  versionPatterns: string[];
}

const VERSION_PATTERN = /\b\d+(?:\.\d+)+\b/g;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function uniq(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function extractVersionPatterns(question: string): string[] {
  const labels = question.match(VERSION_PATTERN) ?? [];
  return uniq(labels.flatMap((label) => [`%${label}%`, `%SEI ${label}%`]));
}

export function buildKeywordSearchCandidates(
  primaryQuery: string,
  expandedQuery: string | null,
): string[] {
  return uniq([
    primaryQuery,
    expandedQuery,
  ]);
}

export function buildDocumentRescuePlan(
  question: string,
  sourceTarget: SourceTargetRoute | null,
): DocumentRescuePlan | null {
  const normalizedQuestion = normalizeText(question);
  const namePatterns: string[] = [];
  const sourceNamePatterns = [...(sourceTarget?.sourceNamePatterns ?? [])];
  const topicScopes = [...(sourceTarget?.topicScopes ?? [])];
  const versionPatterns = sourceTarget?.versionConstraint
    ? uniq([`%${sourceTarget.versionConstraint}%`, `%SEI ${sourceTarget.versionConstraint}%`])
    : [];

  const decreeMatch = normalizedQuestion.match(/decreto rio[^0-9]*(\d{2}\.\d{3})/i);
  if (decreeMatch) {
    namePatterns.push(`%${decreeMatch[1]}%`);
    topicScopes.push("sei_rio_norma");
  }

  const resolutionMatch = normalizedQuestion.match(/resolucao cvl[^0-9]*(\d{1,4})/i);
  if (resolutionMatch) {
    namePatterns.push(`%${resolutionMatch[1]}%`);
    topicScopes.push("sei_rio_norma");
  }

  if (normalizedQuestion.includes("guia de migracao")) {
    namePatterns.push("%Guia de migracao%", "%Guia de migração%");
    topicScopes.push("sei_rio_guia");
  }

  if (
    normalizedQuestion.includes("transic") &&
    normalizedQuestion.includes("processo.rio")
  ) {
    namePatterns.push(
      "%Guia de migracao%",
      "%Guia de migração%",
      "%55.615%",
      "%57.250%",
    );
    topicScopes.push("sei_rio_guia", "sei_rio_norma");
  }

  if (
    normalizedQuestion.includes("usuario externo") &&
    (
      normalizedQuestion.includes("gov.br") ||
      normalizedQuestion.includes("senha") ||
      normalizedQuestion.includes("credenciamento") ||
      normalizedQuestion.includes("cadastro")
    )
  ) {
    namePatterns.push(
      "%Guia do usuario externo%",
      "%Guia do usuário externo%",
      "%Perguntas frequentes do cidadao%",
      "%Perguntas frequentes do cidadão%",
      "%Termo de Uso%",
      "%57.250%",
    );
    topicScopes.push("sei_rio_guia", "sei_rio_faq", "sei_rio_termo", "sei_rio_norma");
  }

  if (
    normalizedQuestion.includes("matricula") ||
    normalizedQuestion.includes("documento externo") ||
    normalizedQuestion.includes("bloco de assinatura") ||
    normalizedQuestion.includes("uma ou mais unidades")
  ) {
    namePatterns.push("%Guia do usuario interno%", "%Guia do usuário interno%");
    topicScopes.push("sei_rio_guia");
  }

  if (normalizedQuestion.includes("termo de uso")) {
    namePatterns.push("%Termo de Uso%");
    topicScopes.push("sei_rio_termo");
  }

  if (normalizedQuestion.includes("wiki")) {
    namePatterns.push("%Wiki%");
    topicScopes.push("interface_update");
  }

  if (normalizedQuestion.includes("ufscar")) {
    namePatterns.push("%UFSCar%", "%Ícones%", "%Icones%");
    topicScopes.push("interface_update");
  }

  if (normalizedQuestion.includes("nota oficial")) {
    namePatterns.push("%Nota oficial%");
    topicScopes.push("pen_release_note", "pen_compatibilidade");
  }

  if (normalizedQuestion.includes("manual do usuario sei 4.0+") || normalizedQuestion.includes("manual pen")) {
    namePatterns.push("%Manual do Usuário SEI 4.0+%", "%Manual do Usuario SEI 4.0+%");
    topicScopes.push("pen_manual_compativel");
  }

  versionPatterns.push(...extractVersionPatterns(question));

  const plan = {
    namePatterns: uniq(namePatterns),
    sourceNamePatterns: uniq(sourceNamePatterns),
    topicScopes: uniq(topicScopes),
    versionPatterns: uniq(versionPatterns),
  };

  return plan.namePatterns.length > 0 ||
      plan.sourceNamePatterns.length > 0 ||
      plan.topicScopes.length > 0 ||
      plan.versionPatterns.length > 0
    ? plan
    : null;
}
