import { useEffect, useRef, useCallback } from "react";

const MAX_DISPLACEMENT = 6;
const LERP = 0.15;

/**
 * Magnetic cursor effect for CTA buttons (desktop only).
 * Moves element toward cursor with spring-like return.
 * No-op when prefers-reduced-motion or touch device.
 */
export function useMagneticCursor<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const rafId = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * LERP;
    const dy = (e.clientY - cy) * LERP;
    const clampedX = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, dx));
    const clampedY = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, dy));
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      el.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(rafId.current);
    el.style.transition = "transform 0.4s ease-out";
    el.style.transform = "translate(0, 0)";
    const cleanup = () => {
      el.style.transition = "";
    };
    el.addEventListener("transitionend", cleanup, { once: true });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip on touch devices or reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (prefersReduced || isTouch) return;

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return ref;
}
