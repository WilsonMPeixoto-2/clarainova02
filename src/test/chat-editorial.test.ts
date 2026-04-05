import { describe, expect, it } from "vitest";

import {
  buildEditorialNotices,
  buildEditorialSubtitle,
  summarizeEditorialProfile,
} from "../../supabase/functions/chat/editorial";

describe("chat editorial helpers", () => {
  it("builds grounded reference subtitles with editorial transparency", () => {
    expect(buildEditorialSubtitle({
      sectionTitle: "Bloco de assinatura",
      documentAuthorityLevel: "official",
      documentTopicScope: "sei_rio_manual",
    })).toBe("Bloco de assinatura · camada núcleo · fonte oficial");
  });

  it("dedupes overlapping support labels in the subtitle", () => {
    expect(buildEditorialSubtitle({
      sectionTitle: "Atalhos visuais",
      documentAuthorityLevel: "supporting",
      documentTopicScope: "interface_update",
    })).toBe("Atalhos visuais · apoio complementar");
  });

  it("flags mixed nucleus and support references for user-facing notice", () => {
    const profile = summarizeEditorialProfile([
      { documentTopicScope: "sei_rio_guia", documentAuthorityLevel: "official" },
      { documentTopicScope: "material_apoio", documentAuthorityLevel: "supporting" },
    ]);

    const notices = buildEditorialNotices(profile);

    expect(notices.userNotice).toContain("prioriza fontes do núcleo documental");
    expect(notices.cautionNotice).toBeNull();
  });

  it("warns when the answer is sustained only by support material", () => {
    const profile = summarizeEditorialProfile([
      { documentTopicScope: "interface_update", documentAuthorityLevel: "supporting" },
    ]);

    const notices = buildEditorialNotices(profile);

    expect(notices.userNotice).toBeNull();
    expect(notices.cautionNotice).toContain("apoio complementar");
  });
});
