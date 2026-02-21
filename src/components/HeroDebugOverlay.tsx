import { useEffect, useState } from "react";

/**
 * Debug overlay activated by ?debug=hero
 * Shows safe zones and current CSS variable values for the 3-layer hero.
 */
const HeroDebugOverlay = () => {
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState({
    bp: "",
    copyMax: "",
    copyLeft: "",
    mediaW: "",
    overlayStr: "",
    minH: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") !== "hero") return;
    setActive(true);

    const update = () => {
      const hero = document.querySelector(".clara-hero") as HTMLElement | null;
      if (!hero) return;
      const cs = getComputedStyle(hero);
      const w = window.innerWidth;
      let bp = "<900";
      if (w >= 1600) bp = "≥1600";
      else if (w >= 1280) bp = "1280–1599";
      else if (w >= 1024) bp = "1024–1279";
      else if (w >= 900) bp = "900–1023";

      setInfo({
        bp,
        copyMax: cs.getPropertyValue("--hero-copy-max").trim(),
        copyLeft: cs.getPropertyValue("--hero-copy-left").trim(),
        mediaW: cs.getPropertyValue("--hero-media-width").trim(),
        overlayStr: cs.getPropertyValue("--hero-overlay-strength").trim(),
        minH: cs.getPropertyValue("--hero-min-h").trim(),
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Info panel */}
      <div className="absolute top-4 right-4 bg-black/80 text-white font-mono text-xs p-3 rounded-lg border border-white/20 pointer-events-auto space-y-1">
        <div className="text-yellow-400 font-bold mb-1">DEBUG HERO v3</div>
        <div>Breakpoint: <span className="text-green-400">{info.bp}</span></div>
        <div>--hero-copy-max: <span className="text-blue-400">{info.copyMax}</span></div>
        <div>--hero-copy-left: <span className="text-blue-400">{info.copyLeft}</span></div>
        <div>--hero-media-width: <span className="text-blue-400">{info.mediaW}</span></div>
        <div>--hero-overlay-strength: <span className="text-blue-400">{info.overlayStr}</span></div>
        <div>--hero-min-h: <span className="text-blue-400">{info.minH}</span></div>
        <div>Window: <span className="text-blue-400">{typeof window !== "undefined" ? window.innerWidth : 0}px</span></div>
      </div>
    </div>
  );
};

export default HeroDebugOverlay;
