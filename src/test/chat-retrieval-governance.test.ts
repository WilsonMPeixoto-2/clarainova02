import { describe, expect, it } from "vitest";

import { buildDocumentRescuePlan } from "../../supabase/functions/chat/keyword-rescue";
import {
  buildDocumentRescueOrFilter,
  buildGovernedSearchMode,
  buildRetrievalGovernanceFilters,
} from "../../supabase/functions/chat/retrieval-governance";

describe("chat retrieval governance", () => {
  it("maps rescue hints into governed search filters", () => {
    const plan = buildDocumentRescuePlan(
      "Durante a transição, o servidor pode continuar usando o Processo.rio ao mesmo tempo que o SEI.Rio?",
      null,
    );

    const filters = buildRetrievalGovernanceFilters(plan);

    expect(filters).toEqual({
      topicScopes: expect.arrayContaining(["sei_rio_guia", "sei_rio_norma"]),
      sourceNamePatterns: [],
      documentNamePatterns: expect.arrayContaining(["%Guia de migracao%", "%55.615%", "%57.250%"]),
      versionPatterns: [],
    });
  });

  it("builds an OR filter for target-document resolution", () => {
    const plan = buildDocumentRescuePlan(
      "Qual é o termo de uso do SEI.Rio para usuário externo?",
      null,
    );

    expect(buildDocumentRescueOrFilter(plan)).toBe(
      "topic_scope.eq.sei_rio_termo,name.ilike.%Termo de Uso%",
    );
  });

  it("switches search mode label when governed filters are active", () => {
    const plan = buildDocumentRescuePlan(
      "Segundo a nota oficial do SEI 5.0.3, quais módulos do PEN foram informados como compatíveis?",
      {
        label: "nota_oficial_sei_5.0.3",
        versionConstraint: "5.0.3",
        topicScopes: ["pen_release_note", "pen_compatibilidade"],
        sourceNamePatterns: ["%Ministério da Gestão%", "%MGI%"],
        matches: () => true,
      },
    );

    const filters = buildRetrievalGovernanceFilters(plan);

    expect(buildGovernedSearchMode("hybrid", filters)).toBe("hybrid_governed");
    expect(buildGovernedSearchMode("keyword_only", filters)).toBe("keyword_only_governed");
  });
});
