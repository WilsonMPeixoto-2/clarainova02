import { useEffect, useRef } from "react";
import { FileSearch, MessagesSquare, BookCheck } from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Busca Inteligente",
    description: "Encontre normas, decretos e procedimentos com linguagem natural. A CLARA entende o contexto da sua dúvida.",
  },
  {
    icon: MessagesSquare,
    title: "Respostas Contextualizadas",
    description: "Orientações claras e objetivas, sempre com indicação das fontes documentais para conferência.",
  },
  {
    icon: BookCheck,
    title: "Passo a Passo",
    description: "Guias detalhados para procedimentos administrativos, adaptados ao seu nível de familiaridade.",
  },
];

const FeaturesSection = () => {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mark JS as enabled so cards get initial hidden state via CSS
    document.body.classList.add("js-enabled");

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    const cards = cardsRef.current?.querySelectorAll(".feature-card");
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="funcionalidades" className="relative py-24 px-6 noise-overlay">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Como a <span className="text-gradient-gold">CLARA</span> pode ajudar
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" style={{ lineHeight: "1.7" }}>
            Recursos projetados para simplificar seu trabalho com legislação e processos administrativos.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card glass-card rounded-xl p-6 group hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3 tracking-tight">
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
