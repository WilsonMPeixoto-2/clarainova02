import { useCallback, useId, useMemo, useRef, useState } from 'react';
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

function getResponseEditorialFrame(
  response: ClaraStructuredResponse,
  resolvedMode: ChatResponseMode,
) {
  const analysis = response.analiseDaResposta;
  const isDirect = resolvedMode === 'direto';
  const hasSteps = response.etapas.length > 0;
  const isExplanationOnly = response.modoResposta === 'explicacao' || !hasSteps;

  return {
    modeKicker: analysis.clarificationRequested
      ? 'Preciso de um detalhe'
      : isDirect
        ? 'Resposta rápida'
        : 'Resposta guiada',
    modeNote: analysis.clarificationRequested
      ? 'Com mais contexto eu consigo fechar a orientação com segurança.'
      : isDirect
        ? 'Foco no essencial para agir agora.'
        : 'Mais contexto, explicação e conferência ao longo do caminho.',
    summaryLabel: analysis.clarificationRequested
      ? 'O que já posso te orientar'
      : isDirect
        ? hasSteps
          ? 'Rota principal'
          : 'Síntese objetiva'
        : isExplanationOnly
          ? 'Entenda primeiro'
          : 'Panorama do caso',
    stepsLabel: isDirect ? 'Etapas essenciais' : 'Guia detalhado',
    stepsCaption: isDirect
      ? `${response.etapas.length} etapa${response.etapas.length > 1 ? 's' : ''} para destravar sua próxima ação`
      : `${response.etapas.length} etapa${response.etapas.length > 1 ? 's' : ''} com execução, contexto e conferência`,
    observationsLabel: isDirect ? 'Conferências finais' : 'Pontos de atenção',
    observationsCaption: isDirect
      ? 'Use esta checagem antes de concluir a ação.'
      : 'Use estes pontos para evitar erro, retrabalho ou interpretação apressada.',
    referencesLabel: 'Fontes citadas',
    referencesCaption: isDirect
      ? 'As marcações de fonte abrem a base usada nesta resposta.'
      : 'As marcações de fonte permitem revisar a base usada ao longo da orientação.',
    stepLabelPrefix: isDirect ? 'Passo' : 'Etapa',
    stepProgressLabel: isDirect
      ? `${response.etapas.length} etapas essenciais`
      : `${response.etapas.length} etapas do guia`,
  };
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

function ExpandableItemList({
  items,
  stepNumber,
  visibleCount,
}: {
  items: string[];
  stepNumber: number;
  visibleCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = items.length > visibleCount;
  const visibleItems = shouldCollapse && !expanded ? items.slice(0, visibleCount) : items;

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
            : `Mais ${items.length - visibleCount} iten${items.length - visibleCount > 1 ? 's' : ''}`}
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
        <button
          key={citation}
          type="button"
          id={index === 0 ? `clara-cite-${citation}` : undefined}
          className="chat-citation-badge chat-citation-clickable"
          onClick={(event) => {
            event.stopPropagation();
            scrollToReference(citation);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              scrollToReference(citation);
            }
          }}
          aria-label={`Abrir fonte ${citation}`}
          title={`Abrir fonte ${citation}`}
        >
          <span className="chat-citation-badge-label">Fonte</span>
          <span>{citation}</span>
        </button>
      ))}
    </span>
  );
}

