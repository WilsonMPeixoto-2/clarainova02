export interface ChatContextSummary {
  title: string;
  summary: string;
}

export interface ChatConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  contextSummary?: ChatContextSummary | null;
}

const MAX_SNIPPET_LENGTH = 280;
const MAX_TITLE_LENGTH = 120;
const MAX_SUMMARY_LENGTH = 220;
const SHORT_FOLLOW_UP_WORD_LIMIT = 7;
const SHORT_FOLLOW_UP_CHAR_LIMIT = 140;
const DOMAIN_TERM_PATTERN =
  /\b(sei|sei-rio|processo|documento|documentos|assinatura|unidade|tramita(?:cao|ção)|bloco|despacho|peticionamento|credenciamento|migrac(?:ao|ão)|usuario|usuário|manual|guia)\b/i;
const FOLLOW_UP_PATTERNS: RegExp[] = [
  /^(e|mas|ent[aã]o)\b/i,
  /^(para|pra)\s+(outra unidade|mesma unidade|outra area|outra área)\b/i,
  /\b(nesse|nessa|neste|nesta|nesse caso|nessa situac(?:ao|ão)|neste fluxo|nessa etapa)\b/i,
  /\b(isso|isto|esse|essa|esse ponto|essa parte|essa opcao|essa opção)\b/i,
  /\b(depois|antes|em seguida|na sequencia|na sequência|proximo passo|próximo passo)\b/i,
  /\b(se (?:isso|for|acontecer)|se a unidade)\b/i,
];

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function takeSnippet(value: string, maxLength = MAX_SNIPPET_LENGTH) {
  return compactWhitespace(value).slice(0, maxLength);
}

function normalizeContextSummary(summary: ChatContextSummary | null | undefined): ChatContextSummary | null {
  if (!summary) return null;

  const title = takeSnippet(summary.title, MAX_TITLE_LENGTH);
  const body = takeSnippet(summary.summary, MAX_SUMMARY_LENGTH);
  if (!title || !body) return null;

  return { title, summary: body };
}

function formatContextSummary(summary: ChatContextSummary) {
  return `${summary.title}: ${summary.summary}`;
}

function getAssistantContextText(message: ChatConversationMessage) {
  const summary = normalizeContextSummary(message.contextSummary);
  if (summary) {
    return formatContextSummary(summary);
  }

  return takeSnippet(message.content);
}

function findLastUserIndex(messages: ChatConversationMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      return index;
    }
  }

  return -1;
}

function findPreviousAssistantSummary(messages: ChatConversationMessage[], beforeIndex: number) {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== 'assistant') continue;

    const summary = normalizeContextSummary(message.contextSummary);
    if (summary) {
      return summary;
    }
  }

  return null;
}

function findPreviousUserContent(messages: ChatConversationMessage[], beforeIndex: number) {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user') {
      return takeSnippet(message.content, 220);
    }
  }

  return null;
}

export function isLikelyContextualFollowUp(userMessage: string) {
  const normalized = compactWhitespace(userMessage);
  if (!normalized) return false;

  if (
    normalized.length <= SHORT_FOLLOW_UP_CHAR_LIMIT &&
    FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    return true;
  }

  const words = normalized.split(' ').filter(Boolean);
  return words.length <= SHORT_FOLLOW_UP_WORD_LIMIT && !DOMAIN_TERM_PATTERN.test(normalized);
}

export function compactConversationSnippet(messages: ChatConversationMessage[]): string {
  const recentContext = messages
    .slice(-4, -1)
    .map((message) => {
      const label = message.role === 'assistant' ? 'CLARA' : 'Usuário';
      const content = message.role === 'assistant'
        ? getAssistantContextText(message)
        : takeSnippet(message.content);
      return content ? `- ${label}: ${content}` : '';
    })
    .filter(Boolean);

  return recentContext.join('\n');
}

export function buildContextualizedEmbeddingQuery(
  messages: ChatConversationMessage[],
  userMessage: string,
) {
  const normalizedUserMessage = compactWhitespace(userMessage);
  if (!normalizedUserMessage) {
    return {
      queryText: '',
      isContextualized: false,
    };
  }

  if (!isLikelyContextualFollowUp(normalizedUserMessage)) {
    return {
      queryText: normalizedUserMessage,
      isContextualized: false,
    };
  }

  const lastUserIndex = findLastUserIndex(messages);
  const previousAssistantSummary = findPreviousAssistantSummary(
    messages,
    lastUserIndex >= 0 ? lastUserIndex : messages.length,
  );

  if (!previousAssistantSummary) {
    return {
      queryText: normalizedUserMessage,
      isContextualized: false,
    };
  }

  const previousUserContent = findPreviousUserContent(
    messages,
    lastUserIndex >= 0 ? lastUserIndex : messages.length,
  );

  const parts = [`pergunta_atual: ${normalizedUserMessage}`];
  if (previousUserContent) {
    parts.push(`pergunta_anterior: ${previousUserContent}`);
  }
  parts.push(`contexto_clara: ${formatContextSummary(previousAssistantSummary)}`);

  return {
    queryText: parts.join('\n'),
    isContextualized: true,
  };
}
