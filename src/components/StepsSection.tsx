import { MessageSquare, BookOpen, ShieldCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Pergunte com linguagem natural",
    description: "Sem comandos técnicos. Diga o que precisa resolver.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Receba base + racional",
    description: "Resposta estruturada com contexto e rastreio.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Aja com segurança",
    description: "Siga o fluxo recomendado e valide o resultado.",
  },
];

const StepsSection = () => {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <step.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {step.number}
              </span>
              <h4 className="font-display text-lg font-bold text-foreground">
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground" style={{ lineHeight: "1.7" }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
