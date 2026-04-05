import type { ChatConversationMessage } from "./conversation-context.ts";

const HEAVY_PROMPT_THRESHOLD_TOKENS = 10_000;

export interface ChatPromptTelemetryInput {
  systemPrompt: string;
  responseModePrompt: string;
  retrievalQualityPrompt: string;
  sourceTargetPrompt: string;
  knowledgeContext: string;
  messages: ChatConversationMessage[];
}

export interface ChatPromptTelemetry {
  totalPromptChars: number;
  totalPromptTokens: number;
  systemPromptTokens: number;
  responseModePromptTokens: number;
  retrievalQualityPromptTokens: number;
  sourceTargetPromptTokens: number;
  knowledgeContextTokens: number;
  historyChars: number;
  historyTokens: number;
  historyMessageCount: number;
  historyUserMessageCount: number;
  historyAssistantMessageCount: number;
  promptOver10k: boolean;
}

function normalizeSegment(value: string | null | undefined) {
  return typeof value === "string" ? value : "";
}

function estimateSegmentTokens(value: string) {
  const normalized = value.trim();
  if (!normalized) return 0;
  return Math.ceil(normalized.length / 4);
}

function buildHistoryText(messages: ChatConversationMessage[]) {
  return messages.map((message) => message.content).join("\n");
}

export function buildPromptTelemetry(input: ChatPromptTelemetryInput): ChatPromptTelemetry {
  const systemPrompt = normalizeSegment(input.systemPrompt);
  const responseModePrompt = normalizeSegment(input.responseModePrompt);
  const retrievalQualityPrompt = normalizeSegment(input.retrievalQualityPrompt);
  const sourceTargetPrompt = normalizeSegment(input.sourceTargetPrompt);
  const knowledgeContext = normalizeSegment(input.knowledgeContext);
  const historyText = buildHistoryText(input.messages);
  const totalPromptText = `${systemPrompt}${responseModePrompt}${retrievalQualityPrompt}${sourceTargetPrompt}${knowledgeContext}\n${historyText}`;

  const historyMessageCount = input.messages.length;
  const historyUserMessageCount = input.messages.filter((message) => message.role === "user").length;
  const historyAssistantMessageCount = input.messages.filter((message) => message.role === "assistant").length;
  const totalPromptTokens = estimateSegmentTokens(totalPromptText);

  return {
    totalPromptChars: totalPromptText.length,
    totalPromptTokens,
    systemPromptTokens: estimateSegmentTokens(systemPrompt),
    responseModePromptTokens: estimateSegmentTokens(responseModePrompt),
    retrievalQualityPromptTokens: estimateSegmentTokens(retrievalQualityPrompt),
    sourceTargetPromptTokens: estimateSegmentTokens(sourceTargetPrompt),
    knowledgeContextTokens: estimateSegmentTokens(knowledgeContext),
    historyChars: historyText.length,
    historyTokens: estimateSegmentTokens(historyText),
    historyMessageCount,
    historyUserMessageCount,
    historyAssistantMessageCount,
    promptOver10k: totalPromptTokens > HEAVY_PROMPT_THRESHOLD_TOKENS,
  };
}

export function buildPromptTelemetryMetadata(telemetry: ChatPromptTelemetry) {
  return {
    prompt_chars_total: telemetry.totalPromptChars,
    prompt_tokens_total: telemetry.totalPromptTokens,
    prompt_tokens_system: telemetry.systemPromptTokens,
    prompt_tokens_response_mode: telemetry.responseModePromptTokens,
    prompt_tokens_retrieval_quality: telemetry.retrievalQualityPromptTokens,
    prompt_tokens_source_target: telemetry.sourceTargetPromptTokens,
    prompt_tokens_knowledge_context: telemetry.knowledgeContextTokens,
    prompt_tokens_history: telemetry.historyTokens,
    history_chars_total: telemetry.historyChars,
    history_message_count: telemetry.historyMessageCount,
    history_user_message_count: telemetry.historyUserMessageCount,
    history_assistant_message_count: telemetry.historyAssistantMessageCount,
    prompt_over_10k: telemetry.promptOver10k,
  };
}
