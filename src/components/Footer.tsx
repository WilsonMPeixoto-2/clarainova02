import { Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-premium-shell py-16 md:py-20 border-t border-[hsl(var(--border-subtle))]" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="footer-premium-grid">
          <div className="footer-brand-card">
            <p className="footer-brand-kicker">CLARA / apoio ao SEI-Rio</p>
            <span className="footer-brand-title">CLARA</span>
            <p className="text-sm text-muted-foreground max-w-xl">
              Ferramenta de apoio para dúvidas frequentes sobre o uso do SEI-Rio.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/75">
              <a href="mailto:wilsonmp2@gmail.com" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                wilsonmp2@gmail.com
              </a>
            </div>

            <p className="text-caption">© {currentYear} CLARA. Todos os direitos reservados.</p>
          </div>

          <div className="footer-link-columns">
            <nav className="footer-link-group" aria-label="Navegação">
              <p className="footer-link-heading">Navegação</p>
              <Link to="/#conhecimento" className="footer-link">Funcionalidades</Link>
              <Link to="/#faq" className="footer-link">FAQ</Link>
            </nav>
            <nav className="footer-link-group" aria-label="Transparência">
              <p className="footer-link-heading">Transparência</p>
              <Link to="/termos" className="footer-link">Termos de Uso</Link>
              <Link to="/privacidade" className="footer-link">Política de Privacidade</Link>
            </nav>
            <nav className="footer-link-group" aria-label="Contato">
              <p className="footer-link-heading">Contato</p>
              <a href="mailto:wilsonmp2@gmail.com" className="footer-link">Email direto</a>
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[hsl(var(--border-subtle))]">
          <div className="footer-note" role="note">
            <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              A CLARA auxilia consultas operacionais e não substitui a leitura dos documentos oficiais nem a validação interna necessária em cada processo.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
