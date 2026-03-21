import { ArrowRight, BrainCircuit, FileStack, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

import ScrollReveal from '@/components/animations/ScrollReveal';
import { useChat } from '@/hooks/useChatStore';

const manifestoCards = [
  {
    icon: Sparkles,
    eyebrow: 'Superfície',
    title: 'Produto com presença própria',
    description:
      'A CLARA não foi desenhada como um site burocrático. A linguagem visual assume sofisticação, atmosfera e ritmo de produto digital.',
  },
  {
    icon: Workflow,
    eyebrow: 'Fluxo',
    title: 'Pergunta natural, leitura operacional',
    description:
      'A experiência nasce para transformar dúvidas em leitura rápida, etapas claras, cautelas e próximos movimentos.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Controle',
    title: 'Autonomia com validação humana',
    description:
      'A CLARA acelera entendimento e preparo, mas mantém explícito quando a checagem institucional continua indispensável.',
  },
];

const protocolSteps = [
  {
    title: 'Entrada conversacional',
    description: 'A pergunta chega em linguagem natural, sem exigir jargão técnico ou nomes exatos de menu.',
  },
  {
    title: 'Triagem semântica',
    description: 'A arquitetura de RAG organiza contexto, prioriza materiais e separa o que é apoio do que exige cautela.',
  },
  {
    title: 'Resposta estruturada',
    description: 'O retorno aparece em blocos escaneáveis, com etapas, observações, sinais de risco e referências.',
  },
  {
    title: 'Validação final',
    description: 'A decisão operacional continua humana, só que agora melhor informada e com menos fricção.',
  },
];

const signalFacts = [
  {
    icon: BrainCircuit,
    label: 'Camada inteligente',
    value: 'RAG orientado por procedimento',
  },
  {
    icon: FileStack,
    label: 'Superfície visual',
    value: 'Landing, chat e leitura pensados como produto',
  },
];

const ManifestSection = () => {
  const { openChat } = useChat();

  return (
    <section id="sistema" className="manifest-section" aria-labelledby="manifest-heading">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="manifest-shell">
            <div className="manifest-copy">
              <span className="manifest-kicker">
                <BrainCircuit className="w-3.5 h-3.5" aria-hidden="true" />
                Conceito do produto
              </span>
              <h2 id="manifest-heading" className="text-h2 mt-4">
                <Balancer>
                  CLARA como ferramenta institucional premium e experiência futurista ao mesmo tempo.
                </Balancer>
              </h2>
              <p className="manifest-lead">
                <Balancer>
                  A proposta não é imitar um portal administrativo. É criar uma interface própria, elegante e avançada para
                  uma tarefa institucional concreta: entender o SEI-Rio com mais clareza.
                </Balancer>
              </p>
            </div>

            <div className="manifest-signal-band" aria-label="Sinais da CLARA">
              {signalFacts.map((fact) => (
                <article key={fact.label} className="manifest-signal-card">
                  <span className="manifest-signal-icon" aria-hidden="true">
                    <fact.icon className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="manifest-signal-label">{fact.label}</p>
                    <p className="manifest-signal-value">{fact.value}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="manifest-grid">
              {manifestoCards.map((card) => (
                <article key={card.title} className="manifest-card">
                  <span className="manifest-card-icon" aria-hidden="true">
                    <card.icon className="w-5 h-5" />
                  </span>
                  <p className="manifest-card-eyebrow">{card.eyebrow}</p>
                  <h3 className="manifest-card-title">{card.title}</h3>
                  <p className="manifest-card-description">{card.description}</p>
                </article>
              ))}
            </div>

            <div className="manifest-protocol">
              <div className="manifest-protocol-copy">
                <p className="manifest-protocol-kicker">Arquitetura da experiência</p>
                <h3 className="manifest-protocol-title">
                  <Balancer>Da pergunta ao próximo passo, a CLARA precisa parecer produto de verdade.</Balancer>
                </h3>
                <p className="manifest-protocol-description">
                  Por isso a navegação, o chat lateral, os modos de leitura e a resposta estruturada precisam conversar entre si.
                </p>
                <button type="button" className="manifest-cta" onClick={() => openChat()}>
                  Abrir o painel conversacional
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>

              <ol className="manifest-protocol-list" aria-label="Etapas da experiência">
                {protocolSteps.map((step, index) => (
                  <li key={step.title} className="manifest-protocol-step">
                    <span className="manifest-protocol-index">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="manifest-protocol-step-title">{step.title}</p>
                      <p className="manifest-protocol-step-description">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ManifestSection;
