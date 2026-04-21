import { describe, expect, it } from "vitest";

import { matchEmergencyGroundedPlaybook } from "../../supabase/functions/chat/emergency-playbooks";

describe("emergency grounded playbooks", () => {
  it("does not capture conceptual bloco de assinatura questions", () => {
    const matched = matchEmergencyGroundedPlaybook(
      "O que e um bloco de assinatura no SEI.Rio e quando eu devo usar?",
      ["Manual do Usuario - Blocos de Assinatura"],
    );

    expect(matched).toBeNull();
  });

  it("keeps the bloco de assinatura fallback for operational inclusion questions", () => {
    const matched = matchEmergencyGroundedPlaybook(
      "Como incluir um documento em bloco de assinatura no SEI.Rio?",
      ["Manual do Usuario - Blocos de Assinatura"],
    );

    expect(matched?.id).toBe("q5-bloco-assinatura");
  });
});
