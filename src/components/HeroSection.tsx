import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { BookOpen, MessageCircle, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/hooks/useChatStore';
import claraHeroFallback from '@/assets/clara-hero.jpg';

const QUICK_QUESTIONS = [
  'Como anexar documentos no SEI-Rio?',
  'Quais são os prazos da prestação de contas?',
  'Como solicitar diárias administrativas?',
  'Como organizar bloco de assinatura no SEI?',
  'Como encaminhar um processo administrativo?',
  'Como atualizar dados no SDP?',
  'Quais documentos são exigidos em licitações?',
  'Como validar uma assinatura digital?',
  'Como acompanhar a tramitação de protocolos?',
  'Como cadastrar contratos e aditivos?',
  'Como configurar notificações de prazos?',
  'Onde encontro modelos oficiais no sistema?',
];

const QUICK_SCROLL_DISTANCE = 320;
const HERO_MOBILE_QUERY = '(max-width: 899px)';

const HeroSection = () => {
  const isMobile = useIsMobile();
  const { openChat } = useChat();
  const prefersReducedMotion = useReducedMotion();
  const heroSectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const quickCarouselRef = useRef<HTMLDivElement>(null);
  const magneticRafRef = useRef<number | null>(null);

  const [isHeroMobile, setIsHeroMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return isMobile;
    return window.matchMedia(HERO_MOBILE_QUERY).matches;
  });

  const [videoErrorLevel, setVideoErrorLevel] = useState(0);

  const desktopVideoSources = [
    '/videos/clara-hero.mp4',
  ];

  const mobileVideoSources = [
    '/videos/clara-hero.mp4',
  ];

  const currentSources = isHeroMobile ? mobileVideoSources : desktopVideoSources;
  const currentVideoSrc = currentSources[Math.min(videoErrorLevel, currentSources.length - 1)];

  useEffect(() => { setVideoErrorLevel(0); }, [isHeroMobile]);

  const handleVideoError = () => {
    if (videoErrorLevel < currentSources.length - 1) {
      setVideoErrorLevel((prev) => prev + 1);
    }
  };

  const shouldAnimate = !prefersReducedMotion && !isHeroMobile;

  const containerVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: isHeroMobile ? 0.1 : 0.12,
        delayChildren: 0.06,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isHeroMobile ? 0.55 : 0.75,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const scrollQuickCarousel = useCallback((direction: 'prev' | 'next') => {
    const el = quickCarouselRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'next' ? QUICK_SCROLL_DISTANCE : -QUICK_SCROLL_DISTANCE,
      behavior: 'smooth',
    });
  }, []);

  const handleMagneticMove = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!shouldAnimate || isHeroMobile || !window.matchMedia('(pointer:fine)').matches) return;
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const offsetX = ((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 12;
      const offsetY = ((event.clientY - (rect.top + rect.height / 2)) / rect.height) * 12;

      if (magneticRafRef.current) cancelAnimationFrame(magneticRafRef.current);
      magneticRafRef.current = requestAnimationFrame(() => {
        target.style.setProperty('--magnetic-x', `${offsetX.toFixed(2)}px`);
        target.style.setProperty('--magnetic-y', `${offsetY.toFixed(2)}px`);
      });
    },
    [isHeroMobile, shouldAnimate],
  );

  const handleMagneticLeave = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;
    target.style.setProperty('--magnetic-x', '0px');
    target.style.setProperty('--magnetic-y', '0px');
  }, []);

  // Performance Video Observer
  useEffect(() => {
    if (!videoRef.current || !heroSectionRef.current || isHeroMobile || prefersReducedMotion) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(heroSectionRef.current);
    return () => observer.disconnect();
  }, [isHeroMobile, prefersReducedMotion]);

  useEffect(() => {
    return () => { if (magneticRafRef.current) cancelAnimationFrame(magneticRafRef.current); };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      setIsHeroMobile(isMobile);
      return;
    }
    const mediaQuery = window.matchMedia(HERO_MOBILE_QUERY);
    const syncViewport = () => setIsHeroMobile(mediaQuery.matches);
    syncViewport();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncViewport);
      return () => mediaQuery.removeEventListener('change', syncViewport);
    }
    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, [isMobile]);

  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start start', 'end start'],
  });
  const textParallaxY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const mediaParallaxY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={heroSectionRef} className="clara-hero">
      {/* 1. Base Layer */}
      <div className="hero-base-layer" aria-hidden="true">
        <div className="hero-energy-glow" />
        <div className="cinematic-noise" />
      </div>

      {/* 2. Media Layer */}
      {!isHeroMobile && (
        <div className="hero-media-stage" aria-hidden="true">
          <motion.div
            className="hero-media-motion"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
            style={shouldAnimate ? { y: mediaParallaxY } : undefined}
          >
            {shouldAnimate ? (
              <video
                ref={videoRef}
                src={currentVideoSrc}
                poster={claraHeroFallback}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onError={handleVideoError}
                className="hero-clara-video"
              />
            ) : (
              <img
                src={claraHeroFallback}
                alt=""
                className="hero-clara-video"
              />
            )}
          </motion.div>
        </div>
      )}

      {/* Mobile: static poster fallback */}
      {isHeroMobile && (
        <div className="absolute inset-0 z-[5]" aria-hidden="true">
          <img
            src={claraHeroFallback}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: '78% 20%' }}
            fetchPriority="high"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom,
                hsl(var(--background) / 0.35) 0%,
                hsl(var(--background) / 0.10) 20%,
                hsl(var(--background) / 0.10) 45%,
                hsl(var(--background) / 0.50) 70%,
                hsl(var(--background) / 0.85) 100%)`,
            }}
          />
        </div>
      )}

      {/* 3. Content Layer */}
      <motion.div
        className="hero-content-layer"
        style={shouldAnimate ? { y: textParallaxY } : undefined}
      >
        <div className="hero-copy-column">
          <motion.div
            variants={containerVariants}
            initial={shouldAnimate ? 'hidden' : 'visible'}
            animate="visible"
            className="hero-copy-surface space-y-6 md:space-y-9"
          >
            <motion.div variants={itemVariants}>
              <span className="badge-chip">
                <motion.span
                  animate={shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
                  transition={shouldAnimate ? { duration: 2, repeat: Infinity } : undefined}
                  className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)]"
                />
                <Sparkles className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                Inteligência Administrativa
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="maintenance-chip" role="status" aria-live="polite">
                <span className="maintenance-dot animate-pulse-subtle" aria-hidden="true" />
                CLARA em manutenção e atualização. Volta em breve.
              </div>
            </motion.div>

            <motion.h1 variants={itemVariants} className="hero-title-mask">
              <motion.span
                className="hero-title inline-block hero-title-reveal"
                initial={shouldAnimate ? { opacity: 0, filter: 'blur(4px)', clipPath: 'inset(0 100% 0 0)' } : false}
                animate={{ opacity: 1, filter: 'blur(0px)', clipPath: 'inset(0 0% 0 0)' }}
                transition={shouldAnimate ? { duration: 0.68, delay: 0.16, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
              >
                CLARA
              </motion.span>
            </motion.h1>

            <motion.p variants={itemVariants} className="hero-subtitle text-glow">
              <span className="text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">C</span>onsultora de{' '}
              <span className="text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">L</span>egislação e{' '}
              <span className="text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">A</span>poio a{' '}
              <span className="text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">R</span>otinas{' '}
              <span className="text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">A</span>dministrativas
            </motion.p>

            <motion.p variants={itemVariants} className="text-body max-w-[50ch]">
              Sua assistente especializada em sistemas eletrônicos de informações e procedimentos
              administrativos. Orientações passo a passo com indicação de fontes documentais.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-3">
              <button
                className="btn-cinematic-glow hero-cta-button type-label flex items-center justify-center gap-2"
                onClick={() => openChat()}
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
              >
                <MessageCircle size={20} aria-hidden="true" />
                Iniciar conversa
              </button>
              <button
                onClick={() => {
                  const featuresSection = document.getElementById('conhecimento') ?? document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-clara-secondary hero-cta-button type-label flex items-center justify-center gap-2"
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
              >
                <BookOpen size={20} aria-hidden="true" />
                Ver tópicos
              </button>
            </motion.div>

            <motion.p variants={itemVariants} className="text-caption max-w-[44ch]">
              Ao usar nossos serviços, você concorda com nossa{' '}
              <a href="/privacidade" className="text-primary hover:underline font-medium transition-colors duration-150">
                Política de Privacidade
              </a>
            </motion.p>

            <motion.div variants={itemVariants} className="pt-5">
              <p className="text-caption mb-2 text-muted-foreground">Perguntas rápidas</p>
              <div className="quick-carousel-shell">
                <div
                  ref={quickCarouselRef}
                  className="quick-carousel"
                  role="list"
                  aria-label="Perguntas rápidas"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight') { event.preventDefault(); scrollQuickCarousel('next'); }
                    if (event.key === 'ArrowLeft') { event.preventDefault(); scrollQuickCarousel('prev'); }
                  }}
                >
                  {QUICK_QUESTIONS.map((question, i) => (
                    <div key={question} role="listitem" className="quick-chip-item">
                      <button
                        type="button"
                        className="quick-chip"
                        style={{ animationDelay: `${0.05 * i}s` }}
                        onClick={() => openChat(question)}
                      >
                        {question}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
