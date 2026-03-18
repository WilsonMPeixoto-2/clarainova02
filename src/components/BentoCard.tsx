import { type ElementType } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BentoVariant = "default" | "highlight";

interface BentoCardProps {
  title: string;
  description: string;
  icon: ElementType;
  href?: string;
  variant?: BentoVariant;
  className?: string;
}

export default function BentoCard({
  title,
  description,
  icon: Icon,
  href,
  variant = "default",
  className,
}: BentoCardProps) {
  const baseClasses =
    "group relative @container rounded-[1.6rem] border border-[hsl(var(--gold-1)/0.18)] bg-[linear-gradient(160deg,hsl(var(--surface-2)/0.86),hsl(var(--surface-1)/0.7))] backdrop-blur-xl px-5 py-5 md:px-6 md:py-6 transition-all duration-300 shadow-[0_18px_40px_hsl(var(--shadow)/0.2)]";
  const interactionClasses =
    "hover:border-[hsl(var(--gold-1)/0.34)] hover:bg-[linear-gradient(160deg,hsl(var(--surface-3)/0.9),hsl(var(--surface-1)/0.82))] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const variantClasses =
    variant === "highlight"
      ? "bg-[radial-gradient(circle_at_top_right,hsl(var(--gold-2)/0.12),transparent_42%),linear-gradient(165deg,hsl(var(--surface-3)/0.92),hsl(var(--surface-1)/0.78))] border-primary/35 shadow-[0_24px_48px_hsl(var(--shadow)/0.24)]"
      : "";

  if (href) {
    return (
      <a href={href} className={cn(baseClasses, interactionClasses, variantClasses, className)}>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-[1rem] border border-[hsl(var(--gold-1)/0.22)] bg-[linear-gradient(145deg,hsl(var(--gold-1)/0.16),hsl(var(--gold-2)/0.08))] text-primary shadow-[0_8px_18px_hsl(var(--glow)/0.08)]">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </span>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </div>
      <h3 className="mt-4 text-lg @[280px]:text-xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h3>
        <p className="mt-2 text-sm @[280px]:text-base leading-relaxed text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
          {description}
        </p>
      </a>
    );
  }

  return (
    <article className={cn(baseClasses, variantClasses, className)}>
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-[1rem] border border-[hsl(var(--gold-1)/0.22)] bg-[linear-gradient(145deg,hsl(var(--gold-1)/0.16),hsl(var(--gold-2)/0.08))] text-primary shadow-[0_8px_18px_hsl(var(--glow)/0.08)]">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-4 text-lg @[280px]:text-xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
        {title}
      </h3>
      <p className="mt-2 text-sm @[280px]:text-base leading-relaxed text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
        {description}
      </p>
    </article>
  );
}
