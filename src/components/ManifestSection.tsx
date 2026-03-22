import { ArrowRight, CheckCircle2, ClipboardList, ShieldCheck } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

import ScrollReveal from '@/components/animations/ScrollReveal';
import { useChat } from '@/hooks/useChatStore';

const manifestoCards = [
  {
    icon: ClipboardList,
    eyebrow: 'Entenda o caminho',
    title: 'Saiba por onde começar',
    description:
      'Receba orientação sobre etapas, caminhos e verificações comuns em tarefas do SEI-Rio.',
  },
  {
    icon: CheckCircle2,
    eyebrow: 'Confira antes de agir',
    title: 'Revise o que ainda falta',
    description:
      'Use a resposta para revisar documentos, anexos, assinatura e encaminhamento antes de seguir.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Use com segurança',
    title: 'Valide quando for necessário',
    description:
      'Quando houver exceção, dúvida normativa ou decisão formal, a conferência final continua com a sua unidade.',
  },
];

const protocolSteps = [
  {
    title: 'Descreva a dúvida',
    description: 'Explique a tarefa, a tela ou o problema do jeito que você faria para um colega.',
  },
  {
    title: 'Leia a resposta',
    description: 'Use a orientação para localizar etapas, botões, documentos e verificações importantes.',
  },
  {
    title: 'Confira a próxima ação',
    description: 'Revise o que precisa ser anexado, assinado, enviado ou confirmado antes de continuar.',
  },
  {
    title: 'Valide na rotina da unidade',
    description: 'Se houver exceção ou dúvida normativa, confirme com o procedimento oficial aplicável.',
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
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Como funciona
              </span>
              <h2 id="manifest-heading" className="text-h2 mt-4">
                <Balancer>
                  Entenda a proxima etapa com mais rapidez.
                </Balancer>
              </h2>
              <p className="manifest-lead">
                <Balancer>
                  Consulte etapas frequentes sobre documentos, assinatura, envio e organizacao de processos no SEI-Rio.
                </Balancer>
              </p>
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
                <p className="manifest-protocol-kicker">Como usar</p>
                <h3 className="manifest-protocol-title">
                  <Balancer>Pergunte, leia e confira a proxima acao.</Balancer>
                </h3>
                <p className="manifest-protocol-description">
                  A resposta organiza a execucao da tarefa, sem substituir a conferencia oficial do seu fluxo de trabalho.
                </p>
                <button type="button" className="manifest-cta" onClick={() => openChat()}>
                  Abrir o chat
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>

              <ol className="manifest-protocol-list" aria-label="Etapas de uso">
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
