import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Search, FileText, Cpu, Activity } from "lucide-react";

interface UsageStats {
  month: string;
  chat_messages: number;
  embedding_queries: number;
  pdf_extractions: number;
  embedding_generations: number;
}

export default function UsageStatsCard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/get-usage-stats`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch usage stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const items = stats
    ? [
        { label: "Mensagens do chat", value: stats.chat_messages, icon: MessageSquare },
        { label: "Buscas RAG", value: stats.embedding_queries, icon: Search },
        { label: "PDFs processados", value: stats.pdf_extractions, icon: FileText },
        { label: "Embeddings gerados", value: stats.embedding_generations, icon: Cpu },
      ]
    : [];

  const monthLabel = stats
    ? new Date(stats.month + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Monitoramento de Uso
        </CardTitle>
        {stats && (
          <CardDescription className="capitalize">{monthLabel}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : !stats ? (
          <p className="text-sm text-muted-foreground text-center py-4">Erro ao carregar dados</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ✅ Edge Functions: incluídas nos US$ 25/mês do Cloud
              </p>
              <p className="text-xs text-muted-foreground">
                ✅ API Gemini: uso gratuito via Google AI Studio
              </p>
              <p className="text-xs text-muted-foreground">
                🔒 Gateway Lovable AI (US$ 1/mês): não utilizado
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
