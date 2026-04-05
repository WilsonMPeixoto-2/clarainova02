import { describe, expect, it } from "vitest";

import {
  KEYWORD_ONLY_QUERY_EMBEDDING_MODEL,
  shouldUseSemanticRetrieval,
} from "../../supabase/functions/chat/retrieval-mode";

describe("chat retrieval mode", () => {
  it("disables semantic retrieval when no query embedding is available", () => {
    expect(KEYWORD_ONLY_QUERY_EMBEDDING_MODEL).toBe("keyword_only_no_embedding");
    expect(shouldUseSemanticRetrieval(null)).toBe(false);
    expect(shouldUseSemanticRetrieval("")).toBe(false);
    expect(shouldUseSemanticRetrieval("   ")).toBe(false);
  });

  it("enables semantic retrieval only with a real embedding payload", () => {
    expect(shouldUseSemanticRetrieval("[0.12,0.34,0.56]")).toBe(true);
  });
});
