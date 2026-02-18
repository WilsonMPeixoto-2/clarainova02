import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-background/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-bold tracking-wide text-gradient-gold">
            CLARA
          </span>
          <span className="text-muted-foreground text-sm hidden sm:inline">
            Inteligência Administrativa
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status pill - maintenance */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 cursor-help">
                <AlertCircle className="w-3 h-3 text-gold" />
                <span className="text-xs text-gold font-medium">Em atualização</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>CLARA está em manutenção e será atualizada em breve.</p>
            </TooltipContent>
          </Tooltip>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#sobre" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#termos" className="hover:text-foreground transition-colors">Termos</a>
          </nav>

          <button className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.02] transition-all glow-pulse">
            Iniciar conversa
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
