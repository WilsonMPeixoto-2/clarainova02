import { useEffect, useState } from "react";

/**
 * Debug overlay activated by ?debugLayout=1
 * Shows grid boundaries, safe frame, and current CSS variable values.
 */
const HeroDebugOverlay = () => {
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState({ bp: "", posX: "", posY: "", scale: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debugLayout") !== "1") return;
    setActive(true);

    const update = () => {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      const w = window.innerWidth;
      let bp = "<900";
      if (w >= 1440) bp = "≥1440";
      else if (w >= 1280) bp = "1280–1439";
      else if (w >= 1024) bp = "1024–1279";
      else if (w >= 900) bp = "900–1023";

      setInfo({
        bp,
        posX: cs.getPropertyValue("--clara-pos-x").trim(),
        posY: cs.getPropertyValue("--clara-pos-y").trim(),
        scale: cs.getPropertyValue("--clara-scale").trim(),
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Grid column outlines */}
      <div className="absolute inset-0 container mx-auto px-6 hidden md:grid grid-cols-12 gap-8">
        {/* Copy area (col 1-7) */}
        <div className="col-span-7 border-2 border-green-500/40 rounded-lg relative">
          <span className="absolute top-2 left-2 text-green-400 text-xs font-mono bg-black/60 px-2 py-1 rounded">
            COPY (col 1-7)
          </span>
        </div>
        {/* Art area (col 8-12) */}
        <div className="col-span-5 border-2 border-blue-500/40 rounded-lg relative">
          <span className="absolute top-2 left-2 text-blue-400 text-xs font-mono bg-black/60 px-2 py-1 rounded">
            ART (col 8-12)
          </span>
          {/* Safe frame for face */}
          <div className="absolute border-2 border-red-500/60 rounded-full"
            style={{
              width: "40%",
              height: "45%",
              top: "15%",
              right: "15%",
            }}
          >
            <span className="absolute -top-5 left-0 text-red-400 text-xs font-mono bg-black/60 px-1 rounded">
              SAFE FRAME
            </span>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="absolute top-4 right-4 bg-black/80 text-white font-mono text-xs p-3 rounded-lg border border-white/20 pointer-events-auto space-y-1">
        <div className="text-yellow-400 font-bold mb-1">DEBUG LAYOUT</div>
        <div>Breakpoint: <span className="text-green-400">{info.bp}</span></div>
        <div>--clara-pos-x: <span className="text-blue-400">{info.posX}</span></div>
        <div>--clara-pos-y: <span className="text-blue-400">{info.posY}</span></div>
        <div>--clara-scale: <span className="text-blue-400">{info.scale}</span></div>
        <div>Window: <span className="text-blue-400">{typeof window !== 'undefined' ? window.innerWidth : 0}px</span></div>
      </div>
    </div>
  );
};

export default HeroDebugOverlay;
