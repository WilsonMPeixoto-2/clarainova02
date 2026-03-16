import { Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 md:py-20 border-t border-[hsl(var(--border-subtle))]" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div className="flex flex-col gap-3 max-w-xl">
            <span className="text-xl font-bold text-foreground tracking-tight">CLARA</span>
            <p className="text-sm text-muted-foreground">
              Ferramenta interna de apoio ao uso do SEI-Rio e a rotinas administrativas na SME/RJ.
            </p>
            <p className="text-xs text-muted-foreground/80">Uso gratuito, com foco em orientação operacional e apoio à execução.</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/75">
              <a href="mailto:wilsonmp2@gmail.com" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                wilsonmp2@gmail.com
              </a>
            </div>

            <p className="text-caption">© {currentYear} CLARA. Todos os direitos reservados.</p>
          </div>

          <nav className="flex flex-wrap justify-start md:justify-center gap-6 md:gap-8" aria-label="Links do rodapé">
            <Link to="/#conhecimento" className="footer-link">Funcionalidades</Link>
            <Link to="/termos" className="footer-link">Termos de Serviço</Link>
            <Link to="/privacidade" className="footer-link">Política de Privacidade</Link>
            <a href="mailto:wilsonmp2@gmail.com" className="footer-link">Contato</a>
          </nav>
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
