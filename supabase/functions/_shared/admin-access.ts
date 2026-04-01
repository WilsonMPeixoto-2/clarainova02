import { createClient, type User } from "npm:@supabase/supabase-js@2";

export type AdminAccessResult =
  | {
      ok: true;
      user: User;
    }
  | {
      ok: false;
      code: "AUTH:UNAUTHORIZED" | "AUTH:FORBIDDEN" | "AUTH:ADMIN_LOOKUP_FAILED";
      message: string;
      status: 401 | 403 | 500;
    };

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export async function requireAdminUser(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
  supabaseServiceRoleKey: string,
): Promise<AdminAccessResult> {
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return {
      ok: false,
      code: "AUTH:UNAUTHORIZED",
      message: "Access token ausente.",
      status: 401,
    };
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) {
    console.warn("admin auth rejected:", error?.message ?? "no user");
    return {
      ok: false,
      code: "AUTH:UNAUTHORIZED",
      message: error?.message ?? "Usuario nao autenticado.",
      status: 401,
    };
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: adminRow, error: adminError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) {
    console.error("admin lookup failed:", adminError.message);
    return {
      ok: false,
      code: "AUTH:ADMIN_LOOKUP_FAILED",
      message: adminError.message,
      status: 500,
    };
  }

  if (!adminRow) {
    return {
      ok: false,
      code: "AUTH:FORBIDDEN",
      message: "Conta autenticada sem permissao administrativa.",
      status: 403,
    };
  }

  return {
    ok: true,
    user: data.user,
  };
}
