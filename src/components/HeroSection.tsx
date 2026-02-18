import claraHero from "@/assets/clara-hero.jpg";
import GoldParticles from "@/components/GoldParticles";

const quickQuestions = [
  "Como declarar MEI no IRPF?",
  "Preciso declarar investimentos?",
  "O que é malha fina?",
  "Quais despesas posso deduzir?",
  "Como retificar uma declaração?",
  "Prazo para declarar IR 2026?",
  "Crypto precisa declarar?",
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden noise-overlay">
      {/* Energy streams */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div
          className="energy-breathe absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(42 78% 55% / 0.08), transparent 70%)",
          }}
        />
        <div
          className="energy-breathe absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(42 90% 65% / 0.06), transparent 70%)",
            animationDelay: "8s",
          }}
        />
      </div>

      <GoldParticles />

      {/* Split grid layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Text side - cols 1-5 */}
        <div className="lg:col-span-5 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-24 lg:py-0 relative z-10">
          {/* Strong dark scrim behind text - desktop only (mobile uses full-image overlay) */}
          <div
            className="absolute inset-0 z-0 hidden lg:block"
            style={{
              background: "linear-gradient(to right, hsl(220 20% 4% / 0.95), hsl(220 20% 4% / 0.85))",
            }}
          />

          <div className="relative z-10 max-w-lg">
            <h1 className="hero-stagger-1 font-display font-bold tracking-[0.05em] text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mb-6">
              <span className="text-gradient-gold">CLARA</span>
            </h1>

            <p className="hero-stagger-2 font-display text-xl sm:text-2xl font-semibold text-foreground leading-snug mb-4">
              Consultora Legal e Assistente de Regulamentação Avançada
            </p>

            <p className="hero-stagger-3 text-base sm:text-lg text-muted-foreground leading-relaxed mb-8" style={{ lineHeight: "1.7" }}>
              Sua assistente de inteligência artificial especializada em legislação tributária brasileira. Respostas precisas, atualizadas e acessíveis.
            </p>

            <div className="hero-stagger-4 flex flex-wrap gap-3 mb-10">
              <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:scale-[1.02] transition-all glow-pulse">
                Iniciar conversa
              </button>
              <button className="px-6 py-3 rounded-lg border border-border text-foreground font-medium text-base hover:bg-surface-elevated hover:border-gold/30 transition-all">
                Saiba mais
              </button>
            </div>

            {/* Chips */}
            <div className="hero-stagger-5">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Perguntas frequentes
              </p>
              <div className="relative">
                <div className="chips-scroll flex gap-2 overflow-x-auto pb-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium glass-card text-muted-foreground hover:text-foreground hover:border-gold/40 hover:scale-[1.03] transition-all whitespace-nowrap min-w-fit"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                {/* Fade indicators */}
                <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

      {/* Image side - background on mobile, grid col on desktop */}
        <div className="absolute inset-0 lg:relative lg:col-span-7 z-0 lg:z-auto">
          {/* Gradient mask - stronger on mobile for text readability */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(to bottom, hsl(220 20% 4% / 0.7) 0%, hsl(220 20% 4% / 0.5) 40%, hsl(220 20% 4% / 0.3) 100%)",
            }}
          />
          {/* Desktop-only directional mask */}
          <div
            className="absolute inset-0 z-10 hidden lg:block"
            style={{
              background: "linear-gradient(to right, hsl(220 20% 4% / 0.85) 0%, hsl(220 20% 4% / 0.3) 25%, transparent 50%)",
            }}
          />
          <img
            src={claraHero}
            alt="CLARA - Assistente de IA"
            className="absolute inset-0 w-full h-full object-cover object-[65%_20%]"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
