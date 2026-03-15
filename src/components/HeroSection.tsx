import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type SyntheticEvent } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { BookOpen, ChevronLeft, ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { useChat } from '@/hooks/useChatStore';
import claraHeroFallback from '@/assets/clara-hero.jpg';
import claraHeroFallback4k from '@/assets/clara-hero-4k.jpg';
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
  'Como localizar o tipo de processo correto para iniciar um caso?',
  'Como revisar anexos antes de encaminhar um processo?',
];
const HERO_QUICK_QUESTION_PREVIEW = QUICK_QUESTIONS.slice(0, 8);

const QUICK_SCROLL_DISTANCE = 320;
const HERO_MOBILE_QUERY = '(max-width: 899px)';
const VIDEO_LOOP_CROSSFADE_SECONDS = 1.15;
const HERO_SIGNAL_ITEMS = [
  {
    icon: BookOpen,
    label: 'Consultas no SEI-Rio',
    value: 'Etapas, telas e ações frequentes do sistema',
  },
  {
    icon: ShieldCheck,
    label: 'Conferência operacional',
    value: 'Documentos, anexos e validações antes do envio',
  },
  {
    icon: MessageCircle,
    label: 'Resposta ajustável',
    value: 'Consulta rápida ou passo a passo, conforme a necessidade',
  },
];

