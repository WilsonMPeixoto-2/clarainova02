import claraHero from "@/assets/clara-hero.jpg";
import GoldParticles from "@/components/GoldParticles";

const quickQuestions = [
  "Como anexar documentos no SEI-Rio?",
  "Quais são os prazos da prestação de contas?",
  "Como solicitar diárias administrativas?",
  "Como organizar bloco de assinatura no SEI?",
  "Como encaminhar um processo administrativo?",
  "Como atualizar dados no SDP?",
  "Quais documentos são exigidos em licitações?",
  "Como validar uma assinatura digital?",
  "Como acompanhar a tramitação de protocolos?",
  "Como cadastrar contratos e aditivos?",
  "Como configurar notificações de prazos?",
  "Onde encontro modelos oficiais no sistema?",
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden noise-overlay">
      {/* Background image - visible on all sizes */}
      <div className="absolute inset-0 z-0">
        <img
          src={claraHero}
          alt=""
          className="w-full h-full object-cover"
          fetchPriority="high"
          aria-hidden="true"
        />
        {/* Overlay - mobile: vertical gradient for readability */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background: "linear-gradient(to bottom, hsl(220 20% 4% / 0.6) 0%, hsl(220 20% 4% / 0.4) 30%, hsl(220 20% 4% / 0.7) 70%, hsl(220 20% 4% / 0.9) 100%)",
          }}
        />
        {/* Overlay - desktop: left-heavy gradient so text side is dark */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background: "linear-gradient(to right, hsl(220 20% 4% / 0.85) 0%, hsl(220 20% 4% / 0.6) 35%, hsl(220 20% 4% / 0.2) 60%, transparent 80%)",
          }}
        />
      </div>

      {/* Energy streams */}
      <div className="absolute inset-0 z-[1]" aria-hidden="true">
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

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 pt-24 md:pt-28 pb-16 md:pb-24 min-h-screen flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
          {/* Text side - cols 1-7 */}
          <div className="md:col-span-7 space-y-6 md:space-y-8">
            <p className="hero-stagger-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Perguntas frequentes
            </p>

            <h1 className="hero-stagger-1 font-display font-bold tracking-[0.05em] text-5xl sm:text-6xl lg:text-7xl leading-[1.1]">
              <span className="text-gradient-gold">CLARA</span>
            </h1>

            <p className="hero-stagger-2 font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground leading-snug">
              <span className="text-primary">C</span>onsultora de{" "}
              <span className="text-primary">L</span>egislação e{" "}
              <span className="text-primary">A</span>poio a{" "}
              <span className="text-primary">R</span>otinas{" "}
              <span className="text-primary">A</span>dministrativas
            </p>

            <p className="hero-stagger-3 text-base sm:text-lg text-muted-foreground max-w-[42ch]" style={{ lineHeight: "1.7" }}>
              Sua assistente especializada em sistemas eletrônicos de informações e procedimentos administrativos. Orientações passo a passo com indicação de fontes documentais.
            </p>

            <div className="hero-stagger-4 flex flex-col sm:flex-row gap-4 pt-2">
              <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:scale-[1.02] transition-all glow-pulse flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                Iniciar conversa
              </button>
              <button className="px-6 py-3 rounded-lg border border-border text-foreground font-medium text-base hover:bg-surface-elevated hover:border-gold/30 transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
                Ver tópicos
              </button>
            </div>

            <p className="hero-stagger-4 text-xs text-muted-foreground max-w-[44ch]">
              Ao usar nossos serviços, você concorda com nossa{" "}
              <a href="#privacidade" className="text-primary hover:underline font-medium transition-colors">
                Política de Privacidade
              </a>
            </p>

            {/* Quick questions chips */}
            <div className="hero-stagger-5">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Perguntas rápidas
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="px-4 py-2 rounded-full text-sm font-medium glass-card text-muted-foreground hover:text-foreground hover:border-gold/40 hover:scale-[1.03] transition-all whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Empty right side - image shows through */}
          <div className="hidden md:block md:col-span-5" />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
};

export default HeroSection;
