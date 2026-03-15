import { motion } from 'motion/react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useChat } from '@/hooks/useChatStore';

const faqItems = [
  { id: 'faq-1', question: 'A CLARA substitui análise jurídica?', answer: 'Não. A CLARA foi pensada para apoiar o uso do SEI-Rio e a execução de rotinas administrativas. Quando a situação exigir interpretação normativa, decisão formal ou parecer especializado, a validação deve seguir os canais competentes.' },
  { id: 'faq-2', question: 'Posso usar para processos em andamento no SEI-Rio?', answer: 'Sim. A CLARA pode ajudar a revisar etapas, organizar documentos, entender encaminhamentos, conferir blocos e preparar a próxima ação antes de operar no processo.' },
  { id: 'faq-3', question: 'Como funciona o modo Direto e o Didático?', answer: 'No modo Direto, a resposta vem curta e objetiva para consulta rápida. No modo Didático, a explicação é organizada em etapas para quem precisa executar o procedimento com mais segurança.' },
  { id: 'faq-4', question: 'As respostas trazem base documental?', answer: 'Quando a base local encontra respaldo para a pergunta, a resposta pode indicar os documentos consultados. Ainda assim, a validação final deve considerar os materiais oficiais usados pela sua unidade.' },
  { id: 'faq-5', question: 'A CLARA funciona em celular e desktop?', answer: 'Sim. O layout foi otimizado para ambos. No desktop, o chat é redimensionável; no mobile, funciona como sheet com pontos de ajuste.' },
];

const FAQSection = () => {
  const { openChat } = useChat();
  return (
    <section id="faq" className="faq-section py-20 md:py-24 relative" aria-labelledby="faq-heading">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="faq-shell">
            <div className="faq-header">
              <span className="knowledge-kicker">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Dúvidas Frequentes
              </span>
              <h2 id="faq-heading" className="text-h2 mt-4">Perguntas frequentes sobre uso e limites da CLARA</h2>
              <p className="text-body mt-3 max-w-3xl">Respostas objetivas sobre o que a ferramenta faz hoje, em que situações ela ajuda e quais cuidados continuam necessários no trabalho administrativo.</p>
            </div>
            <Accordion type="single" collapsible className="faq-accordion">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="faq-item">
                  <AccordionTrigger className="faq-trigger">{item.question}</AccordionTrigger>
                  <AccordionContent className="faq-content">
                    <p className="text-body mb-4">{item.answer}</p>
                    <motion.button type="button" className="knowledge-cta" whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => openChat(item.question)}>
                      Levar essa dúvida para o chat
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </motion.button>
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
