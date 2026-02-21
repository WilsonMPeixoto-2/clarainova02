import { useRef, useState, useEffect, useCallback } from "react";
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

const DESKTOP_INITIAL_COUNT = 5;

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const btnPrimaryRef = useMagneticCursor<HTMLButtonElement>();
  const btnSecondaryRef = useMagneticCursor<HTMLButtonElement>();
  const chipsRef = useRef<HTMLDivElement>(null);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [canPlayVideo, setCanPlayVideo] = useState(false);

  // Fallback: if onCanPlay never fires (e.g. browser policy), show video after timeout
  useEffect(() => {
    if (canPlayVideo || isMobile || shouldReduceMotion) return;
    const timer = setTimeout(() => setCanPlayVideo(true), 3000);
    return () => clearTimeout(timer);
  }, [canPlayVideo, isMobile, shouldReduceMotion]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0px", "24px"]);
  const auroraY = useTransform(scrollYProgress, [0, 1], ["0px", "16px"]);

  // IntersectionObserver: pause video when hero leaves viewport
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section || isMobile) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [isMobile]);

  const scrollChips = useCallback((dir: "left" | "right") => {
    if (!chipsRef.current) return;
    const amount = dir === "left" ? -200 : 200;
    chipsRef.current.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  const isDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "hero";
  const showVideo = !isMobile && !shouldReduceMotion;

  return (
    <section
      ref={sectionRef}
      className="clara-hero relative overflow-hidden noise-overlay"
      style={{ minHeight: "var(--hero-min-h, 100svh)" }}
    >
      {/* LAYER 1: Base/Ambiente — full-bleed dark background */}
      <div className="hero-base-layer" aria-hidden="true">
        {/* Aurora — desktop only */}
        {!isMobile && (
          <motion.div
            style={{ y: shouldReduceMotion ? 0 : auroraY }}
            className="absolute inset-0"
          >
            <AuroraBackground />
          </motion.div>
        )}

        {/* Energy glow — desktop only */}
        {!isMobile && <div className="hero-energy-glow" />}

        {/* Gold particles — desktop only */}
        {!isMobile && <GoldParticles />}
      </div>

      {/* LAYER 2: Media Stage — right-anchored focal video (desktop only) */}
      {showVideo && (
        <div
          className="hero-media-stage"
          style={isDebug ? { outline: "2px dashed hsl(210 80% 60%)" } : undefined}
        >
          {isDebug && (
            <span className="absolute top-3 right-3 z-50 text-xs font-mono bg-blue-900/80 text-blue-300 px-2 py-1 rounded">
              media-stage
            </span>
          )}
          <motion.div
            className="hero-media-motion"
            style={{ y: shouldReduceMotion ? 0 : mediaY }}
          >
            <video
              ref={videoRef}
              src="/videos/clara-hero.mp4"
              poster={claraHero}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className={`hero-clara-video transition-opacity duration-1000 ${canPlayVideo ? "opacity-100" : "opacity-0"}`}
              onCanPlay={() => setCanPlayVideo(true)}
              onLoadedData={() => setCanPlayVideo(true)}
              aria-hidden="true"
            />
          </motion.div>
        </div>
      )}

      {/* Mobile poster — static image behind content */}
      {isMobile && (
        <div className="absolute inset-0 z-[5]" aria-hidden="true">
          <img
            src={claraHero}
            alt=""
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          {/* Dark overlay for text legibility */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                hsl(var(--background) / 0.55) 0%,
                hsl(var(--background) / 0.35) 30%,
                hsl(var(--background) / 0.65) 65%,
                hsl(var(--background) / 0.9) 100%
              )`,
            }}
          />
        </div>
      )}

      <HeroDebugOverlay />

      {/* LAYER 3: Content — copy column left-aligned */}
      <div
        className="relative z-20 mx-auto w-full max-w-[1400px] px-6 lg:px-10 pt-24 md:pt-28 pb-16 md:pb-24 flex items-center"
        style={{ minHeight: "inherit" }}
      >
        <div className="w-full">
          <motion.div
            className="hero-copy-column"
            variants={shouldReduceMotion ? undefined : containerVariants}
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate="visible"
            style={isDebug ? { outline: "2px dashed hsl(120 60% 50%)" } : undefined}
          >
            {isDebug && (
              <span className="absolute -top-6 left-0 z-50 text-xs font-mono bg-green-900/80 text-green-300 px-2 py-1 rounded">
                copy-safe-zone
              </span>
            )}
            <div className="hero-copy-surface space-y-3 md:space-y-4">
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
                className="font-display font-extrabold tracking-[0.04em] text-[2.5rem] leading-[1] text-gradient-gold"
                variants={itemVariants}
              >
                CLARA
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="font-display text-[1.2rem] font-bold text-foreground leading-[1.35]"
              >
                <span className="text-primary">C</span>onsultora de{" "}
                <span className="text-primary">L</span>egislação e{" "}
                <span className="text-primary">A</span>poio a{" "}
                <span className="text-primary">R</span>otinas{" "}
                <span className="text-primary">A</span>dministrativas
              </motion.p>

              <motion.p
                variants={itemVariants}
                className="text-[0.8rem] text-muted-foreground max-w-[36ch] leading-[1.6]"
              >
                Sua assistente especializada em sistemas eletrônicos de informações e procedimentos administrativos. Orientações passo a passo com indicação de fontes documentais.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-row gap-3 pt-1">
                <button
                  ref={btnPrimaryRef}
                  className="flex-1 max-w-[200px] py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-[0.8rem] transition-all glow-pulse flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                  Iniciar conversa
                </button>
                <button
                  ref={btnSecondaryRef}
                  className="flex-1 max-w-[200px] py-2.5 rounded-full border border-border text-foreground font-medium text-[0.8rem] hover:bg-surface-elevated hover:border-gold/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
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

                {/* Desktop: vertical stack with "Ver mais" */}
                <div className="hidden md:flex flex-col gap-2 max-w-[520px]">
                  {(showAllQuestions ? quickQuestions : quickQuestions.slice(0, DESKTOP_INITIAL_COUNT)).map((q, i) => (
                    <button
                      key={i}
                      className="w-fit px-4 py-2 rounded-full text-sm font-medium glass-card text-muted-foreground hover:text-foreground hover:border-gold/40 hover:scale-[1.02] transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                      {q}
                    </button>
                  ))}
                  {!showAllQuestions && quickQuestions.length > DESKTOP_INITIAL_COUNT && (
                    <button
                      onClick={() => setShowAllQuestions(true)}
                      className="w-fit px-4 py-2 rounded-full text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-all"
                    >
                      Ver mais perguntas ({quickQuestions.length - DESKTOP_INITIAL_COUNT})
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none" />
    </section>
  );
};

export default HeroSection;
