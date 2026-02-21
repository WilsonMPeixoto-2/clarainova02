import { useRef, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * EnergyFlow — Video overlay com mix-blend-mode: screen.
 *
 * Usa o vídeo de energia gerado por IA (fundo preto) sobreposto à imagem
 * da Clara. O blend mode "screen" torna o preto transparente, deixando
 * apenas a luz/energia visível.
 */
const EnergyFlow = () => {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Don't render on mobile or reduced motion
  if (isMobile || reduced) return null;

  return (
    <div
      className="absolute inset-0 z-[4] pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ mixBlendMode: "screen" }}
    >
      <video
        ref={videoRef}
        src="/videos/energy-flow.mp4"
        className={`w-full h-full object-cover transition-opacity duration-1000 ${
          canPlay ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        onCanPlayThrough={() => setCanPlay(true)}
      />
    </div>
  );
};

export default EnergyFlow;
