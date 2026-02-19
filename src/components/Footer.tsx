import { Phone, Mail, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Left column */}
          <div className="space-y-3">
            <h3 className="font-display text-xl font-bold text-gradient-gold">CLARA</h3>
            <p className="text-sm text-foreground">
              Desenvolvido por <strong>Wilson M. Peixoto</strong> - SME/RJ
            </p>
            <p className="text-xs text-muted-foreground">
              Inovação para a Gestão Pública
            </p>
            <div className="flex items-center gap-5 pt-2">
              <a href="tel:+5521994974132" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-3.5 h-3.5" />
                (21) 99497-4132
              </a>
              <a href="mailto:wilsonmp2@gmail.com" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5" />
                wilsonmp2@gmail.com
              </a>
              <a href="#" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            </div>
          </div>

          {/* Right nav */}
          <nav className="flex items-start gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Sobre</a>
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Serviço</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </nav>
        </div>

        <p className="text-xs text-muted-foreground mb-8">
          © 2026 CLARA. Todos os direitos reservados.
        </p>

        <div className="border-t border-border/50 pt-6">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl" style={{ lineHeight: "1.7" }}>
            A CLARA é uma ferramenta de apoio e suas orientações não substituem a consulta direta às normas oficiais ou assessoria
            jurídica especializada. Não possui caráter oficial ou vinculante. Podem conter imprecisões ou informações desatualizadas.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
