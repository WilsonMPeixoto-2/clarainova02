import { Phone, Mail, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Left column — Developer Signature */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold tracking-[0.06em] text-gradient-gold">CLARA</h3>

            {/* Elegant signature card */}
            <div className="relative pl-4 border-l-2 border-primary/30 space-y-1.5">
              <p className="text-sm text-foreground/90 font-medium tracking-wide">
                Desenvolvido por{" "}
                <strong className="text-foreground font-semibold">Wilson M. Peixoto</strong>
                <span className="text-muted-foreground font-normal"> — SME/RJ</span>
              </p>
              <p className="text-xs text-primary/70 font-medium tracking-wider uppercase">
                Inovação para a Gestão Pública
              </p>
            </div>

            <div className="flex items-center gap-5 pt-1">
              <a href="tel:+5521994974132" className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors duration-300">
                <Phone className="w-3.5 h-3.5 group-hover:drop-shadow-[0_0_4px_hsl(38_65%_58%/0.5)] transition-all duration-300" />
                (21) 99497-4132
              </a>
              <a href="mailto:wilsonmp2@gmail.com" className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors duration-300">
                <Mail className="w-3.5 h-3.5 group-hover:drop-shadow-[0_0_4px_hsl(38_65%_58%/0.5)] transition-all duration-300" />
                wilsonmp2@gmail.com
              </a>
              <a href="#" className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors duration-300">
                <Linkedin className="w-3.5 h-3.5 group-hover:drop-shadow-[0_0_4px_hsl(38_65%_58%/0.5)] transition-all duration-300" />
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
