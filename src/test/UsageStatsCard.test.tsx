import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import UsageStatsCard from "@/components/UsageStatsCard";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));
const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/integrations/supabase/client", () => ({
  hasSupabaseConfig: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UsageStatsCard />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  invokeMock.mockReset();
  fetchMock.mockReset();
});

describe("UsageStatsCard", () => {
  it("renders the content gap section with grouped topics and recent cases", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        checkedAt: "2026-04-05T13:10:00Z",
        summary: {
          totalEntries: 17,
          checkedEntries: 17,
          currentCount: 12,
          changedCount: 1,
          requestFailedCount: 1,
          missingUrlCount: 0,
          headersMissingCount: 2,
          monitorCount: 1,
        },
        items: [
          {
            downloadDate: "2026-04-04",
            fileName: "NUCLEO_P1_guia_migracao_sei_rio_2026.pdf",
            freshnessStatus: "changed",
            httpStatus: 200,
            note: "A origem parece mais recente do que a data registrada no manifesto.",
            remoteLastModified: "2026-04-05T00:00:00Z",
            title: "Guia de migração – SEI.Rio",
          },
        ],
      }),
    });

    invokeMock.mockResolvedValue({
      data: {
        month: "2026-04",
        chat_messages: 12,
        embedding_queries: 8,
        client_side_ingestions: 3,
        grounded_answers: 10,
        content_gap_reviews: 2,
        degraded_responses: 1,
        average_latency_ms: 1420,
        top_topics: [{ topic: "assinatura", count: 4 }],
        content_gap_topics: [
          {
            topic: "bloco_assinatura",
            count: 2,
            feedback_count: 1,
            low_quality_count: 1,
            no_coverage_count: 1,
          },
        ],
        recent_content_gaps: [
          {
            created_at: "2026-04-05T11:10:00.000Z",
            expanded_query: "bloco de assinatura outra unidade sei-rio",
            gap_reason: "sem_cobertura_documental",
            query_text: "E se for para outra unidade?",
            rag_quality_score: 0.42,
            request_id: "req-gap-1",
            response_status: "partial",
            retrieval_mode: "model_grounded",
            signal_label: "feedback_negativo",
            topic_label: "bloco_assinatura",
            user_feedback_comment: "Faltou explicar a exceção.",
            user_feedback_reason: "missing_detail",
            user_feedback_value: "not_helpful",
          },
        ],
      },
      error: null,
    });

    renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getByText(/Perguntas sem cobertura/i)).toBeInTheDocument();
    });

    expect(screen.getByText("bloco_assinatura")).toBeInTheDocument();
    expect(screen.getByText("E se for para outra unidade?")).toBeInTheDocument();
    expect(screen.getByText(/^Feedback negativo$/i)).toBeInTheDocument();
    expect(screen.getByText(/Score RAG 0.42/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltou detalhe/i)).toBeInTheDocument();
    expect(screen.getByText(/Expansão aplicada:/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltou explicar a exceção\./i)).toBeInTheDocument();
    expect(screen.getByText(/Frescor do corpus/i)).toBeInTheDocument();
    expect(screen.getByText(/Fontes mais recentes/i)).toBeInTheDocument();
    expect(screen.getByText(/Guia de migração/i)).toBeInTheDocument();
    expect(screen.getByText(/A origem parece mais recente/i)).toBeInTheDocument();
  });
});
