import { ShieldCheck } from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  { id: 'faq-1', question: 'A CLARA substitui análise jurídica?', answer: 'Não. A CLARA foi pensada para apoiar o uso do SEI-Rio e a execução de rotinas administrativas. Quando a situação exigir interpretação normativa, decisão formal ou parecer especializado, a validação deve seguir os canais competentes.' },
  { id: 'faq-2', question: 'Posso usar para processos em andamento no SEI-Rio?', answer: 'Sim. A CLARA pode ajudar a revisar etapas, organizar documentos, entender encaminhamentos, conferir blocos e preparar a próxima ação antes de operar no processo.' },
  { id: 'faq-3', question: 'Como funciona o modo Direto e o Didático?', answer: 'No modo Direto, a resposta vem curta e objetiva para consulta rápida. No modo Didático, a explicação é organizada em etapas para quem precisa executar o procedimento com mais segurança.' },
  { id: 'faq-4', question: 'As respostas trazem base documental?', answer: 'Quando a base local encontra respaldo para a pergunta, a resposta pode indicar os documentos consultados. Ainda assim, a validação final deve considerar os materiais oficiais usados pela sua unidade.' },
  { id: 'faq-5', question: 'A CLARA funciona em celular e desktop?', answer: 'Sim. O layout foi ajustado para ambos. No desktop, o chat abre em painel lateral; no mobile, funciona como sheet com foco na leitura e no envio da pergunta.' },
];

const FAQSection = () => {
  return (
    <section id="faq" className="faq-section py-20 md:py-24 relative" aria-labelledby="faq-heading">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="faq-shell">
            <div className="faq-intro-grid">
              <div className="faq-header">
                <span className="knowledge-kicker">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  FAQ
                </span>
                <h2 id="faq-heading" className="text-h2 mt-4">
                  <Balancer>Uso e limites da CLARA</Balancer>
                </h2>
                <p className="text-body mt-3 max-w-3xl">
                  <Balancer>
                    Informações rápidas sobre escopo, funcionamento e cuidados de uso.
                  </Balancer>
                </p>
              </div>

              <div className="faq-note-card">
                <p className="faq-note-kicker">Importante</p>
                <ul className="faq-note-list">
                  <li>A CLARA apoia o uso do SEI-Rio, mas não substitui validação formal da unidade.</li>
                  <li>O foco está em tarefas operacionais e em respostas claras e organizadas.</li>
                  <li>Quando houver dúvida normativa, a orientação oficial continua sendo a referência final.</li>
                </ul>
              </div>
            </div>

            <Accordion type="single" collapsible className="faq-accordion">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="faq-item">
                  <AccordionTrigger className="faq-trigger">{item.question}</AccordionTrigger>
                  <AccordionContent className="faq-content">
                    <p className="text-body">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FAQSection;
