import { describe, expect, it } from "vitest";

import { extractVisibleStreamText } from "../../supabase/functions/chat/stream-output.ts";

describe("chat stream output helpers", () => {
  it("filters thought parts when candidates content is available", () => {
    const text = extractVisibleStreamText({
      text: "Thinking... resposta final",
      candidates: [
        {
          content: {
            parts: [
              { text: "Thinking...", thought: true },
              { text: "Resposta final" },
            ],
          },
        },
      ],
    });

    expect(text).toBe("Resposta final");
  });

  it("falls back to chunk.text when parts are absent", () => {
    expect(extractVisibleStreamText({ text: "Resposta em stream" })).toBe("Resposta em stream");
  });
});
