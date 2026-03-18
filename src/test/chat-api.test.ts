import { afterEach, describe, expect, it, vi } from "vitest";

import { buildMockStructuredResponse } from "@/lib/clara-response";
import { requestChat, streamChatResponse, type ChatApiConfig } from "@/lib/chat-api";

const baseConfig: ChatApiConfig = {
  supabaseUrl: "https://clara.supabase.co",
  supabasePublishableKey: "anon-key",
  backendConfigured: true,
  mockEnabled: false,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("chat api transport", () => {
  it("parses the structured response envelope returned by the chat function", async () => {
    const response = buildMockStructuredResponse("Como incluir documento externo?");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          kind: "clara_structured_response",
          response,
          plainText: "Resposta estruturada pronta.",
        }),
        {
          headers: { "content-type": "application/json" },
          status: 200,
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestChat(
      [{ role: "user", content: "Como incluir documento externo?" }],
      baseConfig,
    );

    expect(result.kind).toBe("structured");
    if (result.kind !== "structured") {
      throw new Error("Expected structured result");
    }
    expect(result.response.tituloCurto).toBe(response.tituloCurto);
    expect(result.plainText).toBe("Resposta estruturada pronta.");
  });

  it("parses structured envelopes embedded in answer text", async () => {
    const response = buildMockStructuredResponse("Como montar bloco de assinatura?");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: JSON.stringify({
            kind: "clara_structured_response",
            response,
            plainText: "Bloco de assinatura explicado.",
          }),
        }),
        {
          headers: { "content-type": "application/json" },
          status: 200,
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestChat(
      [{ role: "user", content: "Como montar bloco de assinatura?" }],
      baseConfig,
    );

    expect(result.kind).toBe("structured");
    if (result.kind !== "structured") {
      throw new Error("Expected structured result");
    }
    expect(result.plainText).toBe("Bloco de assinatura explicado.");
  });

  it("uses the mock responder only when explicitly enabled", async () => {
    const result = await requestChat(
      [{ role: "user", content: "Como enviar processo?" }],
      {
        backendConfigured: false,
        mockEnabled: true,
        mockDelayMs: 0,
      },
    );

    expect(result.kind).toBe("structured");
  });

  it("rejects when backend is absent and mock mode is disabled", async () => {
    await expect(
      requestChat(
        [{ role: "user", content: "Como incluir anexo?" }],
        {
          backendConfigured: false,
          mockEnabled: false,
        },
      ),
    ).rejects.toThrow("sem conexão com o backend");
  });

  it("streams SSE deltas into the UI callback", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Primeiro "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"segundo"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    const response = new Response(
      new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
      }),
      {
        headers: { "content-type": "text/event-stream" },
      },
    );

    const tokens: string[] = [];
    let doneCalled = false;
    let errorMessage: string | null = null;

    await streamChatResponse(
      response,
      (token) => tokens.push(token),
      () => {
        doneCalled = true;
      },
      (message) => {
        errorMessage = message;
      },
    );

    expect(tokens.join("")).toBe("Primeiro segundo");
    expect(doneCalled).toBe(true);
    expect(errorMessage).toBeNull();
  });
});
