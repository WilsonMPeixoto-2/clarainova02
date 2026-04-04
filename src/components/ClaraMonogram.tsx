type ClaraMonogramProps = {
  className?: string;
  title?: string;
};

export function ClaraMonogram({ className = '', title = 'CLARA' }: ClaraMonogramProps) {
  const decorative = title === '';

  return (
    <img
      src="/brand/clara-seal.svg"
      className={className}
      alt={decorative ? '' : title}
      aria-hidden={decorative ? true : undefined}
      decoding="async"
      loading="eager"
      draggable={false}
    />
  );
}
