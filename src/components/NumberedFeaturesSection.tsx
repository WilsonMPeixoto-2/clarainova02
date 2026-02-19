import { useEffect, useRef } from "react";

const features = [
  {
    number: "01",
    title: "Pesquisa sem ruído",
    subtitle: "Normas, prazos e procedimentos em segundos",
    description: "Interprete dúvidas em linguagem natural e vá direto ao ponto com contexto administrativo.",
    bullets: [
      "Leitura semântica de consultas",
      "Prioriza fontes documentais",
      "Histórico e continuidade de contexto",
    ],
  },
  {
    number: "02",
    title: "Respostas com fundamento",
    subtitle: "Objetivo quando precisa, didático quando importa",
    description: "Escolha entre respostas diretas ou explicativas, mantendo rastreabilidade e transparência.",
    bullets: [
      "Modo Direto ou Didático",
      "Transparência de fonte",
      "Diagnóstico amigável de erros",
    ],
  },
  {
    number: "03",
    title: "Execução orientada",
    subtitle: "Do entendimento à ação com menos retrabalho",
    description: "Transforme orientação em execução com fluxo claro, linguagem simples e cadência profissional.",
    bullets: [
      "Fluxos acionáveis",
      "Padronização operacional",
      "Menos ambiguidade na rotina",
    ],
  },
];

const NumberedFeaturesSection = () => {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    <section className="relative py-24 px-6 noise-overlay">
      <div ref={cardsRef} className="max-w-6xl mx-auto space-y-8">
        {features.map((feature, i) => (
          <div
            key={i}
            className="feature-card glass-card rounded-2xl p-8 md:p-10 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <span className="font-display text-5xl sm:text-6xl font-extrabold text-gradient-gold opacity-40 leading-none">
              {feature.number}
            </span>
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-primary font-medium text-sm mb-3">{feature.subtitle}</p>
              <p className="text-muted-foreground text-base mb-5" style={{ lineHeight: "1.7" }}>
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.bullets.map((bullet, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <button className="mt-6 px-5 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:border-gold/30 hover:bg-surface-elevated transition-all">
                Explorar no chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NumberedFeaturesSection;
