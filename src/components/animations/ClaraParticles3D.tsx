import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'motion/react';

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  z: number;
  color: string;
  duration: number;
  delay: number;
}

const ParticleItem = ({ p, mouseX, mouseY }: { p: Particle, mouseX: MotionValue<number>, mouseY: MotionValue<number> }) => {
  // Parallax effect based on Z depth - closer particles move much faster
  const depthFactor = (p.z + 150) / 400; 
  const moveX = useTransform(mouseX, [0, 1], [-(250 * depthFactor), 250 * depthFactor]);
  const moveY = useTransform(mouseY, [0, 1], [-(200 * depthFactor), 200 * depthFactor]);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.size,
        backgroundColor: p.color,
        boxShadow: `0 0 ${p.size * 5}px ${p.color}`,
        x: moveX,
        y: moveY,
        z: p.z,
        filter: `blur(${Math.max(0, p.z / 100)}px)`,
      }}
      animate={{
        opacity: [0, Math.random() * 0.4 + 0.4, 0],
        y: [0, -(Math.random() * 300 + 100)],
        x: [0, (Math.random() - 0.5) * 150],
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
    const newParticles: Particle[] = Array.from({ length: 120 }).map((_, i) => {
      const colors = ['rgba(255, 220, 100, 0.9)', 'rgba(0, 240, 255, 0.7)', 'rgba(255, 140, 20, 1.0)', 'rgba(255, 255, 255, 0.5)'];
      return {
        id: i,
        size: Math.random() * 5 + 1,
        x: Math.random() * 60 + 40,
        y: Math.random() * 100,
        z: Math.random() * 400 - 150,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 20 + 8,
        delay: Math.random() * -10,
      };
    });
    setParticles(newParticles);
  }, []);

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
