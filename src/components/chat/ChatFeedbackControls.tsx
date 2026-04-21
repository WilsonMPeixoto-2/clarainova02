import { useCallback, useMemo, useState } from 'react';

import {
  submitChatFeedback,
  type ChatFeedbackReason,
} from '@/lib/chat-feedback-api';

const NEGATIVE_FEEDBACK_REASONS: Array<{
  value: ChatFeedbackReason;
  label: string;
}> = [
  { value: 'not_about_this', label: 'Não era sobre isso' },
  { value: 'missing_detail', label: 'Faltou detalhe' },
  { value: 'incorrect_info', label: 'Informação errada' },
];

type FeedbackState = 'idle' | 'submitting' | 'submitted' | 'error';

export function ChatFeedbackControls({ requestId }: { requestId?: string | null }) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [isNegativeFlowOpen, setIsNegativeFlowOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ChatFeedbackReason | null>(null);
  const [comment, setComment] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isDisabled = feedbackState === 'submitting' || feedbackState === 'submitted';
  const trimmedComment = useMemo(() => comment.replace(/\s+/g, ' ').trim(), [comment]);

  const submitHelpful = useCallback(async () => {
    if (!requestId || isDisabled) return;

    setFeedbackState('submitting');
    setStatusMessage(null);
    try {
      await submitChatFeedback({
        requestId,
        feedbackValue: 'helpful',
      });
      setFeedbackState('submitted');
      setStatusMessage('Obrigado. Vou considerar esse retorno nas próximas melhorias da CLARA.');
    } catch (error) {
      setFeedbackState('error');
      setStatusMessage(error instanceof Error ? error.message : 'Nao consegui registrar o feedback agora.');
    }
  }, [isDisabled, requestId]);

  const submitNegative = useCallback(async () => {
    if (!requestId || isDisabled) return;

    setFeedbackState('submitting');
    setStatusMessage(null);
    try {
      await submitChatFeedback({
        requestId,
        feedbackValue: 'not_helpful',
        feedbackReason: selectedReason,
        feedbackComment: trimmedComment || null,
      });
      setFeedbackState('submitted');
      setStatusMessage('Obrigado. Seu retorno foi registrado para revisão do conteúdo e da resposta.');
    } catch (error) {
      setFeedbackState('error');
      setStatusMessage(error instanceof Error ? error.message : 'Nao consegui registrar o feedback agora.');
    }
  }, [isDisabled, requestId, selectedReason, trimmedComment]);

  if (!requestId) {
    return null;
  }

  return (
    <section
      className="chat-feedback-strip"
      aria-label="Avaliar resposta"
    >
      <div className="chat-feedback-head">
        <div className="chat-feedback-copy">
          <p className="chat-feedback-kicker">
            Feedback rápido
          </p>
          <p className="chat-feedback-question">
            Essa resposta te ajudou a avançar?
          </p>
        </div>
        <div className="chat-feedback-actions">
          <button
            type="button"
            className="chat-feedback-button is-positive"
            onClick={submitHelpful}
            disabled={isDisabled}
          >
            Sim
          </button>
          <button
            type="button"
            className="chat-feedback-button is-negative"
            onClick={() => {
              if (isDisabled) return;
              setIsNegativeFlowOpen(true);
              setFeedbackState('idle');
              setStatusMessage(null);
            }}
            disabled={isDisabled}
          >
            Não
          </button>
        </div>
      </div>

      {isNegativeFlowOpen && feedbackState !== 'submitted' && (
        <div className="chat-feedback-detail">
          <div className="chat-feedback-reason-list">
            {NEGATIVE_FEEDBACK_REASONS.map((reason) => {
              const isActive = selectedReason === reason.value;
              return (
                <button
                  key={reason.value}
                  type="button"
                  className={`chat-feedback-reason ${isActive ? 'is-active' : ''}`.trim()}
                  onClick={() => setSelectedReason(reason.value)}
                  disabled={feedbackState === 'submitting'}
                >
                  {reason.label}
                </button>
              );
            })}
          </div>

          <label className="chat-feedback-field">
            <span className="chat-feedback-field-label">
              O que faltou? (opcional)
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={3}
              className="chat-feedback-textarea"
              placeholder="Se quiser, descreva rapidamente o que faltou ou o que ficou errado."
              disabled={feedbackState === 'submitting'}
            />
          </label>

          <div className="chat-feedback-detail-footer">
            <p className="chat-feedback-footnote">
              Motivo opcional. O feedback ja pode ser enviado sem preencher tudo.
            </p>
            <button
              type="button"
              className="chat-feedback-submit"
              onClick={submitNegative}
              disabled={feedbackState === 'submitting'}
            >
              {feedbackState === 'submitting' ? 'Enviando...' : 'Enviar observação'}
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <p
          className={`chat-feedback-status ${feedbackState === 'error' ? 'is-error' : 'is-success'}`}
          role={feedbackState === 'error' ? 'alert' : 'status'}
        >
          {statusMessage}
        </p>
      )}
    </section>
  );
}
