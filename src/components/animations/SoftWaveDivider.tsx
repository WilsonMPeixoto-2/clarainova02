import { FC } from 'react';

export const SoftWaveDivider: FC = () => (
   <div className="w-full relative -mt-20 md:-mt-32 z-10 pointer-events-none transform translate-y-1">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px] md:h-[120px] text-background">
         <path d="M0,0 C320,120 420,120 720,60 C1020,0 1120,0 1440,120 L1440,120 L0,120 Z" fill="currentColor"/>
      </svg>
   </div>
);
