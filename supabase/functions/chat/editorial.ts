export type EditorialLayer = "nucleo" | "cobertura" | "apoio" | "interno" | null;

export interface EditorialReferenceMetadata {
  sectionTitle?: string | null;
  documentAuthorityLevel?: string | null;
  documentTopicScope?: string | null;
}

export interface EditorialProfile {
  layers: EditorialLayer[];
  hasNucleus: boolean;
  hasCoverage: boolean;
  hasSupport: boolean;
  hasInternal: boolean;
}

const NUCLEUS_TOPIC_SCOPES = new Set([
  "sei_rio_norma",
  "sei_rio_manual",
  "sei_rio_guia",
  "sei_rio_faq",
  "sei_rio_termo",
]);

const COVERAGE_TOPIC_SCOPES = new Set([
  "pen_manual_compativel",
  "pen_compatibilidade",
  "pen_release_note",
  "rotina_administrativa",
]);

const SUPPORT_TOPIC_SCOPES = new Set([
  "interface_update",
  "material_apoio",
]);

function uniqueLabels(values: Array<string | null | undefined>) {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    labels.push(normalized);
  }

  return labels;
}

export function inferEditorialLayer(topicScope?: string | null): EditorialLayer {
  if (!topicScope) return null;
  if (NUCLEUS_TOPIC_SCOPES.has(topicScope)) return "nucleo";
  if (COVERAGE_TOPIC_SCOPES.has(topicScope)) return "cobertura";
  if (SUPPORT_TOPIC_SCOPES.has(topicScope)) return "apoio";
  if (topicScope === "clara_internal") return "interno";
  return null;
}

export function getEditorialLayerLabel(layer: EditorialLayer) {
  switch (layer) {
    case "nucleo":
      return "camada núcleo";
    case "cobertura":
      return "camada cobertura";
    case "apoio":
      return "apoio complementar";
    case "interno":
      return "uso interno";
    default:
      return null;
  }
}

export function getAuthorityLabel(authorityLevel?: string | null) {
  switch (authorityLevel) {
    case "official":
      return "fonte oficial";
    case "institutional":
      return "fonte institucional";
    case "supporting":
      return "apoio complementar";
    case "internal":
      return "uso interno";
    default:
      return null;
  }
}

export function buildEditorialSubtitle(metadata: EditorialReferenceMetadata) {
  const layer = inferEditorialLayer(metadata.documentTopicScope);
  const labels = uniqueLabels([
    metadata.sectionTitle,
    getEditorialLayerLabel(layer),
    getAuthorityLabel(metadata.documentAuthorityLevel),
  ]);

  return labels.length > 0 ? labels.join(" · ") : null;
}

export function summarizeEditorialProfile(
  references: EditorialReferenceMetadata[],
): EditorialProfile {
  const layers = Array.from(new Set(references.map((reference) =>
    inferEditorialLayer(reference.documentTopicScope)
  ).filter((layer): layer is Exclude<EditorialLayer, null> => layer !== null)));

  return {
    layers,
    hasNucleus: layers.includes("nucleo"),
    hasCoverage: layers.includes("cobertura"),
    hasSupport: layers.includes("apoio"),
    hasInternal: layers.includes("interno"),
  };
}

export function buildEditorialNotices(
  profile: EditorialProfile | null,
  existing: {
    userNotice?: string | null;
    cautionNotice?: string | null;
  } = {},
) {
  if (!profile) {
    return {
      userNotice: existing.userNotice ?? null,
      cautionNotice: existing.cautionNotice ?? null,
    };
  }

  let userNotice = existing.userNotice ?? null;
  let cautionNotice = existing.cautionNotice ?? null;

  if (!userNotice && profile.hasNucleus && (profile.hasCoverage || profile.hasSupport || profile.hasInternal)) {
    userNotice = "Esta resposta prioriza fontes do núcleo documental e usa cobertura ou apoio apenas como complemento.";
  }

  if (!cautionNotice) {
    if (!profile.hasNucleus && profile.hasCoverage) {
      cautionNotice =
        "A resposta foi sustentada principalmente por material de cobertura complementar; valide na norma, guia ou manual principal se o caso exigir decisão formal.";
    } else if (!profile.hasNucleus && profile.hasSupport) {
      cautionNotice =
        "A resposta foi sustentada por material de apoio complementar; valide com a norma, guia ou manual principal se a decisão for sensível.";
    } else if (!profile.hasNucleus && profile.hasInternal) {
      cautionNotice =
        "A resposta recorreu a material de uso interno; confirme na documentação oficial antes de tomar uma decisão sensível.";
    }
  }

  return { userNotice, cautionNotice };
}
