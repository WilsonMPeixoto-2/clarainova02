import { createContext, useEffect, useState } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

const SmoothScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [lenisInstance] = useState<Lenis | null>(() => {
    if (typeof window === "undefined") return null;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return null;

    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isTouch) return null;

    return new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
  });

  useEffect(() => {
    if (!lenisInstance) return;

    let rafId: number;
    const raf = (time: number) => {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenisInstance.destroy();
    };
  }, [lenisInstance]);

  return (
    <LenisContext.Provider value={lenisInstance}>
      {children}
    </LenisContext.Provider>
  );
};

export default SmoothScrollProvider;
