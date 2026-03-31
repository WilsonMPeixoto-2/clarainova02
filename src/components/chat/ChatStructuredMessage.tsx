import { useMemo, useState } from 'react';
import { Warning, CheckCircle, CircleDashed, CaretDown, CaretUp, FileText, Globe, Info, Question, ShieldWarning } from "@phosphor-icons/react";

import {
  type ClaraHighlight,
  type ClaraProcessState,
  type ClaraReference,
  type ClaraStructuredResponse,
  formatReferenceAbnt,
} from '@/lib/clara-response';

function highlightLabel(highlight: ClaraHighlight) {
  switch (highlight.tipo) {
    case 'botao':
      return 'Botao';
    case 'icone':
      return 'Icone';
    case 'atencao':
      return 'Atencao';
    case 'norma':
      return 'Fonte';
    case 'prazo':
      return 'Prazo';
    case 'menu':
      return 'Menu';
    case 'acao':
      return 'Acao';
    default:
      return 'Conceito';
  }
}

function getProcessStateMeta(state: ClaraProcessState) {
  switch (state.status) {
    case 'concluido':
      return {
        label: 'Concluído',
        icon: CheckCircle,
        className: 'chat-process-state is-complete',
      };
    case 'cautela':
      return {
        label: 'Atenção',
        icon: Warning,
        className: 'chat-process-state is-caution',
      };
    case 'web':
      return {
        label: 'Oficial',
        icon: Globe,
        className: 'chat-process-state is-web',
      };
    default:
      return {
        label: 'Informativo',
        icon: CircleDashed,
        className: 'chat-process-state is-info',
      };
  }
}


function CitationList({ citations }: { citations: number[] }) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <span className="chat-citation-inline" aria-label={`Referencias ${citations.join(', ')}`}>
      {citations.map((citation) => (
        <sup key={citation} className="chat-citation-badge">
          {citation}
        </sup>
      ))}
    </span>
  );
}

function ReferenceItem({ reference }: { reference: ClaraReference }) {
  return (
    <li className="chat-reference-item">
      <span className="chat-reference-index">{reference.id}</span>
      <span>{formatReferenceAbnt(reference)}</span>
    </li>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof FileText;
  title: string;
  detail?: string;
}) {
  return (
    <div className="chat-section-heading">
      <div className="chat-section-title">
        <Icon size={15} />
        <span>{title}</span>
      </div>
      {detail && <span className="chat-section-detail">{detail}</span>}
    </div>
  );
}

