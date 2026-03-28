import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, MotionValue } from 'motion/react';

const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  z: number;
  color: string;
  duration: number;
  delay: number;
  opacityPeak: number;
  driftY: number;
  driftX: number;
}

const ParticleItem = ({ p, mouseX, mouseY }: { p: Particle, mouseX: MotionValue<number>, mouseY: MotionValue<number> }) => {
  const depthFactor = (p.z + 150) / 400;
  const moveX = useTransform(mouseX, [0, 1], [-(180 * depthFactor), 180 * depthFactor]);
  const moveY = useTransform(mouseY, [0, 1], [-(140 * depthFactor), 140 * depthFactor]);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.size,
        backgroundColor: p.color,
        boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
        x: moveX,
        y: moveY,
        z: p.z,
        filter: p.z > 50 ? `blur(${p.z / 120}px)` : undefined,
        willChange: 'transform, opacity',
      }}
      animate={{
        opacity: [0, p.opacityPeak, 0],
        y: [0, -p.driftY],
        x: [0, p.driftX],
      }}
      transition={{
        duration: p.duration,
        repeat: Infinity,
        delay: p.delay,
        ease: "easeInOut"
      }}
    />
  );
};

export default function ClaraParticles3D() {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 40, damping: 20 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const colors = [
      'rgba(255, 220, 100, 0.9)',
      'rgba(0, 240, 255, 0.65)',
      'rgba(255, 160, 40, 0.95)',
      'rgba(255, 255, 255, 0.45)',
      'rgba(200, 180, 255, 0.5)',
    ];
    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      size: Math.random() * 5 + 1.5,
      x: Math.random() * 55 + 42,
      y: Math.random() * 100,
      z: Math.random() * 400 - 150,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 18 + 10,
      delay: Math.random() * -12,
      opacityPeak: Math.random() * 0.45 + 0.35,
      driftY: Math.random() * 280 + 120,
      driftX: (Math.random() - 0.5) * 130,
    }));
    setParticles(newParticles);
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20 mix-blend-screen" style={{ perspective: '1200px' }}>
      {particles.map((p) => (
        <ParticleItem key={p.id} p={p} mouseX={smoothMouseX} mouseY={smoothMouseY} />
      ))}

      <motion.div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[150px] mix-blend-plus-lighter opacity-40"
        style={{
            background: 'radial-gradient(circle, rgba(255,200,50,0.2) 0%, rgba(0,255,255,0.05) 40%, transparent 75%)',
            left: useTransform(smoothMouseX, [0, 1], ['55%', '75%']),
            top: useTransform(smoothMouseY, [0, 1], ['30%', '60%']),
            transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
