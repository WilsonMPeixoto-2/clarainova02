import {
  getDefaultChatApiConfig,
  type ChatApiConfig,
} from '@/lib/chat-api';

export type ChatFeedbackValue = 'helpful' | 'not_helpful';
export type ChatFeedbackReason = 'not_about_this' | 'missing_detail' | 'incorrect_info';

export interface SubmitChatFeedbackInput {
  requestId: string;
  feedbackValue: ChatFeedbackValue;
  feedbackReason?: ChatFeedbackReason | null;
  feedbackComment?: string | null;
}

function sanitizeFeedbackComment(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 500) : null;
}

export async function submitChatFeedback(
  input: SubmitChatFeedbackInput,
  config: ChatApiConfig = getDefaultChatApiConfig(),
) {
  if (!config.backendConfigured || !config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error('O registro de feedback ainda nao esta disponivel neste ambiente.');
  }

  const response = await fetch(`${config.supabaseUrl}/functions/v1/submit-chat-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.supabasePublishableKey}`,
      'apikey': config.supabasePublishableKey,
    },
    body: JSON.stringify({
      requestId: input.requestId,
      feedbackValue: input.feedbackValue,
      feedbackReason: input.feedbackValue === 'not_helpful' ? input.feedbackReason ?? null : null,
      feedbackComment: sanitizeFeedbackComment(input.feedbackComment),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Nao consegui registrar o feedback agora. Tente novamente.');
  }

  return response.json().catch(() => ({ ok: true }));
}
