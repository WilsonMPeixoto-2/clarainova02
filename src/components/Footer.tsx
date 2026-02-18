const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm text-gradient-gold tracking-wide">CLARA</span>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} ClaraInova</span>
        </div>

        <nav className="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="#termos" className="hover:text-foreground transition-colors">Termos de Uso</a>
          <a href="#privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
          <a href="#fontes" className="hover:text-foreground transition-colors">Fontes</a>
          <a href="#contato" className="hover:text-foreground transition-colors">Contato</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
