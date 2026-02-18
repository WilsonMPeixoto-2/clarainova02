import { useEffect, useRef } from "react";

const GoldParticles = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !containerRef.current) return;

    const container = containerRef.current;
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = Math.random() * 10 + 12;

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        bottom: -10px;
        border-radius: 50%;
        background: radial-gradient(circle, hsl(42 78% 55% / 0.8), hsl(42 90% 65% / 0.3));
        filter: blur(${size > 4 ? 2 : 1}px);
        animation: particle-float ${duration}s linear ${delay}s infinite;
        pointer-events: none;
      `;
      container.appendChild(particle);
    }

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-[2]"
      aria-hidden="true"
    />
  );
};

export default GoldParticles;
