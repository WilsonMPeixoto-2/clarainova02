import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChatTeardropText, MagnifyingGlass, FileText, Pulse } from "@phosphor-icons/react";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";

interface UsageStats {
  month: string;
  chat_messages: number;
  embedding_queries: number;
  client_side_ingestions: number;
}

export default function UsageStatsCard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-usage-stats");
        if (!error && data) {
          setStats(data as UsageStats);
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
        { label: "Mensagens do chat", value: stats.chat_messages, icon: ChatTeardropText },
        { label: "Buscas RAG", value: stats.embedding_queries, icon: MagnifyingGlass },
        { label: "PDFs ingeridos", value: stats.client_side_ingestions, icon: FileText },
      ]
    : [];

  const monthLabel = stats
    ? new Date(stats.month + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pulse className="h-5 w-5" />
          Metricas agregadas da CLARA
        </CardTitle>
        {stats && (
          <CardDescription className="capitalize">{monthLabel}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSupabaseConfig ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            As métricas agregadas voltam a aparecer assim que o novo Supabase for conectado.
          </p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : !stats ? (
          <p className="text-sm text-muted-foreground text-center py-4">Erro ao carregar dados</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ✅ Painel voltado para monitoramento tecnico e evolucao da base
              </p>
              <p className="text-xs text-muted-foreground">
                ✅ Os numeros exibidos dependem da telemetria disponivel no backend ativo
              </p>
              <p className="text-xs text-muted-foreground">
                ✅ A proposta e acompanhar sinais agregados do produto, sem identificar quem fez cada pergunta
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
