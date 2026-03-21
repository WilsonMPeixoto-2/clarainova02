import { motion } from 'motion/react';
import {
  ArrowRight,
  BookCheck,
  ClipboardList,
  FileCheck2,
  FileSearch,
  Files,
  MessagesSquare,
  Route,
  ShieldCheck,
  Signature,
  Sparkles,
} from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import ScrollReveal from '@/components/animations/ScrollReveal';
import BentoCard from '@/components/BentoCard';
import { useChat } from '@/hooks/useChatStore';

const features = [
  {
    id: 'question',
    icon: FileSearch,
    title: 'Pergunte do seu jeito',
    subtitle: 'Entrada livre, leitura precisa',
    description: 'A experiência foi desenhada para aceitar dúvidas operacionais sem exigir nome exato de tela, menu ou comando.',
    points: ['Perguntas sobre etapas, botões e caminhos', 'Consultas sobre documentos, assinatura e tramitação', 'Linguagem natural com foco em clareza operacional'],
    prompt: 'Como incluir um documento externo no SEI-Rio?',
  },
  {
    id: 'answers',
    icon: MessagesSquare,
    title: 'Respostas organizadas',
    subtitle: 'Texto que trabalha a seu favor',
    description: 'A CLARA precisa entregar um retorno com ritmo de produto: síntese, passos, destaques e cautelas quando fizer sentido.',
    points: ['Resumo inicial escaneável', 'Passo a passo quando a rotina pede sequência', 'Observações e sinais de cautela no mesmo fluxo'],
    prompt: 'Explique em passo a passo como usar um bloco de assinatura no SEI-Rio.',
  },
  {
    id: 'workflow',
    icon: BookCheck,
    title: 'Rotinas frequentes',
    subtitle: 'Onde a CLARA precisa brilhar',
    description: 'A base do produto foi pensada para apoiar tarefas recorrentes do SEI-Rio com mais velocidade, segurança visual e contexto.',
    points: ['Inclusão e conferência de documentos', 'Blocos de assinatura e circulação entre unidades', 'Encaminhamento, devolução e revisão antes do envio'],
    prompt: 'Quais etapas devo conferir antes de encaminhar um processo no SEI-Rio?',
  },
];

const bentoCards = [
  { title: 'Inclusão de documentos', description: 'Ajuda a localizar etapas para incluir documento interno ou externo, preencher campos e revisar a conferência do arquivo.', icon: Files, variant: 'highlight' as const },
  { title: 'Bloco de assinatura', description: 'Mostra como reunir documentos, disponibilizar para outras unidades e acompanhar o fluxo de assinatura.', icon: Signature, variant: 'default' as const },
  { title: 'Tramitação e envio', description: 'Orienta sobre encaminhamento, envio para uma ou mais unidades, retorno programado e anexação de processos.', icon: Route, variant: 'default' as const },
  { title: 'Conferência da instrução', description: 'Apoia a revisão de anexos, comentários, atribuição e outros pontos operacionais antes do envio.', icon: ClipboardList, variant: 'default' as const },
];

const servicePanels = [
  {
    icon: ShieldCheck,
    title: 'Linguagem natural',
    description: 'A CLARA recebe a dúvida como a pessoa realmente escreve, sem exigir jargão burocrático.',
  },
  {
    icon: FileCheck2,
    title: 'Leitura operacional',
    description: 'O retorno foi desenhado para orientar ação, checagem e próximos passos no ritmo do trabalho.',
  },
];

const experienceModes = [
  {
    title: 'Consulta rápida',
    description: 'Quando a pessoa só precisa lembrar o caminho, a resposta precisa ir direto ao ponto.',
  },
  {
    title: 'Execução guiada',
    description: 'Se a tarefa tem sequência, a CLARA deve devolver ordem, verificações e cautelas no mesmo bloco.',
  },
  {
    title: 'Sinalização de risco',
    description: 'Quando há ambiguidade ou limite de escopo, isso deve aparecer com clareza na interface.',
  },
];

const promptBank = [
  'Como montar um bloco de assinatura para outra unidade?',
  'Como conferir documentos antes de encaminhar um processo?',
  'O que preciso revisar antes de assinar no SEI-Rio?',
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
            <h2 id="features-heading" className="text-h2 mt-4">
              <Balancer>O que a CLARA já oferece como experiência de produto.</Balancer>
            </h2>
            <p className="text-body text-lg max-w-3xl mx-auto mt-4">
              <Balancer>
                A base do produto junta linguagem natural, leitura estruturada e uma superfície visual mais forte do que o padrão institucional.
              </Balancer>
            </p>
          </div>
        </ScrollReveal>

        <div className="knowledge-command-layout">
          <ScrollReveal delay={0.02}>
            <article className="knowledge-story-panel">
              <p className="knowledge-story-kicker">Superfície operacional</p>
              <h3 className="knowledge-story-title">
                <Balancer>
                  A CLARA precisa parecer um cockpit leve para dúvidas administrativas, não mais uma página genérica.
                </Balancer>
              </h3>
              <p className="knowledge-story-description">
                Hero cinematográfica, navegação mais clara, chat lateral e retorno estruturado fazem parte do mesmo sistema de experiência.
              </p>

              <div className="knowledge-insight-grid max-w-none mb-0">
                {servicePanels.map((panel) => (
                  <article key={panel.title} className="knowledge-insight-card">
                    <span className="knowledge-insight-icon" aria-hidden="true">
                      <panel.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="knowledge-insight-title">{panel.title}</p>
                      <p className="knowledge-insight-description">{panel.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="knowledge-story-actions">
                <button type="button" className="knowledge-story-cta" onClick={() => openChat()}>
                  Abrir o painel da CLARA
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="knowledge-story-link"
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver limites e cuidados de uso
                </button>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <div className="knowledge-mode-grid" aria-label="Modos de experiência">
              {experienceModes.map((mode) => (
                <article key={mode.title} className="knowledge-mode-card">
                  <span className="knowledge-mode-icon" aria-hidden="true">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="knowledge-mode-title">{mode.title}</h3>
                  <p className="knowledge-mode-description">{mode.description}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.06}>
          <div className="max-w-6xl mx-auto mb-12 md:mb-16">
            <div className="bento-divider mb-7 md:mb-8" aria-hidden="true" />
            <div className="knowledge-section-heading">
              <p className="text-caption uppercase tracking-[0.08em] text-muted-foreground">Funcionalidades centrais</p>
              <h3 className="text-h3 mt-2">
                <Balancer>Tarefas recorrentes com estética e legibilidade de produto</Balancer>
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
                  <div className="knowledge-icon" aria-hidden="true"><feature.icon className="w-6 h-6 text-primary" strokeWidth={1.6} /></div>
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
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </motion.article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.1}>
          <div className="knowledge-prompt-bank">
            <div>
              <p className="knowledge-prompt-bank-kicker">Casos para explorar agora</p>
              <h3 className="knowledge-prompt-bank-title">
                <Balancer>Perguntas que ajudam a validar a CLARA como produto, não só como backend.</Balancer>
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
