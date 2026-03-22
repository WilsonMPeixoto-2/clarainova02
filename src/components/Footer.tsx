<<<<<<< HEAD
import { EnvelopeSimple, ShieldCheck } from '@phosphor-icons/react';
=======
import { Linkedin, Mail, Phone, ShieldCheck } from 'lucide-react';
>>>>>>> origin/main
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerSignals = ['Documentos', 'Assinatura', 'Tramitação', 'Consultas rápidas'];

  return (
    <footer className="footer-premium-shell py-16 md:py-20 border-t border-[hsl(var(--border-subtle))]" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="footer-premium-grid">
          <div className="footer-brand-card">
            <p className="footer-brand-kicker">CLARA / apoio ao SEI-Rio</p>
            <span className="footer-brand-title">CLARA</span>
            <p className="text-sm text-muted-foreground max-w-xl">
              Desenvolvido por <span className="text-foreground font-medium">Wilson M. Peixoto</span> - SME/RJ
            </p>
            <p className="text-xs text-muted-foreground/80">Inovação para a Gestão Pública</p>

            <div className="footer-signal-row" aria-label="Temas frequentes">
              {footerSignals.map((signal) => (
                <span key={signal} className="footer-signal-chip">{signal}</span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/75">
              <a href="tel:+5521994974132" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                <Phone weight="duotone" className="w-3.5 h-3.5" aria-hidden="true" />
                (21) 99497-4132
              </a>
              <a href="mailto:wilsonmp2@gmail.com" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                <EnvelopeSimple size={14} className="w-3.5 h-3.5" aria-hidden="true" />
                wilsonmp2@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/wilsonmalafaia/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <LinkedinLogo weight="duotone" className="w-3.5 h-3.5" aria-hidden="true" />
                LinkedIn
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
            <ShieldCheck weight="duotone" size={14} className="text-primary flex-shrink-0" aria-hidden="true" />
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
