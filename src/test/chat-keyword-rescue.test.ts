import { describe, expect, it } from "vitest";

import {
  buildDocumentRescuePlan,
  buildKeywordSearchCandidates,
} from "../../supabase/functions/chat/keyword-rescue";

describe("chat keyword rescue", () => {
  it("builds targeted rescue hints for official note questions with versions", () => {
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

    expect(plan).not.toBeNull();
    expect(plan?.topicScopes).toContain("pen_release_note");
    expect(plan?.sourceNamePatterns).toContain("%MGI%");
    expect(plan?.versionPatterns).toContain("%5.0.3%");
  });

  it("builds decree and migration hints for transition questions", () => {
    const plan = buildDocumentRescuePlan(
      "Durante a transição, o servidor pode continuar usando o Processo.rio ao mesmo tempo que o SEI.Rio?",
      null,
    );

    expect(plan?.namePatterns).toEqual(
      expect.arrayContaining(["%Guia de migracao%", "%55.615%", "%57.250%"]),
    );
    expect(plan?.topicScopes).toEqual(
      expect.arrayContaining(["sei_rio_guia", "sei_rio_norma"]),
    );
  });

  it("builds external-user document hints for credential and password questions", () => {
    const plan = buildDocumentRescuePlan(
      "Qual nível da conta gov.br permite liberação automática do cadastro no SEI.Rio para usuário externo?",
      null,
    );

    expect(plan?.namePatterns).toEqual(
      expect.arrayContaining(["%Guia do usuario externo%", "%Perguntas frequentes do cidadao%"]),
    );
    expect(plan?.topicScopes).toEqual(
      expect.arrayContaining(["sei_rio_guia", "sei_rio_faq"]),
    );
  });

  it("deduplicates keyword search candidates", () => {
    expect(buildKeywordSearchCandidates("como entrar no SEI", "como entrar no SEI")).toEqual([
      "como entrar no SEI",
    ]);
  });
});
