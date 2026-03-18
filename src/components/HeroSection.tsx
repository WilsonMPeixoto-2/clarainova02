import { useCallback, useEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import Balancer from 'react-wrap-balancer';

import { useChat } from '@/hooks/useChatStore';
import claraHeroFallback from '@/assets/clara-hero.jpg';
import claraHeroFallback4k from '@/assets/clara-hero-4k.jpg';
import claraHeroPremiumAvif from '@/assets/generated/clara-hero-premium.avif';
import claraHeroPremiumWebp from '@/assets/generated/clara-hero-premium.webp';
import { getUhdDisplaySnapshot, subscribeToUhdDisplay } from '@/lib/displayProfile';

const QUICK_QUESTIONS = [
  'Como incluir um documento externo no SEI-Rio?',
  'Como organizar um bloco de assinatura para outra unidade?',
  'Como enviar um processo para mais de uma unidade?',
];

const QUICK_SCROLL_DISTANCE = 320;
const HERO_MOBILE_QUERY = '(max-width: 1023px)';

function subscribeToHeroViewport(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia(HERO_MOBILE_QUERY);

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }

  mediaQuery.addListener(onChange);
  return () => mediaQuery.removeListener(onChange);
}

function getHeroViewportSnapshot() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia(HERO_MOBILE_QUERY).matches;
}

const HeroSection = () => {
  const { openChat } = useChat();
  const prefersReducedMotion = useReducedMotion();
  const heroSectionRef = useRef<HTMLElement>(null);
  const quickCarouselRef = useRef<HTMLDivElement>(null);
  const magneticRafRef = useRef<number | null>(null);

  const isHeroMobile = useSyncExternalStore(
    subscribeToHeroViewport,
    getHeroViewportSnapshot,
    () => false,
  );
  const isUhdDisplay = useSyncExternalStore(
    subscribeToUhdDisplay,
    getUhdDisplaySnapshot,
    () => false,
  );

  const heroMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('hero') === 'video'
    ? 'video'
    : 'image';
  const useVideoHero = heroMode === 'video' && !isHeroMobile && !prefersReducedMotion;
  const heroPoster = isUhdDisplay ? claraHeroFallback4k : claraHeroFallback;
  const currentVideoSrc = isUhdDisplay ? '/videos/clara-hero-4k.mp4' : '/videos/clara-hero.mp4';
  const shouldAnimate = !prefersReducedMotion;

  const containerVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: isHeroMobile ? 0.08 : 0.1,
        delayChildren: 0.08,
        duration: 0.72,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.74,
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

  const handleMagneticMove = useCallback((event: MouseEvent<HTMLButtonElement>) => {
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
  }, [isHeroMobile, shouldAnimate]);

  const handleMagneticLeave = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;
    target.style.setProperty('--magnetic-x', '0px');
    target.style.setProperty('--magnetic-y', '0px');
  }, []);

  useEffect(() => {
    return () => {
      if (magneticRafRef.current) cancelAnimationFrame(magneticRafRef.current);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start start', 'end start'],
  });
  const textParallaxY = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const mediaParallaxY = useTransform(scrollYProgress, [0, 1], [0, 56]);

  return (
    <section ref={heroSectionRef} className="clara-hero">
      <div className="hero-base-layer" aria-hidden="true">
        <div className="hero-energy-glow" />
        <div className="cinematic-noise" />
      </div>

      <div className="hero-shell" data-hero-mode={heroMode}>
        <div className="hero-media-stage" aria-hidden="true">
          <motion.div
            className="hero-media-motion"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { duration: 1.08, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
            style={shouldAnimate ? { y: mediaParallaxY } : undefined}
          >
            {useVideoHero ? (
              <video
                src={currentVideoSrc}
                poster={heroPoster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="hero-video-layer is-active hero-media-backdrop"
              />
            ) : (
              <picture className="hero-backdrop-picture">
                <source type="image/avif" srcSet={claraHeroPremiumAvif} />
                <source type="image/webp" srcSet={claraHeroPremiumWebp} />
                <img
                  src={heroPoster}
                  alt=""
                  className="hero-clara-video hero-media-backdrop"
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
            )}
          </motion.div>
        </div>

        <motion.div
          className="hero-content-layer"
          style={shouldAnimate ? { y: textParallaxY } : undefined}
        >
          <div className="hero-copy-column">
            <motion.div
              variants={containerVariants}
              initial={shouldAnimate ? 'hidden' : 'visible'}
              animate="visible"
              className="hero-copy-surface"
            >
              <motion.div variants={itemVariants} className="hero-chip-row">
                <span className="badge-chip">Apoio ao SEI-Rio</span>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-editorial-stack">
                <p className="hero-label-line">Ferramenta de apoio à rotina administrativa</p>
                <p className="hero-brand-wordmark">CLARA</p>
                <h1 className="hero-editorial-headline">
                  <Balancer>
                    Tire dúvidas sobre o uso do SEI-Rio.
                  </Balancer>
                </h1>
                <p className="hero-description text-body">
                  <Balancer>
                    A CLARA responde perguntas sobre documentos, assinatura, tramitação
                    e etapas operacionais do sistema.
                  </Balancer>
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-actions flex flex-col sm:flex-row gap-4 pt-1">
                <button
                  className="btn-cinematic-glow hero-cta-button hero-cta-primary type-label flex items-center justify-center gap-2"
                  onClick={() => openChat()}
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  Abrir a CLARA
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button
                  onClick={() => {
                    const featuresSection = document.getElementById('conhecimento') ?? document.getElementById('features');
                    featuresSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-clara-secondary hero-cta-button hero-cta-secondary type-label flex items-center justify-center gap-2"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                >
                  <BookOpen size={18} aria-hidden="true" />
                  Ver funcionalidades
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-trust-line">
                <span className="hero-inline-status">Documentos</span>
                <span className="hero-inline-status">Assinatura</span>
                <span className="hero-inline-status">Tramitação</span>
                <span className="hero-inline-status">Conferência operacional</span>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-prompt-cluster">
                <div className="hero-prompt-toolbar">
                  <div className="space-y-1">
                    <p className="text-caption text-muted-foreground">Exemplos de perguntas</p>
                    <p className="hero-prompt-lead">
                      Consultas frequentes que a CLARA pode apoiar.
                    </p>
                  </div>
                  <div className="hero-prompt-actions">
                    <div className="hero-carousel-controls" aria-label="Navegação das perguntas rápidas">
                      <button
                        type="button"
                        className="quick-carousel-nav"
                        onClick={() => scrollQuickCarousel('prev')}
                        aria-label="Ver pergunta anterior"
                      >
                        <ChevronLeft size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="quick-carousel-nav"
                        onClick={() => scrollQuickCarousel('next')}
                        aria-label="Ver próxima pergunta"
                      >
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="quick-carousel-shell">
                  <div
                    ref={quickCarouselRef}
                    className="quick-carousel"
                    role="list"
                    aria-label="Perguntas rápidas"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        scrollQuickCarousel('next');
                      }
                      if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        scrollQuickCarousel('prev');
                      }
                    }}
                  >
                    {QUICK_QUESTIONS.map((question, index) => (
                      <div key={question} role="listitem" className="quick-chip-item">
                        <button
                          type="button"
                          className="quick-chip"
                          style={{ animationDelay: `${0.05 * index}s` }}
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
      </div>
    </section>
  );
};

export default HeroSection;
