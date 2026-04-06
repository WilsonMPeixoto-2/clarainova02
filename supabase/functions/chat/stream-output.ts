type StreamPartLike = {
  text?: unknown;
  thought?: unknown;
};

type StreamCandidateLike = {
  content?: {
    parts?: StreamPartLike[];
  };
};

type StreamChunkLike = {
  text?: unknown;
  candidates?: StreamCandidateLike[];
};

export function extractVisibleStreamText(chunk: StreamChunkLike): string {
  const parts = chunk.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? [];
  if (parts.length > 0) {
    return parts
      .filter((part) => typeof part.text === "string" && part.thought !== true)
      .map((part) => part.text as string)
      .join("");
  }

  return typeof chunk.text === "string" ? chunk.text : "";
}
