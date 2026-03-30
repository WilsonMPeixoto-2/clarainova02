import { describe, expect, it } from "vitest";

import {
  getChatConfigurationErrorMessage,
  getChatRuntimeDescription,
  getChatRuntimeLabel,
  isChatBackendConfigured,
  isChatMockEnabled,
} from "@/lib/chat-runtime";

describe("chat runtime configuration", () => {
  it("requires both Supabase URL and publishable key", () => {
    expect(isChatBackendConfigured({ VITE_SUPABASE_URL: "https://x.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "anon" })).toBe(true);
    expect(isChatBackendConfigured({ VITE_SUPABASE_URL: "https://x.supabase.co" })).toBe(false);
    expect(isChatBackendConfigured({ VITE_SUPABASE_PUBLISHABLE_KEY: "anon" })).toBe(false);
  });

  it("enables mock mode only in development when explicitly requested", () => {
    expect(isChatMockEnabled({ DEV: true, VITE_ENABLE_CHAT_MOCK: "true" })).toBe(true);
    expect(isChatMockEnabled({ DEV: true, VITE_ENABLE_CHAT_MOCK: "1" })).toBe(true);
    expect(isChatMockEnabled({ DEV: true, VITE_ENABLE_CHAT_MOCK: "false" })).toBe(false);
    expect(isChatMockEnabled({ DEV: false, VITE_ENABLE_CHAT_MOCK: "true" })).toBe(false);
  });

  it("returns a production-safe configuration error message", () => {
    expect(getChatConfigurationErrorMessage()).toContain("ainda não está conectada");
  });

  it("exposes user-facing runtime labels and descriptions", () => {
    expect(getChatRuntimeLabel("online")).toBe("Atendimento conectado");
    expect(getChatRuntimeLabel("mock")).toBe("Ambiente de demonstração");
    expect(getChatRuntimeLabel("preview")).toBe("Demonstração guiada");

    expect(getChatRuntimeDescription("online")).toContain("orientações disponíveis");
    expect(getChatRuntimeDescription("mock")).toContain("ambiente de demonstração");
    expect(getChatRuntimeDescription("preview")).toContain("respostas ainda são demonstrativas");
  });
});
