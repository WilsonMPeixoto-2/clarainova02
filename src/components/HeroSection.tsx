import { useCallback, useEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  MessageCircle,
  Route,
  ShieldCheck,
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
  'Como atribuir um processo a um servidor da unidade?',
];

const QUICK_SCROLL_DISTANCE = 320;
const HERO_MOBILE_QUERY = '(max-width: 1023px)';

const HERO_PANEL_ITEMS = [
  {
    icon: FileCheck2,
    title: 'Documentos e anexos',
    description: 'Inclusão de documento interno ou externo e revisão dos campos principais.',
  },
  {
    icon: Route,
    title: 'Tramitação e acompanhamento',
    description: 'Encaminhamento, retorno programado e entendimento do fluxo entre unidades.',
  },
  {
    icon: ShieldCheck,
    title: 'Assinatura e conferência',
    description: 'Blocos de assinatura, revisão de etapas e checagens antes do envio.',
  },
];

const HERO_RESPONSE_MODES = ['Resposta direta', 'Passo a passo', 'Base disponível'];

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
                <span className="maintenance-chip">
                  <span className="maintenance-dot" aria-hidden="true" />
                  Base documental disponível
                </span>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-editorial-stack">
                <p className="hero-label-line">Inovação pública aplicada à rotina administrativa</p>
                <p className="hero-brand-wordmark">CLARA</p>
                <h1 className="hero-editorial-headline">
                  <Balancer>
                    Apoio claro para documentos, assinatura e tramitação no SEI-Rio.
                  </Balancer>
                </h1>
                <p className="hero-description text-body">
                  <Balancer>
                    A CLARA ajuda a responder dúvidas operacionais do dia a dia com linguagem direta,
                    passo a passo quando necessário e foco no uso real do sistema.
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
                  Conhecer funcionalidades
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

          <motion.div
            className="hero-visual-column"
            initial={shouldAnimate ? { opacity: 0, x: 28 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={shouldAnimate ? { duration: 0.9, delay: 0.16, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
            aria-hidden="true"
          >
            <div className="hero-visual-shell">
              <div className="hero-visual-halo" />

              <div className="hero-functional-panel">
                <div className="hero-functional-header">
                  <p className="hero-functional-kicker">Como a CLARA ajuda</p>
                  <p className="hero-functional-title">Consultas frequentes do dia a dia no SEI-Rio</p>
                </div>

                <div className="hero-functional-list" aria-label="Áreas de apoio da CLARA">
                  {HERO_PANEL_ITEMS.map(({ icon: Icon, title, description }) => (
                    <article key={title} className="hero-functional-item">
                      <span className="hero-functional-icon" aria-hidden="true">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="hero-functional-item-title">{title}</p>
                        <p className="hero-functional-item-description">{description}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hero-functional-example">
                  <p className="hero-functional-example-label">Exemplo de uso</p>
                  <p className="hero-functional-example-question">
                    Como incluir um documento externo no SEI-Rio?
                  </p>
                  <div className="hero-functional-tags">
                    {HERO_RESPONSE_MODES.map((mode) => (
                      <span key={mode} className="hero-inline-status">
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
