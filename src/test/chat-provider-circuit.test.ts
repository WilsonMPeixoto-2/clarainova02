import { describe, expect, it } from "vitest";

import {
  clearProviderCircuit,
  getProviderCircuitSnapshot,
  openProviderCircuit,
} from "../../supabase/functions/_shared/provider-circuit.ts";

describe("provider circuit helpers", () => {
  it("opens, reads and expires cooldown snapshots", () => {
    clearProviderCircuit("chat-test");

    const opened = openProviderCircuit("chat-test", "quota", 2_000, 10_000);
    expect(opened.reason).toBe("quota");
    expect(opened.remainingMs).toBe(2_000);

    const active = getProviderCircuitSnapshot("chat-test", 11_000);
    expect(active?.remainingMs).toBe(1_000);

    const expired = getProviderCircuitSnapshot("chat-test", 12_001);
    expect(expired).toBeNull();
  });
});
