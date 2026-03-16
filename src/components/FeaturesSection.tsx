import { motion } from 'motion/react';
import { FileSearch, MessagesSquare, BookCheck, ArrowUpRight, ShieldCheck, Route, FileCheck2, Files, Signature, ClipboardList } from 'lucide-react';
import ScrollReveal from '@/components/animations/ScrollReveal';
import BentoCard from '@/components/BentoCard';
import { useChat } from '@/hooks/useChatStore';

const features = [
  {
    id: 'question',
    icon: FileSearch,
    title: 'Pergunte do seu jeito',
    subtitle: 'Dúvidas de rotina em linguagem natural',
    description: 'Descreva a tarefa como você explicaria para um colega. A CLARA organiza a resposta com foco na ação que precisa ser feita no SEI-Rio.',
    points: ['Consultas sobre telas, etapas e comandos do sistema', 'Continuidade de contexto dentro da conversa', 'Menos necessidade de traduzir a dúvida para linguagem técnica'],
    prompt: 'Como incluir um documento externo no SEI-Rio?',
  },
  {
    id: 'answers',
    icon: MessagesSquare,
    title: 'Resposta direta ou passo a passo',
    subtitle: 'Do resumo rápido ao modo didático',
    description: 'Você pode pedir uma resposta curta para consulta imediata ou uma explicação em etapas quando precisar executar o procedimento com mais calma.',
    points: ['Modo Direto para consultas rápidas', 'Modo Didático com sequência de etapas', 'Indicação das fontes da base quando houver respaldo'],
    prompt: 'Explique em passo a passo como usar um bloco de assinatura no SEI-Rio.',
  },
  {
    id: 'workflow',
    icon: BookCheck,
    title: 'Apoio à execução processual',
    subtitle: 'Documentos, assinatura e tramitação com mais clareza',
    description: 'A CLARA ajuda a revisar o fluxo antes da ação, reduzindo dúvidas sobre anexos, encaminhamentos, atribuições e conferências operacionais.',
    points: ['Organização de documentos e anexos', 'Apoio ao uso de blocos e encaminhamentos', 'Checagem operacional antes do envio'],
    prompt: 'Quais etapas devo conferir antes de encaminhar um processo no SEI-Rio?',
  },
];

const bentoCards = [
  { title: 'Inclusão de documentos', description: 'Ajuda a localizar etapas para incluir documento interno ou externo, preencher campos e revisar a conferência do arquivo.', icon: Files, variant: 'highlight' as const },
  { title: 'Bloco de assinatura', description: 'Mostra como reunir documentos, disponibilizar para outras unidades e acompanhar o fluxo de assinatura.', icon: Signature, variant: 'default' as const },
  { title: 'Tramitação e envio', description: 'Orienta sobre encaminhamento, envio para uma ou mais unidades, retorno programado e anexação de processos.', icon: Route, variant: 'default' as const },
  { title: 'Conferência da instrução', description: 'Apoia a revisão de anexos, comentários, atribuição e outros pontos operacionais antes do envio.', icon: ClipboardList, variant: 'default' as const },
];

const FeaturesSection = () => {
  const { openChat } = useChat();

  return (
    <section id="conhecimento" className="knowledge-section py-20 md:py-28 relative overflow-hidden" aria-labelledby="features-heading">
      <div className="knowledge-ambient-media" aria-hidden="true">
        <img
          className="knowledge-ambient-video"
          src="/videos/energy-flow-poster-4k.jpg"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <div id="features" className="absolute -top-20" aria-hidden="true" />
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="knowledge-header max-w-4xl mx-auto text-center mb-12 md:mb-16">
            <span className="knowledge-kicker">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Funcionalidades da CLARA
            </span>
            <h2 id="features-heading" className="text-h2 mt-4">Apoio prático para rotinas no SEI-Rio</h2>
            <p className="text-body text-lg max-w-3xl mx-auto mt-4">A CLARA foi desenhada para orientar tarefas frequentes do sistema, com foco em documentos, assinatura, tramitação e conferência de etapas.</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.04}>
          <div className="max-w-6xl mx-auto mb-12 md:mb-16">
            <div className="bento-divider mb-7 md:mb-8" aria-hidden="true" />
            <div className="text-center md:text-left mb-5 md:mb-6">
              <p className="text-caption uppercase tracking-[0.08em] text-muted-foreground">Funcionalidades centrais</p>
              <h3 className="text-h3 mt-2">Onde a CLARA ajuda hoje</h3>
            </div>
            <div className="bento-services-grid">
              {bentoCards.map((card) => (
                <BentoCard key={card.title} title={card.title} description={card.description} icon={card.icon} variant={card.variant} />
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div className="knowledge-grid" role="list" aria-label="Recursos da CLARA">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.id} delay={index * 0.08}>
              <motion.article className="knowledge-card group h-full" role="listitem" whileHover={{ y: -4, rotateX: 1.2, rotateY: index === 1 ? 0.8 : -0.8 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                <div className="knowledge-card-head">
                  <div className="knowledge-icon" aria-hidden="true"><feature.icon className="w-6 h-6 text-primary" strokeWidth={1.6} /></div>
                  <span className="knowledge-index">0{index + 1}</span>
                </div>
                <h3 className="knowledge-title mt-5">{feature.title}</h3>
                <p className="knowledge-subtitle">{feature.subtitle}</p>
                <p className="text-body mt-4">{feature.description}</p>
                <ul className="knowledge-points" aria-label={`Diferenciais de ${feature.title}`}>
                  {feature.points.map((point) => (<li key={point}>{point}</li>))}
                </ul>
                <motion.button type="button" className="knowledge-cta" whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => openChat(feature.prompt)}>
                  Levar essa tarefa ao chat <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </motion.button>
              </motion.article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
