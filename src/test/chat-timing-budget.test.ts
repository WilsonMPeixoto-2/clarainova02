import { describe, expect, it } from 'vitest';

import {
  addStageTiming,
  createChatStageTimings,
  createTimeBudgetTracker,
} from '../../supabase/functions/chat/timing-budget';

const budgetConfig = {
  totalMs: 50_000,
  minStructuredRemainingMs: 20_000,
  streamFallbackReserveMs: 8_000,
  maxStructuredTimeoutMs: 45_000,
  maxStreamInitTimeoutMs: 20_000,
  minLeakageRepairRemainingMs: 8_000,
  maxLeakageRepairTimeoutMs: 12_000,
};

describe('chat timing budget', () => {
  it('reserves time for stream fallback before structured generation', () => {
    const now = 12_000;
    const tracker = createTimeBudgetTracker(0, budgetConfig, () => now);

    expect(tracker.structuredSkippedForBudget()).toBe(false);
    expect(tracker.structuredTimeoutMs()).toBe(30_000);
    expect(tracker.streamInitTimeoutMs()).toBe(20_000);
  });

  it('skips structured generation when the remaining budget is too low', () => {
    const now = 32_500;
    const tracker = createTimeBudgetTracker(0, budgetConfig, () => now);

    expect(tracker.remainingMs()).toBe(17_500);
    expect(tracker.structuredSkippedForBudget()).toBe(true);
    expect(tracker.structuredTimeoutMs()).toBeNull();
    expect(tracker.streamInitTimeoutMs()).toBe(17_500);
  });

  it('disables leakage repair when almost no time remains', () => {
    const now = 43_500;
    const tracker = createTimeBudgetTracker(0, budgetConfig, () => now);

    expect(tracker.leakageRepairTimeoutMs()).toBeNull();
    expect(tracker.streamInitTimeoutMs()).toBe(6_500);
  });

  it('accumulates timings per stage', () => {
    const timings = createChatStageTimings();

    addStageTiming(timings, 'embeddingMs', 110.4);
    addStageTiming(timings, 'embeddingMs', 39.8);
    addStageTiming(timings, 'generationMs', 802.2);

    expect(timings).toEqual({
      embeddingMs: 150,
      expansionMs: null,
      searchMs: null,
      generationMs: 802,
      sanitizationMs: null,
    });
  });
});
