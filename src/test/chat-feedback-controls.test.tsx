import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatFeedbackControls } from '@/components/chat/ChatFeedbackControls';

const { submitChatFeedbackMock } = vi.hoisted(() => ({
  submitChatFeedbackMock: vi.fn(),
}));

vi.mock('@/lib/chat-feedback-api', () => ({
  submitChatFeedback: submitChatFeedbackMock,
}));

afterEach(() => {
  submitChatFeedbackMock.mockReset();
});

describe('ChatFeedbackControls', () => {
  it('submits a positive feedback directly', async () => {
    submitChatFeedbackMock.mockResolvedValue({ ok: true });

    render(<ChatFeedbackControls requestId="req-789" />);

    fireEvent.click(screen.getByRole('button', { name: 'Sim' }));

    await waitFor(() => {
      expect(submitChatFeedbackMock).toHaveBeenCalledWith({
        requestId: 'req-789',
        feedbackValue: 'helpful',
      });
    });

    expect(
      screen.getByText(/Obrigado\. Vou considerar esse retorno/i),
    ).toBeInTheDocument();
  });

  it('opens the negative flow and sends optional details', async () => {
    submitChatFeedbackMock.mockResolvedValue({ ok: true });

    render(<ChatFeedbackControls requestId="req-790" />);

    fireEvent.click(screen.getByRole('button', { name: 'Não' }));
    fireEvent.click(screen.getByRole('button', { name: 'Faltou detalhe' }));
    fireEvent.change(
      screen.getByLabelText(/O que faltou\?/i),
      { target: { value: 'Precisa explicar melhor a etapa final.' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar observação' }));

    await waitFor(() => {
      expect(submitChatFeedbackMock).toHaveBeenCalledWith({
        requestId: 'req-790',
        feedbackValue: 'not_helpful',
        feedbackReason: 'missing_detail',
        feedbackComment: 'Precisa explicar melhor a etapa final.',
      });
    });
  });
});
