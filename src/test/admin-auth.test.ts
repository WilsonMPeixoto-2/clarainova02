import { describe, expect, it } from "vitest";

import {
  formatAdminAuthErrorMessage,
  getPasskeyPreparationMessage,
} from "@/lib/admin-auth";

describe("admin auth copy helpers", () => {
  it("maps common auth provider errors to user-friendly messages", () => {
    expect(formatAdminAuthErrorMessage("Invalid login credentials", "fallback")).toBe(
      "Email ou senha não conferem. Revise os dados e tente novamente.",
    );
    expect(formatAdminAuthErrorMessage("provider is not enabled", "fallback")).toBe(
      "O acesso com Google ainda não está disponível neste ambiente.",
    );
    expect(formatAdminAuthErrorMessage("Failed to fetch", "fallback")).toBe(
      "Não consegui falar com o serviço de acesso agora. Tente novamente em instantes.",
    );
  });

  it("keeps passkey guidance focused on the user experience", () => {
    expect(getPasskeyPreparationMessage()).toContain("experiência do painel");
    expect(getPasskeyPreparationMessage().toLowerCase()).not.toContain("webauthn");
    expect(getPasskeyPreparationMessage().toLowerCase()).not.toContain("supabase");
  });
});