function ReferenceItem({ reference }: { reference: ClaraReference }) {
  return (
    <li id={`clara-ref-${reference.id}`} className="chat-reference-item">
      <span className="chat-reference-index">{`Fonte ${reference.id}`}</span>
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
  stepLabelPrefix,
  visibleItemCount,
}: {
  step: ClaraStructuredResponse['etapas'][0];
  isCollapsible: boolean;
  defaultExpanded: boolean;
  stepLabelPrefix: string;
  visibleItemCount: number;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const stepLabel = `${stepLabelPrefix} ${step.numero}`;

  return (
    <article className="chat-step-card" role="listitem">
      <div 
        className={`chat-step-header ${isCollapsible ? 'cursor-pointer select-none is-collapsible' : ''}`}
        onClick={isCollapsible ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={isCollapsible ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setExpanded((v) => !v);
          }
        } : undefined}
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        aria-expanded={isCollapsible ? expanded : undefined}
      >
        <span className="chat-step-number">{stepLabel}</span>
        <div className="chat-step-heading" style={{ flex: 1 }}>
          <h4>{step.titulo}</h4>
          {step.citacoes.length > 0 && <CitationList citations={step.citacoes} />}
        </div>
        {isCollapsible && (
          <span className="chat-expand-toggle-icon ml-auto p-1 rounded-full hover:bg-[hsl(var(--surface-3))] transition-colors text-[hsl(var(--muted-foreground))]">
            <span className="sr-only">
              {expanded ? `Recolher ${stepLabel.toLowerCase()}` : `Expandir ${stepLabel.toLowerCase()}`}
            </span>
            {expanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </span>
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
            <ExpandableItemList
              items={step.itens}
              stepNumber={step.numero}
              visibleCount={visibleItemCount}
            />
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
  const baseId = useId().replace(/:/g, '');
  const analysis = response.analiseDaResposta;
  const resolvedMode = resolveStructuredResponseMode(response, responseMode);
  const editorialFrame = useMemo(
    () => getResponseEditorialFrame(response, resolvedMode),
    [resolvedMode, response],
  );
  const summarySectionId = `${baseId}-summary`;
  const stepsSectionId = `${baseId}-steps`;
  const observationsSectionId = `${baseId}-observations`;
  const referencesSectionId = `${baseId}-references`;

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
  const visibleItemCount = resolvedMode === 'didatico' ? 5 : 4;
  const confidenceTier = analysis.answerScopeMatch === 'exact' ? 'high'
    : analysis.answerScopeMatch === 'probable' ? 'good'
    : analysis.answerScopeMatch === 'weak' ? 'moderate' : 'low';
  const showConfidenceBadge = analysis.clarificationRequested
    || Boolean(analysis.cautionNotice)
    || analysis.answerScopeMatch === 'weak'
    || analysis.answerScopeMatch === 'insufficient';
  const showHighlightCloud = resolvedMode === 'direto' && groupedHighlights.length > 0;
  const compactSourceCount = response.referenciasFinais.length > 0
    ? `${response.referenciasFinais.length} fonte${response.referenciasFinais.length > 1 ? 's' : ''} citada${response.referenciasFinais.length > 1 ? 's' : ''}`
    : null;
  const sectionLinks = useMemo(() => {
    const links: Array<{ key: string; label: string; targetId: string }> = [
      { key: 'summary', label: editorialFrame.summaryLabel, targetId: summarySectionId },
    ];

    if (response.etapas.length > 0) {
      links.push({ key: 'steps', label: editorialFrame.stepsLabel, targetId: stepsSectionId });
    }

    if (response.observacoesFinais.length > 0) {
      links.push({ key: 'observations', label: editorialFrame.observationsLabel, targetId: observationsSectionId });
    }

    if (response.referenciasFinais.length > 0) {
      links.push({ key: 'references', label: editorialFrame.referencesLabel, targetId: referencesSectionId });
    }

    return links;
  }, [
    editorialFrame.observationsLabel,
    editorialFrame.referencesLabel,
    editorialFrame.stepsLabel,
    editorialFrame.summaryLabel,
    observationsSectionId,
    referencesSectionId,
    response.etapas.length,
    response.observacoesFinais.length,
    response.referenciasFinais.length,
    stepsSectionId,
    summarySectionId,
  ]);
  const showSectionJumpNav = sectionLinks.length > 2;
  const jumpToSection = useCallback((targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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
              {editorialFrame.modeKicker}
            </span>
            <span className="chat-response-mode-note">{editorialFrame.modeNote}</span>
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
        <section id={summarySectionId} className="chat-response-summary-block">
          <div className="chat-section-heading">
            <p className="chat-response-section-label">{editorialFrame.summaryLabel}</p>
          </div>
          <p className="chat-response-summary">
            {response.resumoInicial}
            <CitationList citations={response.resumoCitacoes} />
          </p>
        </section>

        {showSectionJumpNav && (
          <nav className="chat-response-jump-nav" aria-label="Navegar pela resposta">
            {sectionLinks.map((section) => (
              <button
                key={section.key}
                type="button"
                className="chat-response-jump-chip"
                onClick={() => jumpToSection(section.targetId)}
              >
                {section.label}
              </button>
            ))}
          </nav>
        )}

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
        <section id={stepsSectionId} className="chat-step-section" aria-label="Etapas sugeridas">
          <div className="chat-section-heading">
            <p className="chat-response-section-label">{editorialFrame.stepsLabel}</p>
            <p className="chat-section-caption">{editorialFrame.stepsCaption}</p>
          </div>
          {resolvedMode === 'direto' && response.etapas.length > 1 && (
            <div className="chat-step-progress" aria-label={editorialFrame.stepProgressLabel}>
              <span className="chat-step-progress-label">{editorialFrame.stepProgressLabel}</span>
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
                isCollapsible={response.etapas.length >= 5}
                defaultExpanded
                stepLabelPrefix={editorialFrame.stepLabelPrefix}
                visibleItemCount={visibleItemCount}
              />
            ))}
          </div>
        </section>
      )}

      {response.observacoesFinais.length > 0 && (
        <section id={observationsSectionId} className="chat-observation-card" aria-label="Observacoes finais">
          <div className="chat-section-heading">
            <p className="chat-response-section-label">{editorialFrame.observationsLabel}</p>
            <p className="chat-section-caption">{editorialFrame.observationsCaption}</p>
          </div>
          <ul className="chat-observation-list">
            {response.observacoesFinais.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </section>
      )}


      {response.referenciasFinais.length > 0 && (
        <section id={referencesSectionId} className="chat-references-card" aria-label="Referencias">
          <button
            type="button"
            className="chat-references-toggle"
            onClick={() => setShowReferences((current) => !current)}
          >
            <span className="chat-references-toggle-copy">
              <span className="chat-references-title">
                <FileText size={15} />
                <span>{editorialFrame.referencesLabel}</span>
              </span>
              {compactSourceCount && <span className="chat-references-count">{compactSourceCount}</span>}
            </span>
            {showReferences ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>
          {showReferences && (
            <>
              <p className="chat-reference-intro">
                {editorialFrame.referencesCaption}
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
