import type { DocumentRescuePlan } from "./keyword-rescue.ts";

export interface RetrievalGovernanceFilters {
  topicScopes: string[];
  sourceNamePatterns: string[];
  documentNamePatterns: string[];
  versionPatterns: string[];
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

export function buildRetrievalGovernanceFilters(
  plan: DocumentRescuePlan | null | undefined,
): RetrievalGovernanceFilters | null {
  if (!plan) {
    return null;
  }

  const filters: RetrievalGovernanceFilters = {
    topicScopes: uniq(plan.topicScopes),
    sourceNamePatterns: uniq(plan.sourceNamePatterns),
    documentNamePatterns: uniq(plan.namePatterns),
    versionPatterns: uniq(plan.versionPatterns),
  };

  return hasRetrievalGovernanceFilters(filters) ? filters : null;
}

export function hasRetrievalGovernanceFilters(
  filters: RetrievalGovernanceFilters | null | undefined,
): boolean {
  return Boolean(
    filters &&
      (
        filters.topicScopes.length > 0 ||
        filters.sourceNamePatterns.length > 0 ||
        filters.documentNamePatterns.length > 0 ||
        filters.versionPatterns.length > 0
      ),
  );
}

export function buildDocumentRescueOrFilter(
  plan: DocumentRescuePlan | null | undefined,
): string | null {
  const filters = buildRetrievalGovernanceFilters(plan);
  if (!hasRetrievalGovernanceFilters(filters)) {
    return null;
  }

  return [
    ...filters.topicScopes.map((scope) => `topic_scope.eq.${scope}`),
    ...filters.sourceNamePatterns.map((pattern) => `source_name.ilike.${pattern}`),
    ...filters.documentNamePatterns.map((pattern) => `name.ilike.${pattern}`),
    ...filters.versionPatterns.map((pattern) => `version_label.ilike.${pattern}`),
  ].join(",");
}

export function buildGovernedSearchMode(
  baseMode: "hybrid" | "keyword_only",
  filters: RetrievalGovernanceFilters | null | undefined,
): "hybrid" | "keyword_only" | "hybrid_governed" | "keyword_only_governed" {
  if (!hasRetrievalGovernanceFilters(filters)) {
    return baseMode;
  }

  return baseMode === "hybrid" ? "hybrid_governed" : "keyword_only_governed";
}
