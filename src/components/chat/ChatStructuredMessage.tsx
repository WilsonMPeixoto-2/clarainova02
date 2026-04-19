import { useCallback, useMemo, useRef, useState } from 'react';
import { Warning, CheckCircle, CircleDashed, CaretDown, CaretUp, CopySimple, FileText, Globe, Question, ShieldWarning, ArrowUp } from "@phosphor-icons/react";

import {
  type ClaraHighlight,
  type ClaraProcessState,
  type ClaraReference,
  type ClaraStructuredResponse,
  formatReferenceAbnt,
  renderStructuredResponseToPlainText,
} from '@/lib/clara-response';
import type { ChatResponseMode } from '@/lib/chat-response-mode';
import { ChatFeedbackControls } from '@/components/chat/ChatFeedbackControls';

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
        className: 'is-complete',
      };
    case 'cautela':
      return {
        label: 'Atenção',
        icon: Warning,
        className: 'is-caution',
      };
    case 'web':
      return {
        label: 'Oficial',
        icon: Globe,
        className: 'is-web',
      };
    default:
      return {
        label: 'Informativo',
        icon: CircleDashed,
        className: 'is-info',
      };
  }
}

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

function ConfidenceBadge({ scopeMatch, confidence }: { scopeMatch: string; confidence: number | null }) {
  const tier = scopeMatch === 'exact'
    ? { label: 'Resposta fundamentada', className: 'chat-confidence-high' }
    : scopeMatch === 'probable'
    ? { label: 'Resposta provável', className: 'chat-confidence-good' }
    : scopeMatch === 'weak'
    ? { label: 'Cobertura parcial', className: 'chat-confidence-moderate' }
    : { label: 'Base limitada', className: 'chat-confidence-low' };

  return (
    <span className={`chat-confidence-badge ${tier.className}`} aria-label={`Nível de confiança: ${tier.label}`}>
      <span className="chat-confidence-dot" aria-hidden="true" />
      <span>{tier.label}</span>
      {confidence != null && confidence > 0 && (
        <span className="chat-confidence-value">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
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

function CollapsibleStepCard({
  step,
  isCollapsible,
  defaultExpanded,
}: {
  step: ClaraStructuredResponse['etapas'][0];
  isCollapsible: boolean;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <article className="chat-step-card" role="listitem">
      <div 
        className={`chat-step-header ${isCollapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={isCollapsible ? () => setExpanded(v => !v) : undefined}
      >
        <span className="chat-step-number">{String(step.numero).padStart(2, '0')}</span>
        <div className="chat-step-heading" style={{ flex: 1 }}>
          <h4>{step.titulo}</h4>
          {step.citacoes.length > 0 && <CitationList citations={step.citacoes} />}
        </div>
        {isCollapsible && (
          <button type="button" className="chat-expand-toggle-icon ml-auto p-1 rounded-full hover:bg-[hsl(var(--surface-3))] transition-colors text-[hsl(var(--muted-foreground))]">
            {expanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>
        )}
      </div>

      {(expanded || !isCollapsible) && (
        <div className="chat-step-collapsible-content pt-3 flex flex-col gap-3">
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
        </div>
      )}
    </article>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const analysis = response.analiseDaResposta;
  const resolvedMode = resolveStructuredResponseMode(response, responseMode);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleCopy = useCallback(() => {
    const plainText = renderStructuredResponseToPlainText(response);
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(false);
    });
  }, [response]);
  const groupedHighlights = useMemo(
    () => response.termosDestacados.slice(0, resolvedMode === 'didatico' ? 3 : 6),
    [response.termosDestacados, resolvedMode],
  );
  const processStates = useMemo(
    () => analysis.processStates.filter((state) => state.status !== 'concluido').slice(0, 1),
    [analysis.processStates],
  );
  const confidenceTier = analysis.answerScopeMatch === 'exact' ? 'high'
    : analysis.answerScopeMatch === 'probable' ? 'good'
    : analysis.answerScopeMatch === 'weak' ? 'moderate' : 'low';
  const showConfidenceBadge = analysis.clarificationRequested
    || Boolean(analysis.cautionNotice)
    || analysis.answerScopeMatch === 'weak'
    || analysis.answerScopeMatch === 'insufficient';
  const showHighlightCloud = resolvedMode === 'direto' && groupedHighlights.length > 0;
  const compactSourceCount = response.referenciasFinais.length > 0
    ? `${response.referenciasFinais.length} fonte${response.referenciasFinais.length > 1 ? 's' : ''}`
    : null;

  return (
    <div
      ref={containerRef}
      className="chat-structured-response"
      data-response-mode={resolvedMode}
      data-response-layout={response.modoResposta}
      data-confidence={confidenceTier}
      data-needs-clarification={analysis.clarificationRequested ? 'true' : undefined}
    >
      <div className="chat-response-intro">
        <div className="chat-response-toolbar">
          <div className="chat-response-toolbar-status">
            {(resolvedMode === 'direto' || analysis.clarificationRequested) && (
              <span className="chat-response-kicker">
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
                {analysis.clarificationRequested ? 'Preciso de um detalhe' : 'Resposta direta'}
              </span>
            )}
            {showConfidenceBadge && (
              <ConfidenceBadge
                scopeMatch={analysis.answerScopeMatch}
                confidence={analysis.finalConfidence}
              />
            )}
          </div>
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
        <div className="chat-response-summary-block">
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
          <div className="chat-inline-notes">
            {analysis.userNotice && (
              <p className="chat-inline-note">{analysis.userNotice}</p>
            )}

            {analysis.cautionNotice && (
              <p className="chat-inline-note is-caution">{analysis.cautionNotice}</p>
            )}
          </div>
        )}

        {processStates.length > 0 && (
          <section className="chat-process-inline-list" aria-label="Pontos de atenção da resposta">
            {processStates.map((state) => {
              const meta = getProcessStateMeta(state);
              const Icon = meta.icon;

              return (
                <article key={state.id} className={`chat-process-inline-item ${meta.className}`}>
                  <div className="chat-process-inline-head">
                    <span className="chat-process-inline-icon" aria-hidden="true">
                      <Icon size={14} />
                    </span>
                    <span className="chat-process-inline-label">{meta.label}</span>
                  </div>
                  <p className="chat-process-inline-title">{state.titulo}</p>
                  <p className="chat-process-inline-copy">{state.descricao}</p>
                </article>
              );
            })}
          </section>
        )}

        {showHighlightCloud && (
          <section className="chat-highlight-strip" aria-label="Pontos-chave">
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
        <section className="chat-step-section" aria-label="Etapas sugeridas">
          {resolvedMode === 'direto' && response.etapas.length > 1 && (
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
              <CollapsibleStepCard 
                key={step.numero} 
                step={step} 
                isCollapsible={response.etapas.length >= 4}
                defaultExpanded={response.etapas.length < 4 || step.numero === 1}
              />
            ))}
          </div>
        </section>
      )}

      {response.observacoesFinais.length > 0 && (
        <section className="chat-observation-card" aria-label="Observacoes finais">
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
              <span className="chat-references-title">
                <FileText size={15} />
                <span>Fontes</span>
              </span>
              {compactSourceCount && <span className="chat-references-count">{compactSourceCount}</span>}
            </span>
            {showReferences ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>
          {showReferences && (
            <>
              <p className="chat-reference-intro">
                Os trechos com citação remetem às fontes abaixo.
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

      {(response.etapas.length > 0 || response.referenciasFinais.length > 0) && (
        <div className="flex justify-start mt-1">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.7rem] font-medium text-muted-foreground/80 hover:text-primary hover:bg-[hsl(var(--surface-3))] transition-colors"
            aria-label="Voltar ao início da resposta"
          >
            <ArrowUp size={12} weight="bold" />
            <span>Voltar ao resumo</span>
          </button>
        </div>
      )}
    </div>
  );
}
