import { describe, expect, it } from "vitest";

import {
  buildPromptTelemetry,
  buildPromptTelemetryMetadata,
} from "../../supabase/functions/chat/prompt-telemetry";

describe("chat prompt telemetry", () => {
  it("breaks prompt usage into prompt segments and sent history", () => {
    const telemetry = buildPromptTelemetry({
      systemPrompt: "1234",
      responseModePrompt: "12345678",
      retrievalQualityPrompt: "",
      sourceTargetPrompt: "123456789012",
      knowledgeContext: "abcdefghij",
      messages: [
        { role: "user", content: "abcd" },
        { role: "assistant", content: "abcdefgh" },
      ],
    });

    expect(telemetry).toEqual({
      totalPromptChars: 48,
      totalPromptTokens: 12,
      systemPromptTokens: 1,
      responseModePromptTokens: 2,
      retrievalQualityPromptTokens: 0,
      sourceTargetPromptTokens: 3,
      knowledgeContextTokens: 3,
      historyChars: 13,
      historyTokens: 4,
      historyMessageCount: 2,
      historyUserMessageCount: 1,
      historyAssistantMessageCount: 1,
      promptOver10k: false,
    });
  });

  it("flags prompts above ten thousand estimated tokens", () => {
    const telemetry = buildPromptTelemetry({
      systemPrompt: "a".repeat(40_001),
      responseModePrompt: "",
      retrievalQualityPrompt: "",
      sourceTargetPrompt: "",
      knowledgeContext: "",
      messages: [{ role: "user", content: "ok" }],
    });

    expect(telemetry.totalPromptTokens).toBeGreaterThan(10_000);
    expect(telemetry.promptOver10k).toBe(true);
  });

  it("exposes metadata keys expected by chat_metrics metadata_json", () => {
    const metadata = buildPromptTelemetryMetadata(
      buildPromptTelemetry({
        systemPrompt: "1234",
        responseModePrompt: "1234",
        retrievalQualityPrompt: "1234",
        sourceTargetPrompt: "1234",
        knowledgeContext: "1234",
        messages: [{ role: "user", content: "1234" }],
      }),
    );

    expect(metadata).toMatchObject({
      prompt_tokens_total: 7,
      prompt_tokens_system: 1,
      prompt_tokens_response_mode: 1,
      prompt_tokens_retrieval_quality: 1,
      prompt_tokens_source_target: 1,
      prompt_tokens_knowledge_context: 1,
      prompt_tokens_history: 1,
      history_message_count: 1,
      history_user_message_count: 1,
      history_assistant_message_count: 0,
      prompt_over_10k: false,
    });
  });
});
