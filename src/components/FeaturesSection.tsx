import { motion } from 'motion/react';
<<<<<<< HEAD
import { FileText, MagnifyingGlass, ShieldCheck, ChatCircleText, Clock, CheckCircle, PenNib } from '@phosphor-icons/react';
=======
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  FileSignature,
  FileSearch,
  ListChecks,
  SendHorizontal,
  ShieldCheck,
} from 'lucide-react';
>>>>>>> origin/main
import Balancer from 'react-wrap-balancer';
import ScrollReveal from '@/components/animations/ScrollReveal';
import BentoCard from '@/components/BentoCard';
import { useChat } from '@/hooks/useChatStore';

const features = [
  {
<<<<<<< HEAD
    id: 'question',
    icon: MagnifyingGlass,
    title: 'Pergunte do seu jeito',
    subtitle: 'Dúvidas operacionais em linguagem natural',
    description: 'Você pode escrever a pergunta de forma simples, sem precisar usar termos técnicos do sistema.',
    points: ['Perguntas sobre telas, etapas e comandos', 'Consultas sobre documentos e tramitação', 'Uso de linguagem simples'],
    prompt: 'Como incluir um documento externo no SEI-Rio?',
  },
  {
    id: 'answers',
    icon: ChatCircleText,
    title: 'Respostas organizadas',
    subtitle: 'Consulta rápida ou explicação em etapas',
    description: 'A resposta pode ser mais curta para consulta imediata ou mais detalhada quando a tarefa exigir sequência.',
    points: ['Resumo objetivo', 'Explicação passo a passo quando aplicável', 'Texto pensado para leitura rápida'],
    prompt: 'Explique em passo a passo como usar um bloco de assinatura no SEI-Rio.',
  },
  {
    id: 'workflow',
    icon: FileText,
    title: 'Rotinas frequentes',
    subtitle: 'Documentos, assinatura e tramitação',
    description: 'A ferramenta foi pensada para apoiar tarefas recorrentes do uso do SEI-Rio.',
    points: ['Inclusão de documentos', 'Blocos de assinatura', 'Encaminhamento e conferência de etapas'],
=======
    id: 'consulta',
    icon: FileSearch,
    title: 'Consulta rápida',
    subtitle: 'Onde clicar e como seguir',
    description: 'Quando a dúvida é objetiva, a CLARA ajuda a localizar a etapa e lembrar o caminho com mais clareza.',
    points: ['Etapas, botões e caminhos do sistema', 'Perguntas sobre documentos, assinatura e envio'],
    prompt: 'Como incluir um documento externo no SEI-Rio?',
  },
  {
    id: 'passo-a-passo',
    icon: ListChecks,
    title: 'Passo a passo',
    subtitle: 'Para executar com mais segurança',
    description: 'Quando a tarefa exige sequência, a resposta organiza o procedimento em etapas claras e mais fáceis de acompanhar.',
    points: ['Orientação em ordem lógica', 'Resumo do que precisa ser conferido antes de continuar'],
    prompt: 'Explique em passo a passo como usar um bloco de assinatura no SEI-Rio.',
  },
  {
    id: 'conferencia',
    icon: ClipboardCheck,
    title: 'Conferência antes do envio',
    subtitle: 'Revise o que ainda falta',
    description: 'A CLARA também ajuda a revisar pendências antes de assinar, encaminhar ou concluir uma rotina no processo.',
    points: ['Anexos, assinatura e encaminhamento', 'Checagens rápidas antes da próxima ação'],
>>>>>>> origin/main
    prompt: 'Quais etapas devo conferir antes de encaminhar um processo no SEI-Rio?',
  },
];

const bentoCards = [
  { title: 'Inclusão de documentos', description: 'Ajuda a localizar etapas para incluir documento interno ou externo, preencher campos e revisar a conferência do arquivo.', icon: FileText, variant: 'highlight' as const },
<<<<<<< HEAD
  { title: 'Bloco de assinatura', description: 'Mostra como reunir documentos, disponibilizar para outras unidades e acompanhar o fluxo de assinatura.', icon: PenNib, variant: 'default' as const },
  { title: 'Tramitação e envio', description: 'Orienta sobre encaminhamento, envio para uma ou mais unidades, retorno programado e anexação de processos.', icon: CheckCircle, variant: 'default' as const },
  { title: 'Conferência da instrução', description: 'Apoia a revisão de anexos, comentários, atribuição e outros pontos operacionais antes do envio.', icon: FileText, variant: 'default' as const },
];

const servicePanels = [
  {
    icon: ShieldCheck,
    title: 'Uso simples',
    description: 'A proposta é facilitar a consulta sobre o sistema com linguagem direta.',
  },
  {
    icon: FileText,
    title: 'Foco operacional',
    description: 'O conteúdo é voltado ao uso do SEI-Rio e a tarefas administrativas do dia a dia.',
  },
=======
  { title: 'Bloco de assinatura', description: 'Mostra como reunir documentos, disponibilizar para outras unidades e acompanhar o fluxo de assinatura.', icon: FileSignature, variant: 'default' as const },
  { title: 'Tramitação e envio', description: 'Orienta sobre encaminhamento, envio para uma ou mais unidades, retorno programado e anexação de processos.', icon: SendHorizontal, variant: 'default' as const },
  { title: 'Conferência da instrução', description: 'Apoia a revisão de anexos, comentários, atribuição e outros pontos operacionais antes do envio.', icon: ClipboardCheck, variant: 'default' as const },
];

const promptBank = [
  'Como montar um bloco de assinatura para outra unidade?',
  'Como conferir documentos antes de encaminhar um processo?',
  'O que preciso revisar antes de assinar no SEI-Rio?',
>>>>>>> origin/main
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
              Funcionalidades
            </span>
            <h2 id="features-heading" className="text-h2 mt-4">
              <Balancer>Consultas uteis para o dia a dia.</Balancer>
            </h2>
            <p className="text-body text-lg max-w-3xl mx-auto mt-4">
              <Balancer>
                Duvidas frequentes sobre documentos, bloco de assinatura, tramitacao e conferencia antes do envio.
              </Balancer>
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.06}>
          <div className="max-w-6xl mx-auto mb-12 md:mb-16">
            <div className="bento-divider mb-7 md:mb-8" aria-hidden="true" />
            <div className="knowledge-section-heading">
              <p className="text-caption uppercase tracking-[0.08em] text-muted-foreground">Consultas frequentes</p>
              <h3 className="text-h3 mt-2">
                <Balancer>Rotinas recorrentes com leitura clara e direta.</Balancer>
              </h3>
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
                  <div className="knowledge-icon" aria-hidden="true"><feature.icon className="w-6 h-6 text-primary" weight="duotone" /></div>
                  <span className="knowledge-index">0{index + 1}</span>
                </div>
                <h3 className="knowledge-title mt-5">{feature.title}</h3>
                <p className="knowledge-subtitle">{feature.subtitle}</p>
                <p className="text-body mt-4">{feature.description}</p>
                <ul className="knowledge-points" aria-label={`Diferenciais de ${feature.title}`}>
                  {feature.points.map((point) => (<li key={point}>{point}</li>))}
                </ul>
                <button type="button" className="knowledge-card-cta" onClick={() => openChat(feature.prompt)}>
                  Testar este caso no chat
                  <ArrowRight weight="bold" size={15} aria-hidden="true" />
                </button>
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
