export type ProviderCircuitSnapshot = {
  key: string;
  openedAt: string;
  reason: string;
  untilIso: string;
  remainingMs: number;
};

type ProviderCircuitState = {
  openedAtMs: number;
  reason: string;
  cooldownMs: number;
};

const providerCircuits = new Map<string, ProviderCircuitState>();

function buildSnapshot(key: string, state: ProviderCircuitState, now: number): ProviderCircuitSnapshot {
  const remainingMs = Math.max(state.openedAtMs + state.cooldownMs - now, 0);

  return {
    key,
    openedAt: new Date(state.openedAtMs).toISOString(),
    reason: state.reason,
    untilIso: new Date(state.openedAtMs + state.cooldownMs).toISOString(),
    remainingMs,
  };
}

export function getProviderCircuitSnapshot(
  key: string,
  now = Date.now(),
): ProviderCircuitSnapshot | null {
  const state = providerCircuits.get(key);
  if (!state) {
    return null;
  }

  const remainingMs = state.openedAtMs + state.cooldownMs - now;
  if (remainingMs <= 0) {
    providerCircuits.delete(key);
    return null;
  }

  return buildSnapshot(key, state, now);
}

export function openProviderCircuit(
  key: string,
  reason: string,
  cooldownMs: number,
  now = Date.now(),
): ProviderCircuitSnapshot {
  const nextState: ProviderCircuitState = {
    openedAtMs: now,
    reason,
    cooldownMs,
  };
  providerCircuits.set(key, nextState);
  return buildSnapshot(key, nextState, now);
}

export function clearProviderCircuit(key: string) {
  providerCircuits.delete(key);
}