export function ChatStructuredMessage({ response }: { response: ClaraStructuredResponse }) {
  const [showReferences, setShowReferences] = useState(true);
  const analysis = response.analiseDaResposta;
  const groupedHighlights = useMemo(() => response.termosDestacados.slice(0, 8), [response.termosDestacados]);
  const processStates = useMemo(() => analysis.processStates.slice(0, 4), [analysis.processStates]);
  const responseMeta = [
    response.etapas.length > 0 ? `${response.etapas.length} etapa${response.etapas.length > 1 ? 's' : ''}` : null,
    response.referenciasFinais.length > 0
      ? `${response.referenciasFinais.length} referência${response.referenciasFinais.length > 1 ? 's' : ''}`
      : null,
    analysis.cautionNotice ? 'Exige atenção' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="chat-structured-response">
      <div className="chat-response-intro">
        <div className="chat-response-kicker">
          <FileText size={14} />
          Orientação estruturada
        </div>
        <h3 className="chat-response-title">{response.tituloCurto}</h3>
        {responseMeta.length > 0 && (
          <div className="chat-response-meta-row" aria-label="Resumo da resposta">
            {responseMeta.map((item) => (
              <span key={item} className="chat-response-meta-badge">
                {item}
              </span>
            ))}
          </div>
        )}
        <div className="chat-response-summary-block">
          <p className="chat-response-summary-label">Leitura inicial</p>
          <p className="chat-response-summary">
            {response.resumoInicial}
            <CitationList citations={response.resumoCitacoes} />
          </p>
        </div>


        {analysis.clarificationRequested && analysis.clarificationQuestion && (
          <section className="chat-clarification-card" aria-label="Pedido de esclarecimento">
            <div className="chat-clarification-title">
              <Question size={16} />
              Antes de te orientar melhor
            </div>
            {analysis.clarificationReason && (
              <p className="chat-clarification-body">{analysis.clarificationReason}</p>
            )}
            <p className="chat-clarification-question">{analysis.clarificationQuestion}</p>
          </section>
        )}

        {(analysis.userNotice || analysis.cautionNotice) && (
          <div className="chat-analysis-stack">
            {analysis.userNotice && (
              <section className="chat-analysis-card" aria-label="Leitura da resposta">
                <div className="chat-analysis-title">
                  <Info size={15} />
                  Contexto útil
                </div>
                <p className="chat-analysis-body">{analysis.userNotice}</p>
              </section>
            )}

            {analysis.cautionNotice && (
              <section className="chat-analysis-card is-caution" aria-label="Cautela">
                <div className="chat-analysis-title">
                  <Warning size={15} />
                  Ponto de atenção
                </div>
                <p className="chat-analysis-body">{analysis.cautionNotice}</p>
              </section>
            )}
          </div>
        )}

        {processStates.length > 0 && (
          <section className="chat-process-rail" aria-label="Estados da resposta">
            {processStates.map((state) => {
              const meta = getProcessStateMeta(state);
              const Icon = meta.icon;

              return (
                <article key={state.id} className={meta.className}>
                  <div className="chat-process-state-head">
                    <span className="chat-process-state-icon" aria-hidden="true">
                      <Icon size={14} />
                    </span>
                    <span className="chat-process-state-label">{meta.label}</span>
                  </div>
                  <p className="chat-process-state-title">{state.titulo}</p>
                  <p className="chat-process-state-copy">{state.descricao}</p>
                </article>
              );
            })}
          </section>
        )}

        {groupedHighlights.length > 0 && (
          <section className="chat-section-shell" aria-label="Destaques da resposta">
            <SectionHeading
              icon={Info}
              title="Pontos-chave"
              detail={`${groupedHighlights.length} destaque${groupedHighlights.length > 1 ? 's' : ''}`}
            />
            <div className="chat-highlight-cloud">
              {groupedHighlights.map((highlight) => (
                <span key={`${highlight.tipo}-${highlight.texto}`} className={`chat-highlight-badge chat-highlight-${highlight.tipo}`}>
                  <span className="chat-highlight-label">{highlightLabel(highlight)}</span>
                  <span>{highlight.texto}</span>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>


      {response.etapas.length > 0 && (
        <section className="chat-section-shell" aria-label="Etapas sugeridas">
          <SectionHeading
            icon={CheckCircle}
            title="Passo a passo"
            detail={`${response.etapas.length} etapa${response.etapas.length > 1 ? 's' : ''} para executar`}
          />
          <div className="chat-step-grid" role="list">
            {response.etapas.map((step) => (
              <article key={step.numero} className="chat-step-card" role="listitem">
                <div className="chat-step-header">
                  <span className="chat-step-number">{String(step.numero).padStart(2, '0')}</span>
                  <div className="chat-step-heading">
                    <h4>{step.titulo}</h4>
                    {step.citacoes.length > 0 && <CitationList citations={step.citacoes} />}
                  </div>
                </div>

                <p className="chat-step-body">{step.conteudo}</p>

                {step.destaques.length > 0 && (
                  <div className="chat-step-highlights">
                    {step.destaques.map((highlight) => (
                      <span key={`${step.numero}-${highlight}`} className="chat-step-chip">
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}

                {step.itens.length > 0 && (
                  <ul className="chat-step-list">
                    {step.itens.map((item) => (
                      <li key={`${step.numero}-${item}`}>{item}</li>
                    ))}
                  </ul>
                )}

                {step.alerta && (
                  <div className="chat-step-alert" role="note">
                    <ShieldWarning size={15} />
                    <span>{step.alerta}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {response.observacoesFinais.length > 0 && (
        <section className="chat-observation-card" aria-label="Observacoes finais">
          <SectionHeading
            icon={ShieldWarning}
            title="Observações finais"
            detail={`${response.observacoesFinais.length} ponto${response.observacoesFinais.length > 1 ? 's' : ''}`}
          />
          <ul className="chat-observation-list">
            {response.observacoesFinais.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </section>
      )}


      {response.referenciasFinais.length > 0 && (
        <section className="chat-references-card" aria-label="Referencias">
          <button
            type="button"
            className="chat-references-toggle"
            onClick={() => setShowReferences((current) => !current)}
          >
            <span className="chat-references-toggle-copy">
              <span className="chat-section-title">
                <FileText size={15} />
                <span>Fontes consultadas</span>
              </span>
              <span className="chat-section-detail">
                {response.referenciasFinais.length} referência{response.referenciasFinais.length > 1 ? 's' : ''} de apoio
              </span>
            </span>
            {showReferences ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>
          {showReferences && (
            <>
              <p className="chat-reference-intro">
                As fontes abaixo sustentam os trechos com respaldo documental apresentados nesta resposta.
              </p>
              <ol className="chat-reference-list">
                {response.referenciasFinais.map((reference) => (
                  <ReferenceItem key={reference.id} reference={reference} />
                ))}
              </ol>
            </>
          )}
        </section>
      )}
    </div>
  );
}
