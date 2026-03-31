import { useId } from 'react';

type ClaraMonogramProps = {
  className?: string;
  title?: string;
};

export function ClaraMonogram({ className = '', title = 'CLARA' }: ClaraMonogramProps) {
  const backgroundId = useId();
  const glowId = useId();
  const strokeId = useId();
  const accentId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={backgroundId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16283F" />
          <stop offset="0.58" stopColor="#0F1B2E" />
          <stop offset="1" stopColor="#0A1321" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(49 16) rotate(135) scale(28)">
          <stop offset="0" stopColor="#5CD9E8" stopOpacity="0.42" />
          <stop offset="1" stopColor="#5CD9E8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={strokeId} x1="20" y1="16" x2="48" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F3C576" />
          <stop offset="1" stopColor="#D7A252" />
        </linearGradient>
        <linearGradient id={accentId} x1="42" y1="18" x2="54" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#86F3FF" />
          <stop offset="1" stopColor="#4AC6D8" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${backgroundId})`} />
      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${glowId})`} />
      <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="17.25" fill="none" stroke="#E3BE79" strokeOpacity="0.48" strokeWidth="1.5" />

      <path
        d="M43.5 17.5C40.9 15.6 36.9 14 32.4 14C22.6 14 15 21.5 15 32C15 42.5 22.6 50 32.4 50C36.9 50 40.9 48.4 43.5 46.5"
        fill="none"
        stroke={`url(#${strokeId})`}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path d="M43 17.5L50.5 11" fill="none" stroke={`url(#${accentId})`} strokeWidth="3.25" strokeLinecap="round" />
      <circle cx="46" cy="42" r="3.5" fill="#5CD9E8" />
    </svg>
  );
}
