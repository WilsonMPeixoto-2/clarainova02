import { motion } from 'motion/react';
import { FileText, MagnifyingGlass, ChatCircleText, CheckCircle, PenNib } from '@phosphor-icons/react';
import Balancer from 'react-wrap-balancer';
import ScrollReveal from '@/components/animations/ScrollReveal';
import BentoCard from '@/components/BentoCard';
import { useChat } from '@/hooks/useChatStore';

const features = [
  {
    id: 'question',
    icon: MagnifyingGlass,
    title: 'Pergunte do seu jeito',
    subtitle: 'Dúvidas operacionais em linguagem natural',
    description: 'Você pode escrever a pergunta de forma simples, sem precisar usar termos técnicos do sistema.',
    points: ['Perguntas sobre telas, etapas e comandos', 'Consultas sobre documentos e tramitação', 'Uso de linguagem simples'],
  },
  {
    id: 'answers',
    icon: ChatCircleText,
    title: 'Respostas organizadas',
    subtitle: 'Consulta rápida ou explicação em etapas',
    description: 'A resposta pode ser mais curta para consulta imediata ou mais detalhada quando a tarefa exigir sequência.',
    points: ['Resumo objetivo', 'Explicação passo a passo quando aplicável', 'Texto pensado para leitura rápida'],
  },
  {
    id: 'workflow',
    icon: FileText,
    title: 'Rotinas frequentes',
    subtitle: 'Documentos, assinatura e tramitação',
    description: 'A ferramenta foi pensada para apoiar tarefas recorrentes do uso do SEI-Rio.',
    points: ['Inclusão de documentos', 'Blocos de assinatura', 'Encaminhamento e conferência de etapas'],
  },
];

const bentoCards = [
  { title: 'Inclusão de documentos', description: 'Ajuda a localizar etapas para incluir documento interno ou externo, preencher campos e revisar a conferência do arquivo.', icon: FileText, variant: 'highlight' as const },
  { title: 'Bloco de assinatura', description: 'Mostra como reunir documentos, disponibilizar para outras unidades e acompanhar o fluxo de assinatura.', icon: PenNib, variant: 'default' as const },
  { title: 'Tramitação e envio', description: 'Orienta sobre encaminhamento, envio para uma ou mais unidades, retorno programado e anexação de processos.', icon: CheckCircle, variant: 'default' as const },
  { title: 'Conferência da instrução', description: 'Apoia a revisão de anexos, comentários, atribuição e outros pontos operacionais antes do envio.', icon: FileText, variant: 'default' as const },
];

const promptBank = [
  'Como montar um bloco de assinatura para outra unidade?',
  'Como conferir documentos antes de encaminhar um processo?',
  'O que preciso revisar antes de assinar no SEI-Rio?',
];

const FeaturesSection = () => {
  const { openChat } = useChat();

  return (
    <section id="conhecimento" className="knowledge-section aurora-bg py-20 md:py-28 relative overflow-hidden" aria-labelledby="features-heading">
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
            <span className="knowledge-kicker flex justify-center text-sm font-semibold tracking-widest text-[hsl(var(--gold-1))] uppercase">
              Funcionalidades
            </span>
            <h2 id="features-heading" className="text-h2 mt-4">
              <Balancer>Consultas úteis para o dia a dia.</Balancer>
            </h2>
            <p className="text-body text-lg max-w-3xl mx-auto mt-4">
              <Balancer>
                Dúvidas frequentes sobre documentos, bloco de assinatura, tramitação e conferência antes do envio.
              </Balancer>
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.06}>
          <div className="max-w-6xl mx-auto mb-12 md:mb-16">
            <div className="bento-divider mb-7 md:mb-8" aria-hidden="true" />
            <div className="bento-services-grid">
              {bentoCards.map((card) => (
                <BentoCard key={card.title} title={card.title} description={card.description} icon={card.icon} variant={card.variant} />
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div className="knowledge-grid">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.id} delay={index * 0.08}>
              <motion.article className="knowledge-card group h-full" whileHover={{ y: -4, rotateX: 1.2, rotateY: index === 1 ? 0.8 : -0.8 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                <div className="knowledge-card-head justify-end w-full">
                  <span className="knowledge-index opacity-60 font-medium text-2xl">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-[hsl(var(--gold-1))] leading-tight mt-6">{feature.subtitle}</h3>
                <p className="text-body mt-4 text-muted-foreground leading-relaxed">{feature.description}</p>
                <ul className="knowledge-points mt-6" aria-label={`Diferenciais de ${feature.title}`}>
                  {feature.points.map((point) => (<li key={point}>{point}</li>))}
                </ul>
              </motion.article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.1}>
          <div className="knowledge-prompt-bank">
            <div>
              <p className="knowledge-prompt-bank-kicker">Exemplos para testar agora</p>
              <h3 className="knowledge-prompt-bank-title">
                <Balancer>Comece por uma destas perguntas.</Balancer>
              </h3>
            </div>
            <div className="knowledge-prompt-bank-grid">
              {promptBank.map((prompt) => (
                <button key={prompt} type="button" className="knowledge-prompt-bank-chip" onClick={() => openChat(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FeaturesSection;