type HeroVideoLayer = 'primary' | 'secondary';

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
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const quickCarouselRef = useRef<HTMLDivElement>(null);
  const magneticRafRef = useRef<number | null>(null);
  const crossfadeTimeoutRef = useRef<number | null>(null);
  const crossfadeLockRef = useRef(false);

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
  const useVideoHero = heroMode === 'video' && !isHeroMobile;

  const [videoErrorLevel, setVideoErrorLevel] = useState(0);
  const [videoLoopState, setVideoLoopState] = useState<{
    deckKey: string;
    activeLayer: HeroVideoLayer;
  }>({
    deckKey: '',
    activeLayer: 'primary',
  });

  const desktopVideoSources = isUhdDisplay
    ? ['/videos/clara-hero-4k.mp4', '/videos/clara-hero.mp4']
    : ['/videos/clara-hero.mp4'];

  const mobileVideoSources = [
    '/videos/clara-hero.mp4',
  ];

  const currentSources = isHeroMobile ? mobileVideoSources : desktopVideoSources;
  const currentVideoSrc = currentSources[Math.min(videoErrorLevel, currentSources.length - 1)];
  const heroPoster = isUhdDisplay ? claraHeroFallback4k : claraHeroFallback;
  const videoDeckKey = `${isHeroMobile ? 'mobile' : 'desktop'}-${currentVideoSrc}`;
  const activeVideoLayer = videoLoopState.deckKey === videoDeckKey ? videoLoopState.activeLayer : 'primary';
  const shouldAnimate = !prefersReducedMotion && !isHeroMobile;
  const shouldAnimateMedia = shouldAnimate && useVideoHero;

  const handleVideoError = () => {
    if (videoErrorLevel < currentSources.length - 1) {
      setVideoErrorLevel((prev) => prev + 1);
    }
  };

  const syncVisibleVideos = useCallback(
    (shouldPlay: boolean) => {
      const primaryVideo = primaryVideoRef.current;
      const secondaryVideo = secondaryVideoRef.current;

      if (!shouldPlay) {
        primaryVideo?.pause();
        secondaryVideo?.pause();
        return;
      }

      const activeVideo = activeVideoLayer === 'primary' ? primaryVideo : secondaryVideo;
      const shadowVideo = activeVideoLayer === 'primary' ? secondaryVideo : primaryVideo;

      activeVideo?.play().catch(() => {});
      if (crossfadeLockRef.current) {
        shadowVideo?.play().catch(() => {});
      }
    },
    [activeVideoLayer],
  );

  const startVideoCrossfade = useCallback(() => {
    if (crossfadeLockRef.current || isHeroMobile || !shouldAnimate) return;

    const primaryVideo = primaryVideoRef.current;
    const secondaryVideo = secondaryVideoRef.current;
    if (!primaryVideo || !secondaryVideo) return;

    const currentVideo = activeVideoLayer === 'primary' ? primaryVideo : secondaryVideo;
    const nextVideo = activeVideoLayer === 'primary' ? secondaryVideo : primaryVideo;

    if (!Number.isFinite(currentVideo.duration) || currentVideo.duration <= VIDEO_LOOP_CROSSFADE_SECONDS) {
      return;
    }

    crossfadeLockRef.current = true;
    nextVideo.currentTime = 0;
    nextVideo.play().catch(() => {
      crossfadeLockRef.current = false;
    });

    const nextLayer: HeroVideoLayer = activeVideoLayer === 'primary' ? 'secondary' : 'primary';
    setVideoLoopState({ deckKey: videoDeckKey, activeLayer: nextLayer });

    if (crossfadeTimeoutRef.current) {
      window.clearTimeout(crossfadeTimeoutRef.current);
    }

    crossfadeTimeoutRef.current = window.setTimeout(() => {
      currentVideo.pause();
      currentVideo.currentTime = 0;
      crossfadeLockRef.current = false;
      crossfadeTimeoutRef.current = null;
    }, VIDEO_LOOP_CROSSFADE_SECONDS * 1000);
  }, [activeVideoLayer, isHeroMobile, shouldAnimate, videoDeckKey]);

  const handleVideoTimeUpdate = useCallback((event: SyntheticEvent<HTMLVideoElement>) => {
    const activeVideo = activeVideoLayer === 'primary' ? primaryVideoRef.current : secondaryVideoRef.current;
    if (event.currentTarget !== activeVideo || crossfadeLockRef.current) {
      return;
    }

    const remainingTime = event.currentTarget.duration - event.currentTarget.currentTime;
    if (Number.isFinite(remainingTime) && remainingTime <= VIDEO_LOOP_CROSSFADE_SECONDS) {
      startVideoCrossfade();
    }
  }, [activeVideoLayer, startVideoCrossfade]);

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
    if (!useVideoHero || !heroSectionRef.current || prefersReducedMotion) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            syncVisibleVideos(true);
          } else {
            syncVisibleVideos(false);
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(heroSectionRef.current);
    return () => observer.disconnect();
  }, [prefersReducedMotion, syncVisibleVideos, useVideoHero]);

  useEffect(() => {
    if (!useVideoHero) return;
    if (crossfadeTimeoutRef.current) {
      window.clearTimeout(crossfadeTimeoutRef.current);
      crossfadeTimeoutRef.current = null;
    }

    crossfadeLockRef.current = false;
    primaryVideoRef.current?.pause();
    secondaryVideoRef.current?.pause();

    if (primaryVideoRef.current) primaryVideoRef.current.currentTime = 0;
    if (secondaryVideoRef.current) secondaryVideoRef.current.currentTime = 0;
  }, [useVideoHero, videoDeckKey]);

  useEffect(() => {
    return () => {
      if (magneticRafRef.current) cancelAnimationFrame(magneticRafRef.current);
      if (crossfadeTimeoutRef.current) window.clearTimeout(crossfadeTimeoutRef.current);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start start', 'end start'],
  });
  const textParallaxY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const mediaParallaxY = useTransform(scrollYProgress, [0, 1], [0, 60]);

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
            transition={shouldAnimate ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
            style={shouldAnimate ? { y: mediaParallaxY } : undefined}
          >
            {shouldAnimateMedia ? (
              <div key={videoDeckKey} className="hero-video-stack">
                <video
                  ref={primaryVideoRef}
                  src={currentVideoSrc}
                  poster={heroPoster}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onError={handleVideoError}
                  onEnded={startVideoCrossfade}
                  onTimeUpdate={handleVideoTimeUpdate}
                  className={`hero-video-layer ${activeVideoLayer === 'primary' ? 'is-active' : 'is-inactive'}`}
                />
                <video
                  ref={secondaryVideoRef}
                  src={currentVideoSrc}
                  poster={heroPoster}
                  muted
                  playsInline
                  preload="auto"
                  onError={handleVideoError}
                  onEnded={startVideoCrossfade}
                  onTimeUpdate={handleVideoTimeUpdate}
                  className={`hero-video-layer ${activeVideoLayer === 'secondary' ? 'is-active' : 'is-inactive'}`}
                />
              </div>
            ) : (
              <img
                src={heroPoster}
                alt=""
                className="hero-clara-video"
                fetchPriority="high"
              />
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
              className="hero-copy-surface space-y-4 lg:space-y-5"
            >
              <motion.div variants={itemVariants}>
                <span className="badge-chip">
                  <motion.span
                    animate={shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
                    transition={shouldAnimate ? { duration: 2, repeat: Infinity } : undefined}
                    className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)]"
                  />
                  Apoio ao SEI-Rio
                </span>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="maintenance-chip" role="status">
                  <span className="w-2 h-2 rounded-full bg-cyan-400/80" aria-hidden="true" />
                  Versão prévia 2.1
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
                Apoio ao uso do SEI-Rio e a rotinas administrativas
              </motion.p>

              <motion.p variants={itemVariants} className="hero-description text-body">
                A CLARA ajuda servidores a tirar dúvidas sobre procedimentos no SEI-Rio, organizar
                documentos e revisar etapas de instrução processual com linguagem clara e objetiva.
              </motion.p>

              <motion.div variants={itemVariants} className="hero-proof-grid hero-measure-block" aria-label="Diferenciais da experiência">
                {HERO_SIGNAL_ITEMS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="hero-proof-card">
                    <span className="hero-proof-icon" aria-hidden="true">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="hero-proof-label">{label}</p>
                      <p className="hero-proof-value">{value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="hero-actions flex flex-col sm:flex-row gap-4 pt-3">
                <button
                  className="btn-cinematic-glow hero-cta-button hero-cta-primary type-label flex items-center justify-center gap-2"
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
                  className="btn-clara-secondary hero-cta-button hero-cta-secondary type-label flex items-center justify-center gap-2"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                >
                  <BookOpen size={20} aria-hidden="true" />
                  Ver funcionalidades
                </button>
              </motion.div>

              <motion.p variants={itemVariants} className="hero-privacy text-caption">
                Ao usar a CLARA, você concorda com nossa{' '}
                <a href="/privacidade" className="text-primary hover:underline font-medium transition-colors duration-150">
                  Política de Privacidade
                </a>
              </motion.p>

              <motion.div variants={itemVariants} className="hero-prompt-cluster pt-4">
                <div className="hero-prompt-toolbar">
                  <div className="space-y-1">
                    <p className="text-caption text-muted-foreground">Perguntas frequentes da base</p>
                    <p className="hero-prompt-lead">Exemplos de consultas compatíveis com o escopo atual da CLARA.</p>
                  </div>
                  <div className="hero-prompt-actions">
                    <span className="hero-inline-status">Exemplos reais</span>
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
                      if (event.key === 'ArrowRight') { event.preventDefault(); scrollQuickCarousel('next'); }
                      if (event.key === 'ArrowLeft') { event.preventDefault(); scrollQuickCarousel('prev'); }
                    }}
                  >
                    {HERO_QUICK_QUESTION_PREVIEW.map((question, i) => (
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
      </div>
    </section>
  );
};

export default HeroSection;
