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
      className="mt-4 rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-2)/0.42)] px-3 py-3"
      aria-label="Avaliar resposta"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Feedback rápido
          </p>
          <p className="mt-1 text-sm text-foreground/88">
            Essa resposta te ajudou a avançar?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={submitHelpful}
            disabled={isDisabled}
          >
            Sim
          </button>
          <button
            type="button"
            className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-400/18 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {NEGATIVE_FEEDBACK_REASONS.map((reason) => {
              const isActive = selectedReason === reason.value;
              return (
                <button
                  key={reason.value}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'border border-primary/50 bg-primary/15 text-primary'
                      : 'border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-1))] text-foreground/78 hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedReason(reason.value)}
                  disabled={feedbackState === 'submitting'}
                >
                  {reason.label}
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground/80">
              O que faltou? (opcional)
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={3}
              className="w-full resize-y rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-1))] px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/40"
              placeholder="Se quiser, descreva rapidamente o que faltou ou o que ficou errado."
              disabled={feedbackState === 'submitting'}
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground/70">
              Motivo opcional. O feedback ja pode ser enviado sem preencher tudo.
            </p>
            <button
              type="button"
              className="rounded-full border border-primary/35 bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-60"
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
          className={`mt-3 text-xs ${
            feedbackState === 'error' ? 'text-amber-200' : 'text-emerald-100'
          }`}
          role={feedbackState === 'error' ? 'alert' : 'status'}
        >
          {statusMessage}
        </p>
      )}
    </section>
  );
}
