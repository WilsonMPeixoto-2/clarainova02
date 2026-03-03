import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, MessageCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
    <title>Página não encontrada — CLARA</title>
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="glass-card rounded-2xl p-10 sm:p-14 max-w-xl w-full text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-border bg-surface/60 text-muted-foreground uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Rota não encontrada
          </span>
          <h1 className="font-display text-6xl sm:text-7xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground text-base">
            A página <strong className="text-foreground">{location.pathname}</strong> não existe ou foi movida para uma nova estrutura.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/" className="px-6 py-3 rounded-full border border-border text-foreground font-medium text-sm hover:bg-surface-elevated transition-all flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para a home
            </Link>
            <Link to="/?chat=1" className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm transition-all flex items-center gap-2 hover:-translate-y-0.5">
              <MessageCircle className="w-4 h-4" />
              Falar com a CLARA
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default NotFound;
