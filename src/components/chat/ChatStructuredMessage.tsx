import { useCallback, useState } from 'react';
import { Warning, CheckCircle, CaretDown, CaretUp, CopySimple, FileText, Info, Question, ShieldWarning } from "@phosphor-icons/react";

import {
  type ClaraReference,
  type ClaraStructuredResponse,
  formatReferenceAbnt,
  renderStructuredResponseToPlainText,
} from '@/lib/clara-response';
import type { ChatResponseMode } from '@/lib/chat-response-mode';
import { ChatFeedbackControls } from '@/components/chat/ChatFeedbackControls';

function resolveStructuredResponseMode(
  response: ClaraStructuredResponse,
  responseMode?: ChatResponseMode,
): ChatResponseMode {
  if (responseMode === 'direto' || responseMode === 'didatico') {
    return responseMode;
  }

  if (response.modoResposta === 'checklist' || response.modoResposta === 'explicacao') {
    return 'direto';
  }

  return 'didatico';
}

function getResponseModeMeta(mode: ChatResponseMode) {
  if (mode === 'direto') {
    return {
      kicker: 'Resposta direta',
      summaryLabel: 'Resposta',
      stepTitle: 'Passos',
      stepDetail: 'O essencial para agir com segurança',
      observationsTitle: 'Antes de concluir',
      observationsDetail: 'Conferências rápidas antes de finalizar',
    };
  }

  return {
    kicker: 'Resposta explicada',
    summaryLabel: 'Resposta',
    stepTitle: 'Passos',
    stepDetail: 'Explicação principal em ordem de execução',
    observationsTitle: 'Antes de concluir',
    observationsDetail: 'Cuidados e verificações finais',
  };
}

const COLLAPSED_ITEM_LIMIT = 3;

function ExpandableItemList({ items, stepNumber }: { items: string[]; stepNumber: number }) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = items.length > COLLAPSED_ITEM_LIMIT;
  const visibleItems = shouldCollapse && !expanded ? items.slice(0, COLLAPSED_ITEM_LIMIT) : items;

  return (
    <>
      <ul className="chat-step-list">
        {visibleItems.map((item) => (
          <li key={`${stepNumber}-${item}`}>{item}</li>
        ))}
      </ul>
      {shouldCollapse && (
        <button
          type="button"
          className="chat-expand-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded
            ? 'Recolher'
            : `Mais ${items.length - COLLAPSED_ITEM_LIMIT} iten${items.length - COLLAPSED_ITEM_LIMIT > 1 ? 's' : ''}`}
          {expanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
        </button>
      )}
    </>
  );
}

function scrollToReference(citationId: number) {
  const el = document.getElementById(`clara-ref-${citationId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('chat-reference-highlight');
    setTimeout(() => el.classList.remove('chat-reference-highlight'), 1500);
  }
}

function scrollToCitation(citationId: number) {
  const el = document.getElementById(`clara-cite-${citationId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('chat-citation-highlight');
    setTimeout(() => el.classList.remove('chat-citation-highlight'), 1500);
  }
}

function CitationList({ citations }: { citations: number[] }) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <span className="chat-citation-inline" aria-label={`Referencias ${citations.join(', ')}`}>
      {citations.map((citation, index) => (
        <sup
          key={citation}
          id={index === 0 ? `clara-cite-${citation}` : undefined}
          className="chat-citation-badge chat-citation-clickable"
          role="button"
          tabIndex={0}
          onClick={() => scrollToReference(citation)}
          onKeyDown={(e) => e.key === 'Enter' && scrollToReference(citation)}
        >
          {citation}
        </sup>
      ))}
    </span>
  );
}

function ReferenceItem({ reference }: { reference: ClaraReference }) {
  return (
    <li id={`clara-ref-${reference.id}`} className="chat-reference-item">
      <span className="chat-reference-index">{reference.id}</span>
      <span>{formatReferenceAbnt(reference)}</span>
      <button
        type="button"
        className="chat-reference-back-link"
        onClick={() => scrollToCitation(reference.id)}
        onKeyDown={(e) => e.key === 'Enter' && scrollToCitation(reference.id)}
        aria-label={`Voltar à citação ${reference.id}`}
      >
        ↑ Citação
      </button>
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

export function ChatStructuredMessage({
  response,
  responseMode,
  requestId,
}: {
  response: ClaraStructuredResponse;
  responseMode?: ChatResponseMode;
  requestId?: string | null;
}) {
  const [showReferences, setShowReferences] = useState(true);
  const [copied, setCopied] = useState(false);
  const analysis = response.analiseDaResposta;
  const resolvedMode = resolveStructuredResponseMode(response, responseMode);
  const modeMeta = getResponseModeMeta(resolvedMode);

  const handleCopy = useCallback(() => {
    const plainText = renderStructuredResponseToPlainText(response);
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(false);
    });
  }, [response]);
  const responseMeta = [
    response.etapas.length > 0 ? `${response.etapas.length} etapa${response.etapas.length > 1 ? 's' : ''}` : null,
    response.referenciasFinais.length > 0
      ? `${response.referenciasFinais.length} fonte${response.referenciasFinais.length > 1 ? 's' : ''}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className="chat-structured-response"
      data-response-mode={resolvedMode}
      data-response-layout={response.modoResposta}
      data-needs-clarification={analysis.clarificationRequested ? 'true' : undefined}
    >
      <div className="chat-response-intro">
        <div className="chat-response-kicker">
          <span className="chat-response-avatar" aria-hidden="true">
            <img
              src="/brand/clara-avatar-chat-64.png"
              alt=""
              className="chat-response-avatar-mark"
              decoding="async"
              loading="eager"
              draggable={false}
            />
          </span>
          {modeMeta.kicker}
          <button
            type="button"
            className="chat-copy-button"
            onClick={handleCopy}
            aria-label={copied ? 'Copiado' : 'Copiar resposta'}
          >
            <CopySimple size={13} />
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
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
          <p className="chat-response-summary-label">{modeMeta.summaryLabel}</p>
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
      </div>


      {response.etapas.length > 0 && (
        <section className="chat-section-shell" aria-label="Etapas sugeridas">
          <SectionHeading
            icon={CheckCircle}
            title={modeMeta.stepTitle}
            detail={modeMeta.stepDetail}
          />
          {response.etapas.length > 1 && (
            <div className="chat-step-progress" aria-label={`${response.etapas.length} etapas`}>
              <span className="chat-step-progress-label">{response.etapas.length} etapas</span>
              <div className="chat-step-progress-dots">
                {response.etapas.map((step) => (
                  <span
                    key={step.numero}
                    className="chat-step-progress-dot is-filled"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}
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
                  <ExpandableItemList items={step.itens} stepNumber={step.numero} />
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
            title={modeMeta.observationsTitle}
            detail={modeMeta.observationsDetail}
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
                <span>Fontes</span>
              </span>
              <span className="chat-section-detail">
                {response.referenciasFinais.length} fonte{response.referenciasFinais.length > 1 ? 's' : ''}
              </span>
            </span>
            {showReferences ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>
          {showReferences && (
            <>
              <p className="chat-reference-intro">
                Se quiser conferir o texto original, use as fontes abaixo.
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

      <ChatFeedbackControls requestId={requestId} />
    </div>
  );
}
