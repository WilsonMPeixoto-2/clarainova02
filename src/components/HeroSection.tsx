import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import claraHero from "@/assets/clara-hero.jpg";
import GoldParticles from "@/components/GoldParticles";
import AuroraBackground from "@/components/AuroraBackground";
import HeroDebugOverlay from "@/components/HeroDebugOverlay";
import { useMagneticCursor } from "@/hooks/useMagneticCursor";
import { useIsMobile } from "@/hooks/use-mobile";

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

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(2px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const btnPrimaryRef = useMagneticCursor<HTMLButtonElement>();
  const btnSecondaryRef = useMagneticCursor<HTMLButtonElement>();
  const chipsRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0px", "24px"]);
  const auroraY = useTransform(scrollYProgress, [0, 1], ["0px", "16px"]);

  const scrollChips = (dir: "left" | "right") => {
    if (!chipsRef.current) return;
    const amount = dir === "left" ? -200 : 200;
    chipsRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} className="clara-hero relative min-h-svh overflow-hidden noise-overlay">
      {/* Background: parallax wrapper → scale wrapper → image */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="hero-bg-parallax"
          style={{ y: shouldReduceMotion || isMobile ? 0 : bgY }}
        >
          <div className="hero-bg-scale">
            <img
              src={claraHero}
              alt=""
              className="hero-clara-img w-full h-full object-cover"
              fetchPriority="high"
              aria-hidden="true"
            />
          </div>
        </motion.div>
        <div className="absolute inset-0 hero-overlay-directional z-[10]" />
      </div>

      {/* Energy glow layer — desktop only */}
      {!isMobile && <div className="hero-energy-glow" aria-hidden="true" />}

      {/* Aurora — desktop only */}
      {!isMobile && (
        <motion.div style={{ y: shouldReduceMotion ? 0 : auroraY }} className="absolute inset-0">
          <AuroraBackground />
        </motion.div>
      )}

      {/* Gold particles — desktop only */}
      {!isMobile && <GoldParticles />}

      <HeroDebugOverlay />

      {/* Content — card flutuante, sem grid */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-16 md:pb-24 min-h-[inherit] flex items-center">
        <div className="w-full">
          <motion.div
            className="hero-copy-column"
            variants={shouldReduceMotion ? undefined : containerVariants}
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate="visible"
          >
            <div className="hero-glass-card space-y-5 md:space-y-6">
              {/* Status badges */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-primary/25 bg-primary/10 text-primary">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  🚀 INTELIGÊNCIA ADMINISTRATIVA
                </span>
              </motion.div>

              <motion.div variants={itemVariants}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-border bg-surface/60 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  CLARA em manutenção e atualização. Volta em breve.
                </span>
              </motion.div>

              {/* CLARA title */}
              <motion.h1
                className="font-display font-extrabold tracking-[0.06em] text-6xl sm:text-7xl lg:text-8xl leading-[1] text-gradient-gold"
                variants={itemVariants}
              >
                CLARA
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="font-display text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold text-foreground leading-[1.25]"
              >
                <span className="text-primary">C</span>onsultora de{" "}
                <span className="text-primary">L</span>egislação e{" "}
                <span className="text-primary">A</span>poio a{" "}
                <span className="text-primary">R</span>otinas{" "}
                <span className="text-primary">A</span>dministrativas
              </motion.p>

              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg text-muted-foreground max-w-[42ch]"
                style={{ lineHeight: "1.7" }}
              >
                Sua assistente especializada em sistemas eletrônicos de informações e procedimentos administrativos. Orientações passo a passo com indicação de fontes documentais.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  ref={btnPrimaryRef}
                  className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-base transition-all glow-pulse flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                  Iniciar conversa
                </button>
                <button
                  ref={btnSecondaryRef}
                  className="px-6 py-3 rounded-full border border-border text-foreground font-medium text-base hover:bg-surface-elevated hover:border-gold/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
                  Ver tópicos
                </button>
              </motion.div>

              <motion.p variants={itemVariants} className="text-xs text-muted-foreground max-w-[44ch]">
                Ao usar nossos serviços, você concorda com nossa{" "}
                <a href="/privacidade" className="text-primary hover:underline font-medium transition-colors">
                  Política de Privacidade
                </a>
              </motion.p>

              {/* Quick questions */}
              <motion.div variants={itemVariants}>
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Perguntas rápidas
                </p>

                {/* Mobile: horizontal carousel */}
                <div className="md:hidden relative">
                  <div
                    ref={chipsRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide scroll-snap-x-mandatory pb-1"
                  >
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        className="flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium glass-card text-muted-foreground hover:text-foreground transition-all whitespace-nowrap"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => scrollChips("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground z-10"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => scrollChips("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground z-10"
                    aria-label="Próximo"
                  >
                    ›
                  </button>
                </div>

                {/* Desktop: vertical stack */}
                <div className="hidden md:flex flex-col gap-2 max-w-[520px]">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      className="w-fit px-4 py-2 rounded-full text-sm font-medium glass-card text-muted-foreground hover:text-foreground hover:border-gold/40 hover:scale-[1.02] transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
};

export default HeroSection;
