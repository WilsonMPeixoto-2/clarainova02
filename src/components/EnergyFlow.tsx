import { useEffect, useRef } from "react";

/**
 * EnergyFlow — energia viva que flui ao longo do cabelo e corpo da Clara.
 *
 * Técnica: Canvas 2D com partículas que percorrem curvas bezier cúbicas.
 * Cada "fio" de energia é definido por pontos de controle aproximando
 * o traçado do cabelo/silhueta da Clara na imagem.
 *
 * As partículas fluem continuamente ao longo dos fios com:
 * - velocidade variável (acelera/desacelera organicamente)
 * - opacidade que pulsa (nascem, atingem pico, morrem)
 * - tamanho variável ao longo do caminho
 * - glow dourado via shadowBlur
 */

interface Strand {
  // Curva bezier cúbica: P0, P1(ctrl), P2(ctrl), P3
  // Coordenadas em % do canvas (0-1)
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  particleCount: number;
  color: string;
  speed: number; // base speed
}

// Fios de energia aproximando o cabelo e silhueta da Clara
// A imagem mostra clara com cabelo dark, com energia dourada/elétrica
// Clara ocupa ~55-85% horizontal, ~0-85% vertical
const STRANDS: Strand[] = [
  // Cabelo principal — topo, fluindo para direita
  {
    p0: [0.58, 0.02],
    p1: [0.62, 0.12],
    p2: [0.68, 0.22],
    p3: [0.72, 0.38],
    particleCount: 7,
    color: "hsl(42, 90%, 72%)",
    speed: 0.18,
  },
  // Fio lateral direito — cascata
  {
    p0: [0.72, 0.05],
    p1: [0.78, 0.18],
    p2: [0.75, 0.35],
    p3: [0.70, 0.52],
    particleCount: 8,
    color: "hsl(38, 78%, 62%)",
    speed: 0.14,
  },
  // Fio centro-esquerdo do cabelo
  {
    p0: [0.60, 0.08],
    p1: [0.58, 0.20],
    p2: [0.62, 0.35],
    p3: [0.65, 0.50],
    particleCount: 6,
    color: "hsl(45, 95%, 78%)",
    speed: 0.22,
  },
  // Energia no ombro/corpo
  {
    p0: [0.70, 0.45],
    p1: [0.68, 0.55],
    p2: [0.65, 0.65],
    p3: [0.62, 0.78],
    particleCount: 5,
    color: "hsl(38, 65%, 58%)",
    speed: 0.12,
  },
  // Fio de energia solto — voando
  {
    p0: [0.65, 0.10],
    p1: [0.80, 0.08],
    p2: [0.85, 0.25],
    p3: [0.78, 0.42],
    particleCount: 6,
    color: "hsl(42, 88%, 70%)",
    speed: 0.20,
  },
  // Fio ondulado longo — cabelo lateral
  {
    p0: [0.75, 0.12],
    p1: [0.82, 0.28],
    p2: [0.78, 0.45],
    p3: [0.72, 0.60],
    particleCount: 7,
    color: "hsl(38, 70%, 60%)",
    speed: 0.16,
  },
  // Energia ascendente — do corpo ao topo
  {
    p0: [0.66, 0.55],
    p1: [0.70, 0.38],
    p2: [0.74, 0.22],
    p3: [0.68, 0.06],
    particleCount: 5,
    color: "hsl(50, 100%, 80%)",
    speed: 0.25,
  },
  // Fio fino — detalhe energético
  {
    p0: [0.62, 0.25],
    p1: [0.55, 0.35],
    p2: [0.58, 0.48],
    p3: [0.64, 0.58],
    particleCount: 4,
    color: "hsl(38, 60%, 55%)",
    speed: 0.13,
  },
];

// Calcula ponto na curva bezier cúbica para t ∈ [0, 1]
function bezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
    mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
  ];
}

interface Particle {
  t: number;           // posição na curva [0, 1]
  strandIdx: number;
  speed: number;       // velocidade individual
  life: number;        // [0, 1] — ciclo de vida
  size: number;        // raio da partícula
  trailLength: number; // comprimento do rastro em nº de amostras
}

const EnergyFlow = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Inicializa partículas distribuídas pelos fios
    const particles: Particle[] = [];
    STRANDS.forEach((strand, si) => {
      for (let i = 0; i < strand.particleCount; i++) {
        particles.push({
          t: Math.random(), // posição inicial aleatória
          strandIdx: si,
          speed: strand.speed * (0.7 + Math.random() * 0.6),
          life: Math.random(),
          size: 1.5 + Math.random() * 2.5,
          trailLength: 8 + Math.floor(Math.random() * 12),
        });
      }
    });
    particlesRef.current = particles;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastTime = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // delta em segundos, cap 50ms
      lastTime = now;

      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        const strand = STRANDS[p.strandIdx];

        // Avança posição
        p.t += p.speed * dt;
        p.life += dt * 0.6;

        // Loop: quando chega ao fim, reinicia no início com novo t aleatório
        if (p.t > 1) {
          p.t = Math.random() * 0.15; // reaparecer no início da curva
          p.life = 0;
        }

        // Opacidade baseada no ciclo de vida e posição no fio
        const lifeFade = Math.sin(p.life * Math.PI * 0.5); // 0→1→fade
        const trailFade = p.t < 0.1 ? p.t / 0.1 : p.t > 0.85 ? (1 - p.t) / 0.15 : 1;
        const alpha = lifeFade * trailFade;

        if (alpha <= 0.01) return;

        // Posição atual
        const [cx, cy] = bezier(strand.p0, strand.p1, strand.p2, strand.p3, p.t);

        // Desenha rastro (trail)
        const trailSteps = p.trailLength;
        for (let j = trailSteps; j >= 0; j--) {
          const trailT = Math.max(0, p.t - (j / trailSteps) * 0.06);
          const [tx, ty] = bezier(strand.p0, strand.p1, strand.p2, strand.p3, trailT);
          const trailAlpha = alpha * (1 - j / trailSteps) * 0.6;
          const trailSize = p.size * (1 - j / trailSteps) * 0.8;

          ctx.beginPath();
          ctx.arc(tx * W, ty * H, Math.max(0.3, trailSize), 0, Math.PI * 2);
          ctx.fillStyle = strand.color.replace(")", ` / ${trailAlpha})`).replace("hsl(", "hsla(").replace("hsla(", "hsl(");
          ctx.fill();
        }

        // Desenha partícula principal com glow
        ctx.save();
        ctx.shadowColor = strand.color;
        ctx.shadowBlur = 8 + p.size * 3;
        ctx.globalAlpha = alpha;

        // Núcleo brilhante (branco/dourado claro)
        ctx.beginPath();
        ctx.arc(cx * W, cy * H, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(50 100% 95%)`;
        ctx.fill();

        // Halo dourado ao redor
        ctx.shadowBlur = 16 + p.size * 5;
        ctx.beginPath();
        ctx.arc(cx * W, cy * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = strand.color;
        ctx.fill();

        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
      aria-hidden="true"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default EnergyFlow;
