import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithPassword,
  mockSignInWithOAuth,
  mockSignOut,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  hasSupabaseConfig: true,
  SUPABASE_UNAVAILABLE_MESSAGE: "unavailable",
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signOut: mockSignOut,
    },
    rpc: vi.fn(),
  },
}));

import AdminAuth from "@/components/AdminAuth";

describe("AdminAuth", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockSignInWithPassword.mockReset();
    mockSignInWithOAuth.mockReset();
    mockSignOut.mockReset();

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it("shows the login form when there is no active session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <AdminAuth>
        <div>Protected content</div>
      </AdminAuth>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Área Administrativa" })).toBeInTheDocument();
    });

    expect(screen.queryByText("Confirmando seu acesso")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar com conta provisionada" })).toBeInTheDocument();
  });
});
