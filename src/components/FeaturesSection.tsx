import { useEffect, useRef } from "react";
import { Scale, FileText, Shield, Brain, Search, Clock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "IA Especializada",
    description: "Treinada com legislação tributária brasileira atualizada para respostas precisas.",
  },
  {
    icon: Scale,
    title: "Legislação em Dia",
    description: "Base de conhecimento atualizada com as últimas normas da Receita Federal.",
  },
  {
    icon: FileText,
    title: "Análise de Documentos",
    description: "Envie documentos fiscais e receba orientações detalhadas.",
  },
  {
    icon: Shield,
    title: "Privacidade Total",
    description: "Seus dados são protegidos com criptografia de ponta a ponta.",
  },
  {
    icon: Search,
    title: "Busca Inteligente",
    description: "Pesquise qualquer tema tributário com linguagem natural.",
  },
  {
    icon: Clock,
    title: "Disponível 24/7",
    description: "Acesse a qualquer momento, sem filas ou agendamentos.",
  },
];

const FeaturesSection = () => {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    const cards = cardsRef.current?.querySelectorAll(".fade-up-observe");
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="funcionalidades" className="relative py-24 px-6 noise-overlay">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Por que usar a <span className="text-gradient-gold">CLARA</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" style={{ lineHeight: "1.7" }}>
            Tecnologia de ponta aplicada à legislação tributária brasileira, com foco em precisão e acessibilidade.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="fade-up-observe glass-card rounded-xl p-6 group hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <feature.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed" style={{ lineHeight: "1.7" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
