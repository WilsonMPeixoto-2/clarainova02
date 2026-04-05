import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://clarainova02.vercel.app",
  "https://clara.sme.rio",
];

const FEEDBACK_VALUES = new Set(["helpful", "not_helpful"]);
const FEEDBACK_REASONS = new Set([
  "not_about_this",
  "missing_detail",
  "incorrect_info",
]);
const MAX_COMMENT_LENGTH = 500;

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.startsWith("http://localhost:")) return origin;
  return ALLOWED_ORIGINS[0];
}

function buildCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function mapFeedbackReasonToGapReason(reason: string | null) {
  switch (reason) {
    case "not_about_this":
      return "feedback_nao_era_sobre_isso";
    case "missing_detail":
      return "feedback_faltou_detalhe";
    case "incorrect_info":
      return "feedback_informacao_errada";
    default:
      return "feedback_negativo_sem_detalhe";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const requestId = normalizeText(body?.requestId, 120);
    const feedbackValue = normalizeText(body?.feedbackValue, 40);
    const feedbackReason = normalizeText(body?.feedbackReason, 60);
    const feedbackComment = normalizeText(body?.feedbackComment, MAX_COMMENT_LENGTH);

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "Feedback sem request_id válido." }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (!feedbackValue || !FEEDBACK_VALUES.has(feedbackValue)) {
      return new Response(
        JSON.stringify({ error: "Tipo de feedback inválido." }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (feedbackReason && !FEEDBACK_REASONS.has(feedbackReason)) {
      return new Response(
        JSON.stringify({ error: "Motivo do feedback inválido." }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Credenciais Supabase não configuradas." }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const rateLimitKey = `feedback:${clientIP}:${requestId}`;

    const { data: allowed, error: rateLimitError } = await supabase.rpc("check_rate_limit", {
      p_identifier: rateLimitKey,
      p_max_requests: 8,
      p_window_minutes: 5,
    });

    if (rateLimitError) {
      console.error("submit-chat-feedback rate limit error:", rateLimitError.message);
    } else if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas de feedback em sequência. Aguarde um instante." }),
        { status: 429, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const { data: analyticsRow, error: analyticsLookupError } = await supabase
      .from("query_analytics")
      .select("id,gap_reason,needs_content_gap_review")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analyticsLookupError) {
      console.error("submit-chat-feedback lookup failed:", analyticsLookupError.message);
      return new Response(
        JSON.stringify({ error: "Não consegui localizar a resposta para registrar esse feedback." }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (!analyticsRow?.id) {
      return new Response(
        JSON.stringify({ error: "Não encontrei essa resposta para registrar o feedback." }),
        { status: 404, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const isHelpful = feedbackValue === "helpful";
    const feedbackSubmittedAt = new Date().toISOString();
    const updatePayload = {
      is_answered_satisfactorily: isHelpful,
      needs_content_gap_review: isHelpful ? analyticsRow.needs_content_gap_review : true,
      gap_reason: isHelpful ? analyticsRow.gap_reason : analyticsRow.gap_reason ?? mapFeedbackReasonToGapReason(feedbackReason),
      user_feedback_value: feedbackValue,
      user_feedback_reason: isHelpful ? null : feedbackReason,
      user_feedback_comment: feedbackComment,
      user_feedback_source: "chat_ui",
      user_feedback_submitted_at: feedbackSubmittedAt,
    };

    const { error: analyticsUpdateError } = await supabase
      .from("query_analytics")
      .update(updatePayload)
      .eq("id", analyticsRow.id);

    if (analyticsUpdateError) {
      console.error("submit-chat-feedback update failed:", analyticsUpdateError.message);
      return new Response(
        JSON.stringify({ error: "Não consegui salvar o feedback agora." }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const { error: logError } = await supabase
      .from("usage_logs")
      .insert({
        event_type: "chat_feedback",
        metadata: {
          request_id: requestId,
          feedback_value: feedbackValue,
          feedback_reason: isHelpful ? null : feedbackReason,
          has_comment: Boolean(feedbackComment),
          feedback_source: "chat_ui",
        },
      });

    if (logError) {
      console.error("submit-chat-feedback usage log failed:", logError.message);
    }

    return new Response(
      JSON.stringify({ ok: true, requestId, feedbackValue, submittedAt: feedbackSubmittedAt }),
      { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("submit-chat-feedback error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao registrar o feedback." }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
