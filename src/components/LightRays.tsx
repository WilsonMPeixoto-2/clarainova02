import { useEffect, useRef } from "react";

/**
 * LightRays — raios volumétricos de luz/energia animados via CSS.
 * Cada raio é um elemento div com gradiente e blend-mode "screen".
 * Emanam do ponto onde a Clara está (lado direito, ~65-75% do hero).
 * Completamente CSS — zero JS no render loop.
 */

interface RayConfig {
  angle: number;      // degrees, 0 = up
  width: number;      // px
  length: number;     // vh
  opacity: number;    // base opacity
  delay: number;      // animation delay (s)
  duration: number;   // animation duration (s)
  color: "gold" | "bright" | "dim";
}

const RAYS: RayConfig[] = [
  { angle: -55, width: 80,  length: 95, opacity: 0.18, delay: 0,    duration: 8,  color: "bright" },
  { angle: -40, width: 140, length: 110, opacity: 0.14, delay: 1.2,  duration: 10, color: "gold" },
  { angle: -25, width: 60,  length: 80,  opacity: 0.22, delay: 0.4,  duration: 7,  color: "bright" },
  { angle: -12, width: 100, length: 100, opacity: 0.12, delay: 2.1,  duration: 12, color: "dim" },
  { angle:   2, width: 180, length: 130, opacity: 0.10, delay: 0.8,  duration: 15, color: "gold" },
  { angle:  15, width: 70,  length: 90,  opacity: 0.20, delay: 1.5,  duration: 9,  color: "bright" },
  { angle:  28, width: 120, length: 105, opacity: 0.13, delay: 3.0,  duration: 11, color: "gold" },
  { angle:  42, width: 50,  length: 75,  opacity: 0.16, delay: 0.6,  duration: 8,  color: "bright" },
  { angle:  58, width: 90,  length: 88,  opacity: 0.11, delay: 2.4,  duration: 13, color: "dim" },
  { angle: -68, width: 55,  length: 72,  opacity: 0.15, delay: 1.8,  duration: 10, color: "gold" },
];

const COLOR_MAP = {
  gold:   "hsl(38 65% 58%)",
  bright: "hsl(42 90% 72%)",
  dim:    "hsl(38 45% 42%)",
};

const LightRays = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Mark container as active so CSS animations play
    if (containerRef.current) {
      containerRef.current.dataset.active = "true";
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="light-rays-container"
      aria-hidden="true"
    >
      {RAYS.map((ray, i) => {
        const color = COLOR_MAP[ray.color];
        const animName = `ray-pulse-${i % 3}`; // 3 variants for variety

        return (
          <div
            key={i}
            className="light-ray"
            style={{
              "--ray-angle": `${ray.angle}deg`,
              "--ray-width": `${ray.width}px`,
              "--ray-length": `${ray.length}vh`,
              "--ray-opacity": ray.opacity,
              "--ray-delay": `${ray.delay}s`,
              "--ray-duration": `${ray.duration}s`,
              "--ray-color": color,
              "--ray-anim": animName,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export default LightRays;
