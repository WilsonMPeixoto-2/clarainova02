import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "A CLARA substitui análise jurídica?",
    answer:
      "Não. A CLARA é uma ferramenta de apoio que fornece orientações baseadas em documentos oficiais e legislação vigente. Suas respostas não substituem a consulta direta às normas oficiais nem assessoria jurídica especializada.",
  },
  {
    question: "Posso usar para processos em andamento no SEI-Rio?",
    answer:
      "Sim. A CLARA pode orientar sobre procedimentos, tramitação e documentação necessária para processos no SEI-Rio, sempre indicando as fontes documentais relevantes.",
  },
  {
    question: "Como funciona o modo Direto e o Didático?",
    answer:
      "No modo Direto, a CLARA fornece respostas objetivas e concisas. No modo Didático, as respostas incluem explicações detalhadas, contexto normativo e exemplos práticos para facilitar o entendimento.",
  },
  {
    question: "As respostas trazem base documental?",
    answer:
      "Sim. Todas as orientações da CLARA incluem indicação das fontes documentais consultadas, permitindo conferência e rastreabilidade das informações fornecidas.",
  },
];

const FAQSection = () => {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 text-center">
          DÚVIDAS FREQUENTES
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4 text-center">
          Clareza operacional com confiança
        </h2>
        <p className="text-muted-foreground text-base text-center mb-12 max-w-2xl mx-auto" style={{ lineHeight: "1.7" }}>
          Respostas para as perguntas que mais impactam execução, segurança e consistência no trabalho administrativo.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="glass-card rounded-xl border-none px-6"
            >
              <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5" style={{ lineHeight: "1.7" }}>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
