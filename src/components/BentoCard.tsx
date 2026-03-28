import { type ElementType } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Tilt3D } from "@/components/animations/Tilt3D";

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
    "group relative @container rounded-[1.8rem] border border-[hsl(var(--stroke)/0.56)] bg-[linear-gradient(160deg,hsl(var(--surface-2)/0.84),hsl(var(--surface-1)/0.68))] backdrop-blur-xl px-5 py-5 md:px-6 md:py-6 shadow-[0_20px_44px_hsl(var(--shadow)/0.22),inset_0_1px_0_hsl(0_0%_100%/0.03)] transition-[box-shadow,background] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_26px_52px_hsl(var(--shadow)/0.3),0_0_24px_hsl(var(--glow)/0.06)]";
  const interactionClasses =
    "hover:border-[hsl(var(--gold-1)/0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const variantClasses =
    variant === "highlight"
      ? "bg-[radial-gradient(ellipse_80%_60%_at_top_right,hsl(var(--gold-2)/0.08),transparent_44%),linear-gradient(165deg,hsl(var(--surface-3)/0.9),hsl(var(--surface-1)/0.76))] border-[hsl(var(--gold-1)/0.18)] shadow-[0_24px_48px_hsl(var(--shadow)/0.26)]"
      : "";

  if (href) {
    return (
      <Tilt3D className={cn(baseClasses, interactionClasses, variantClasses, className)}>
        <a href={href} className="block w-full h-full rounded-[inherit] outline-none">
          <BorderBeam size={100} duration={14} delay={9} />
          <div className="flex items-start justify-between gap-3 relative z-10" style={{ transform: 'translateZ(10px)' }}>
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-[0.9rem] border border-[hsl(var(--gold-1)/0.2)] bg-[linear-gradient(145deg,hsl(var(--gold-1)/0.14),hsl(var(--gold-2)/0.06))] text-primary shadow-[0_0_22px_hsl(var(--glow)/0.07)] transition-all duration-300 group-hover:shadow-[0_0_28px_hsl(var(--glow)/0.12)] group-hover:border-[hsl(var(--gold-1)/0.3)]">
              <Icon className="w-[1.35rem] h-[1.35rem]" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <h3 className="mt-4 text-lg @[280px]:text-xl font-semibold tracking-tight text-foreground relative z-10" style={{ fontFamily: "var(--font-heading)", transform: 'translateZ(20px)' }}>
            {title}
          </h3>
          <p className="mt-2 text-sm @[280px]:text-base leading-relaxed text-muted-foreground relative z-10" style={{ fontFamily: "var(--font-body)", transform: 'translateZ(15px)' }}>
            {description}
          </p>
        </a>
      </Tilt3D>
    );
  }

  return (
    <Tilt3D className={cn(baseClasses, variantClasses, className)}>
      <div className="block w-full h-full rounded-[inherit]">
        <BorderBeam size={100} duration={14} delay={9} />
        <div className="flex items-start gap-3 relative z-10" style={{ transform: 'translateZ(10px)' }}>
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-[0.9rem] border border-[hsl(var(--gold-1)/0.2)] bg-[linear-gradient(145deg,hsl(var(--gold-1)/0.14),hsl(var(--gold-2)/0.06))] text-primary shadow-[0_0_22px_hsl(var(--glow)/0.07)] transition-all duration-300 group-hover:shadow-[0_0_28px_hsl(var(--glow)/0.12)] group-hover:border-[hsl(var(--gold-1)/0.3)]">
            <Icon className="w-[1.35rem] h-[1.35rem]" strokeWidth={1.9} aria-hidden="true" />
          </span>
        </div>
        <h3 className="mt-4 text-lg @[280px]:text-xl font-semibold tracking-tight text-foreground relative z-10" style={{ fontFamily: "var(--font-heading)", transform: 'translateZ(20px)' }}>
          {title}
        </h3>
        <p className="mt-2 text-sm @[280px]:text-base leading-relaxed text-muted-foreground relative z-10" style={{ fontFamily: "var(--font-body)", transform: 'translateZ(15px)' }}>
          {description}
        </p>
      </div>
    </Tilt3D>
  );
}
