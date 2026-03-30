import { EnvelopeSimple, Sparkle, Phone, LinkedinLogo } from '@phosphor-icons/react';
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
              Desenvolvido por <span className="text-foreground font-medium">Wilson M. Peixoto</span> - SME/RJ
            </p>
            <p className="text-xs text-muted-foreground/80 mb-6">Inovação para a Gestão Pública</p>

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

          <div className="flex flex-row flex-wrap sm:flex-nowrap justify-between gap-12 sm:gap-16 w-full lg:w-auto">
            <nav className="flex flex-col gap-4" aria-label="Navegação">
              <p className="text-xs font-semibold tracking-widest text-[hsl(var(--gold-1))] uppercase mb-1">Navegação</p>
              <Link to="/#conhecimento" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Funcionalidades</Link>
              <Link to="/#faq" className="text-sm text-foreground/80 hover:text-foreground transition-colors">FAQ</Link>
            </nav>
            <nav className="flex flex-col gap-4" aria-label="Transparência">
              <p className="text-xs font-semibold tracking-widest text-[hsl(var(--gold-1))] uppercase mb-1">Transparência</p>
              <Link to="/termos" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="/privacidade" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Política de Privacidade</Link>
            </nav>
            <nav className="flex flex-col gap-4" aria-label="Contato">
              <p className="text-xs font-semibold tracking-widest text-[hsl(var(--gold-1))] uppercase mb-1">Contato</p>
              <a href="mailto:wilsonmp2@gmail.com" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Email direto</a>
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[hsl(var(--border-subtle))]">
          <div className="footer-note" role="note">
            <div className="relative flex-shrink-0 w-4 h-4 mt-0.5 flex items-center justify-center">
              <div className="absolute inset-0 bg-[hsl(var(--gold-1))] rounded-full blur-[4px] opacity-40"></div>
              <Sparkle weight="fill" size={12} className="text-[hsl(var(--gold-1))] relative z-10" aria-hidden="true" />
            </div>
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
