import { FileSearch, GitBranch, ClipboardCheck, ShieldCheck } from "lucide-react";

const services = [
  {
    icon: FileSearch,
    title: "Leitura Normativa",
    description: "Consulte requisitos, prazos e critérios com síntese objetiva para tomada de decisão.",
  },
  {
    icon: GitBranch,
    title: "Fluxo de Tramitação",
    description: "Mapeie a ordem correta de encaminhamento no SEI e reduza retrabalho operacional.",
  },
  {
    icon: ClipboardCheck,
    title: "Validação Documental",
    description: "Confira checklist de anexos, assinaturas e evidências antes da submissão final.",
  },
  {
    icon: ShieldCheck,
    title: "Conformidade e Risco",
    description: "Antecipe inconsistências com orientações de conformidade e justificativa de cada etapa.",
  },
];

const ServicesSection = () => {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          Serviços Prioritários
        </p>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
          Blocos rápidos para consultas de rotina
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-6 group hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <service.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h4 className="font-display text-lg font-bold text-foreground mb-2">
                {service.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ lineHeight: "1.7" }}>
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
