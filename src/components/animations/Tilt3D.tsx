import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  glare?: boolean;
}

export function Tilt3D({ children, className = '', depth = 25, glare = true }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 350, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 350, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['100%', '0%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['100%', '0%']);
  const glareOpacity = useTransform(x, [-0.5, 0, 0.5], [0, 0.15, 0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    // Desativa em dispositivos sem hover (mobile) para economizar processamento
    if (window.matchMedia('(hover: none)').matches) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: none)').matches) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1200px' // Define a perspectiva container 3D
      }}
      className={`relative will-change-transform ${className}`}
    >
      <div 
        className="relative h-full w-full pointer-events-auto rounded-[inherit]"
        style={{ 
          transform: isHovered ? `translateZ(${depth}px)` : 'translateZ(0px)', 
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
        }}
      >
        {children}
      </div>

      {/* Camada de brilho (Glare) */}
      {glare && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden mix-blend-overlay"
          style={{ transform: 'translateZ(1px)' }}
        >
          <motion.div
            className="absolute transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, transparent 65%)',
              left: glareX,
              top: glareY,
              opacity: isHovered ? glareOpacity : 0,
              transform: 'translate(-50%, -50%)',
              width: '200%',
              height: '200%',
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
