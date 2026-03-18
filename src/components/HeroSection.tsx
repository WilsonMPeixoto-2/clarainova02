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
  Sparkles,
} from 'lucide-react';
import Balancer from 'react-wrap-balancer';

import { useChat } from '@/hooks/useChatStore';
import claraHeroFallback from '@/assets/clara-hero.jpg';
import claraHeroFallback4k from '@/assets/clara-hero-4k.jpg';
import claraHeroPremiumAvif from '@/assets/generated/clara-hero-premium.avif';
import claraHeroPremiumWebp from '@/assets/generated/clara-hero-premium.webp';
import claraHeroPortraitAvif from '@/assets/generated/clara-hero-portrait.avif';
import claraHeroPortraitWebp from '@/assets/generated/clara-hero-portrait.webp';
import { getUhdDisplaySnapshot, subscribeToUhdDisplay } from '@/lib/displayProfile';

const QUICK_QUESTIONS = [
  'Como incluir um documento externo no SEI-Rio?',
  'Como organizar um bloco de assinatura para outra unidade?',
  'Como enviar um processo para mais de uma unidade?',
  'Como atribuir um processo a um servidor da unidade?',
  'Como acompanhar um retorno programado no SEI-Rio?',
  'Como anexar um processo a outro processo no SEI-Rio?',
  'Como incluir comentário ou anotação em um processo?',
  'Como receber e assinar documentos em um bloco de assinatura?',
];

const QUICK_SCROLL_DISTANCE = 320;
const HERO_MOBILE_QUERY = '(max-width: 1023px)';

const HERO_SIGNAL_ITEMS = [
  {
    icon: ShieldCheck,
    label: 'Tom institucional',
    value: 'Respostas claras, elegantes e focadas na execução real do fluxo.',
  },
  {
    icon: Route,
    label: 'Fluxo orientado',
    value: 'Documentos, assinatura e tramitação em um percurso fácil de seguir.',
  },
  {
    icon: FileCheck2,
    label: 'Saída estruturada',
    value: 'Resumo executivo, etapas acionáveis e referências quando houver base.',
  },
];

const HERO_FLOATING_NOTES = [
  {
    title: 'Pergunta natural',
    description: 'Você descreve a situação do seu jeito. A CLARA transforma isso em uma resposta com acabamento profissional.',
  },
  {
    title: 'Próxima ação nítida',
    description: 'A resposta já nasce pronta para consulta rápida ou passo a passo completo, conforme a tarefa.',
  },
];

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
                <span className="badge-chip">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Design premium para apoio institucional
                </span>
                <span className="maintenance-chip">
                  <span className="maintenance-dot" aria-hidden="true" />
                  Base documental priorizada
                </span>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-editorial-stack">
                <p className="hero-label-line">CLARA / apoio ao SEI-Rio com acabamento editorial</p>
                <p className="hero-brand-wordmark">CLARA</p>
                <h1 className="hero-editorial-headline">
                  <Balancer>
                    Clareza institucional para operar o SEI-Rio com mais contexto, segurança e elegância.
                  </Balancer>
                </h1>
                <p className="hero-description text-body">
                  <Balancer>
                    A CLARA transforma dúvidas operacionais em respostas explicativas sobre documentos,
                    assinatura, tramitação e conferência de etapas, com visual mais nobre e leitura mais agradável.
                  </Balancer>
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-proof-grid" aria-label="Sinais da experiência CLARA">
                {HERO_SIGNAL_ITEMS.map(({ icon: Icon, label, value }) => (
                  <article key={label} className="hero-proof-card">
                    <span className="hero-proof-icon" aria-hidden="true">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="hero-proof-label">{label}</p>
                      <p className="hero-proof-value">{value}</p>
                    </div>
                  </article>
                ))}
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
                  Explorar a experiência
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="hero-trust-line">
                <span className="hero-inline-status">Documentos</span>
                <span className="hero-inline-status">Assinatura</span>
                <span className="hero-inline-status">Tramitação</span>
                <span className="hero-inline-status">Conferência operacional</span>
              </motion.div>

              <motion.p variants={itemVariants} className="hero-privacy text-caption">
                Ao usar a CLARA, você concorda com nossa{' '}
                <a href="/privacidade" className="text-primary hover:underline font-medium transition-colors duration-150">
                  Política de Privacidade
                </a>
                .
              </motion.p>

              <motion.div variants={itemVariants} className="hero-prompt-cluster">
                <div className="hero-prompt-toolbar">
                  <div className="space-y-1">
                    <p className="text-caption text-muted-foreground">Consultas em destaque</p>
                    <p className="hero-prompt-lead">
                      Exemplos reais do tipo de pergunta que a CLARA já foi desenhada para responder com excelência.
                    </p>
                  </div>
                  <div className="hero-prompt-actions">
                    <span className="hero-inline-status">Pronto para testar</span>
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

              <article className="hero-floating-note hero-floating-note-top">
                <p className="hero-floating-title">{HERO_FLOATING_NOTES[0]?.title}</p>
                <p className="hero-floating-description">{HERO_FLOATING_NOTES[0]?.description}</p>
              </article>

              <article className="hero-floating-note hero-floating-note-bottom">
                <p className="hero-floating-title">{HERO_FLOATING_NOTES[1]?.title}</p>
                <p className="hero-floating-description">{HERO_FLOATING_NOTES[1]?.description}</p>
              </article>

              <div className="hero-portrait-card">
                <div className="hero-portrait-toolbar">
                  <span>CLARA visual system</span>
                  <span>SEI-Rio focus</span>
                </div>
                <picture className="hero-portrait-picture">
                  <source type="image/avif" srcSet={claraHeroPortraitAvif} />
                  <source type="image/webp" srcSet={claraHeroPortraitWebp} />
                  <img
                    src={heroPoster}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="hero-portrait-image"
                  />
                </picture>
                <div className="hero-portrait-caption">
                  <p className="hero-portrait-kicker">Assistente institucional</p>
                  <p className="hero-portrait-copy">
                    Uma presença visual mais sofisticada para apresentar a CLARA como produto de confiança e alto valor percebido.
                  </p>
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
