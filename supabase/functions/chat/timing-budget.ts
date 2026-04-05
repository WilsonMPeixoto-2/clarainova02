export interface ChatStageTimings {
  embeddingMs: number | null;
  expansionMs: number | null;
  searchMs: number | null;
  generationMs: number | null;
  sanitizationMs: number | null;
}

export interface ChatTimeBudgetConfig {
  totalMs: number;
  minStructuredRemainingMs: number;
  streamFallbackReserveMs: number;
  maxStructuredTimeoutMs: number;
  maxStreamInitTimeoutMs: number;
  minLeakageRepairRemainingMs: number;
  maxLeakageRepairTimeoutMs: number;
}

export interface ChatTimeBudgetSnapshot {
  totalMs: number;
  elapsedMs: number;
  remainingMs: number;
  structuredSkippedForBudget: boolean;
  structuredTimeoutMs: number | null;
  streamInitTimeoutMs: number | null;
  leakageRepairTimeoutMs: number | null;
}

type StageTimingKey = keyof ChatStageTimings;

function normalizeDuration(durationMs: number) {
  return Math.max(0, Math.round(durationMs));
}

export function createChatStageTimings(): ChatStageTimings {
  return {
    embeddingMs: null,
    expansionMs: null,
    searchMs: null,
    generationMs: null,
    sanitizationMs: null,
  };
}

export function addStageTiming(
  timings: ChatStageTimings,
  key: StageTimingKey,
  durationMs: number,
) {
  const normalized = normalizeDuration(durationMs);
  const current = timings[key] ?? 0;
  timings[key] = current + normalized;
  return timings[key];
}

function resolveStageTimeout(remainingMs: number, maxMs: number, reserveMs = 0) {
  const available = remainingMs - reserveMs;
  if (available <= 0) return null;
  return Math.min(maxMs, available);
}

export function createTimeBudgetTracker(
  startedAt: number,
  config: ChatTimeBudgetConfig,
  nowFn: () => number = Date.now,
) {
  function elapsedMs() {
    return normalizeDuration(nowFn() - startedAt);
  }

  function remainingMs() {
    return Math.max(0, config.totalMs - elapsedMs());
  }

  function structuredSkippedForBudget() {
    return remainingMs() < config.minStructuredRemainingMs;
  }

  function structuredTimeoutMs() {
    if (structuredSkippedForBudget()) return null;
    return resolveStageTimeout(
      remainingMs(),
      config.maxStructuredTimeoutMs,
      config.streamFallbackReserveMs,
    );
  }

  function streamInitTimeoutMs() {
    return resolveStageTimeout(remainingMs(), config.maxStreamInitTimeoutMs);
  }

  function leakageRepairTimeoutMs() {
    if (remainingMs() < config.minLeakageRepairRemainingMs) return null;
    return resolveStageTimeout(remainingMs(), config.maxLeakageRepairTimeoutMs);
  }

  function snapshot(): ChatTimeBudgetSnapshot {
    return {
      totalMs: config.totalMs,
      elapsedMs: elapsedMs(),
      remainingMs: remainingMs(),
      structuredSkippedForBudget: structuredSkippedForBudget(),
      structuredTimeoutMs: structuredTimeoutMs(),
      streamInitTimeoutMs: streamInitTimeoutMs(),
      leakageRepairTimeoutMs: leakageRepairTimeoutMs(),
    };
  }

  return {
    elapsedMs,
    remainingMs,
    structuredSkippedForBudget,
    structuredTimeoutMs,
    streamInitTimeoutMs,
    leakageRepairTimeoutMs,
    snapshot,
  };
}
