import { Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-premium-shell py-16 md:py-20 border-t border-[hsl(var(--border-subtle))]" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="footer-premium-grid">
          <div className="footer-brand-card">
            <p className="footer-brand-kicker">CLARA / premium interface</p>
            <span className="footer-brand-title">CLARA</span>
            <p className="text-sm text-muted-foreground max-w-xl">
              Ferramenta de apoio ao uso do SEI-Rio e a rotinas administrativas, agora com direção visual mais forte, leitura mais nobre e presença de produto mais madura.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Uso gratuito, com foco em orientação operacional, confiança visual e apoio à execução.
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
            <nav className="footer-link-group" aria-label="Produto">
              <p className="footer-link-heading">Produto</p>
              <Link to="/#conhecimento" className="footer-link">Funcionalidades</Link>
              <Link to="/#faq" className="footer-link">Perguntas frequentes</Link>
            </nav>
            <nav className="footer-link-group" aria-label="Governança">
              <p className="footer-link-heading">Governança</p>
              <Link to="/termos" className="footer-link">Termos de Serviço</Link>
              <Link to="/privacidade" className="footer-link">Política de Privacidade</Link>
            </nav>
            <nav className="footer-link-group" aria-label="Contato">
              <p className="footer-link-heading">Contato</p>
              <a href="mailto:wilsonmp2@gmail.com" className="footer-link">Email direto</a>
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[hsl(var(--border-subtle))]">
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed inline-flex items-center justify-center gap-2 w-full" role="note">
            <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
            A CLARA auxilia consultas operacionais e não substitui a leitura dos documentos oficiais nem a validação interna necessária em cada processo.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
