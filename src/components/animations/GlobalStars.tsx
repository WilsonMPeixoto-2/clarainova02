import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface Star {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacityPeak: number;
}

const generateStars = (): Star[] => {
  return Array.from({ length: 150 }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 0.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 15 + 20,
    delay: Math.random() * -30,
    opacityPeak: Math.random() * 0.4 + 0.1,
  }));
};

export default function GlobalStars() {
  const prefersReducedMotion = useReducedMotion();
  const [stars] = useState<Star[]>(generateStars);

  if (prefersReducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen opacity-50">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-[hsl(var(--gold-1))]"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size * 2}px hsl(var(--gold-1))`,
          }}
          animate={{
            opacity: [0, s.opacityPeak, 0],
            y: [0, -30],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
