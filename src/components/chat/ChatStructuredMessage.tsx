import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircleQuestion,
  ShieldAlert,
} from 'lucide-react';

import {
  type ClaraHighlight,
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


export function ChatStructuredMessage({ response }: { response: ClaraStructuredResponse }) {
  const [showReferences, setShowReferences] = useState(true);
  const analysis = response.analiseDaResposta;
  const groupedHighlights = useMemo(() => response.termosDestacados.slice(0, 8), [response.termosDestacados]);

  return (
    <div className="chat-structured-response">
      <div className="chat-response-intro">
        <div className="chat-response-kicker">
          <FileText size={14} />
          Resposta estruturada
        </div>
        <h3 className="chat-response-title">{response.tituloCurto}</h3>
        <p className="chat-response-summary">
          {response.resumoInicial}
          <CitationList citations={response.resumoCitacoes} />
        </p>


        {analysis.clarificationRequested && analysis.clarificationQuestion && (
          <section className="chat-clarification-card" aria-label="Pedido de esclarecimento">
            <div className="chat-clarification-title">
              <MessageCircleQuestion size={16} />
              Antes de eu seguir
            </div>
            {analysis.clarificationReason && (
              <p className="chat-clarification-body">{analysis.clarificationReason}</p>
            )}
            <p className="chat-clarification-question">{analysis.clarificationQuestion}</p>
          </section>
        )}

        {groupedHighlights.length > 0 && (
          <div className="chat-highlight-cloud" aria-label="Destaques da resposta">
            {groupedHighlights.map((highlight) => (
              <span key={`${highlight.tipo}-${highlight.texto}`} className={`chat-highlight-badge chat-highlight-${highlight.tipo}`}>
                <span className="chat-highlight-label">{highlightLabel(highlight)}</span>
                <span>{highlight.texto}</span>
              </span>
            ))}
          </div>
        )}
      </div>


      {response.etapas.length > 0 && (
        <div className="chat-step-grid" role="list" aria-label="Etapas sugeridas">
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
                  <ShieldAlert size={15} />
                  <span>{step.alerta}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {response.observacoesFinais.length > 0 && (
        <section className="chat-observation-card" aria-label="Observacoes finais">
          <div className="chat-observation-title">
            <FileText size={15} />
            Observacoes finais
          </div>
          <ul className="chat-observation-list">
            {response.observacoesFinais.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </section>
      )}

      {analysis.cautionNotice && (
        <NoticeCard
          title="Ponto de atencao"
          icon={<ShieldAlert size={15} />}
          body={analysis.cautionNotice}
          tone="caution"
        />
      )}

      {showDecisionSummary && (
        <section className="chat-decision-card" aria-label="Leitura de confianca">
          <div className="chat-decision-title">
            <CircleAlert size={15} />
            Leitura de confianca
          </div>
          <ul className="chat-decision-list">
            <li>{scopeMatchLabel(analysis.answerScopeMatch)}</li>
            {analysis.finalConfidence != null && (
              <li>Confianca estimada da resposta: {Math.round(analysis.finalConfidence * 100)}%</li>
            )}
            {analysis.ambiguityInSources && <li>Houve comparacao entre fontes proximas antes de consolidar a orientacao.</li>}
            {analysis.webFallbackUsed && <li>Foi necessario apoio de fonte oficial externa para reduzir a ambiguidade.</li>}
          </ul>
        </section>
      )}

      {(analysis.comparedSources.length > 0 || analysis.prioritizedSources.length > 0) && (
        <section className="chat-source-trace-card" aria-label="Rastreabilidade das fontes">
          <div className="chat-source-trace-title">
            <GitCompareArrows size={15} />
            Fontes comparadas e priorizadas
          </div>
          {analysis.comparedSources.length > 0 && (
            <div className="chat-source-block">
              <h4>Fontes comparadas</h4>
              <ul>
                {analysis.comparedSources.map((source) => (
                  <li key={`compared-${source}`}>{source}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.prioritizedSources.length > 0 && (
            <div className="chat-source-block">
              <h4>Fontes priorizadas</h4>
              <ul>
                {analysis.prioritizedSources.map((source) => (
                  <li key={`prioritized-${source}`}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {response.referenciasFinais.length > 0 && (
        <section className="chat-references-card" aria-label="Referencias">
          <button
            type="button"
            className="chat-references-toggle"
            onClick={() => setShowReferences((current) => !current)}
          >
            <span>Referencias</span>
            {showReferences ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showReferences && (
            <ol className="chat-reference-list">
              {response.referenciasFinais.map((reference) => (
                <ReferenceItem key={reference.id} reference={reference} />
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
