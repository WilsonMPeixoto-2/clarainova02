import { useEffect, useState } from "react";
import { MessageCircle, Menu } from "lucide-react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-background/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-primary">C</span>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-sm font-bold tracking-[0.15em] text-foreground">
              CLARA
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Inteligência Administrativa &<br />
              Inovação no Serviço Público
            </span>
          </div>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground tracking-wide uppercase">
          <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
          <a href="/termos" className="hover:text-foreground transition-colors">Termos</a>
          <a href="#contato" className="hover:text-foreground transition-colors">Contato</a>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-border text-foreground text-sm font-medium hover:bg-surface-elevated hover:border-gold/30 transition-all">
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-surface-elevated text-foreground text-sm font-medium border border-border hover:border-gold/30 transition-all">
            <Menu className="w-4 h-4" />
            MENU
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
