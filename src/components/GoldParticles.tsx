import { useEffect, useRef } from "react";

const GoldParticles = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !containerRef.current) return;

    const container = containerRef.current;
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      const size = Math.random() * 6 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 12;
      const duration = Math.random() * 8 + 10;
      const opacity = size > 5 ? 0.9 : 0.7;

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        bottom: -10px;
        border-radius: 50%;
        background: radial-gradient(circle, hsl(42 78% 55% / ${opacity}), hsl(42 90% 65% / 0.4));
        filter: blur(${size > 5 ? 2 : size > 3 ? 1 : 0}px);
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
