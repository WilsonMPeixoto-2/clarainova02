import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatStructuredMessage } from '@/components/chat/ChatStructuredMessage';
import { buildMockStructuredResponse } from '@/lib/clara-response';

vi.mock('@/components/chat/ChatFeedbackControls', () => ({
  ChatFeedbackControls: () => null,
}));

describe('ChatStructuredMessage', () => {
  it('renders the didatico mode with linear reading and without decorative section subtitles', () => {
    const response = buildMockStructuredResponse('Como montar um bloco de assinatura?', 'didatico');

    render(<ChatStructuredMessage response={response} responseMode="didatico" />);

    expect(screen.getByText(response.tituloCurto)).toBeInTheDocument();
    expect(screen.getByText(response.resumoInicial)).toBeInTheDocument();
    expect(screen.getByText(response.etapas[0].titulo)).toBeInTheDocument();
    expect(screen.queryByText('Guia didático')).not.toBeInTheDocument();
    expect(screen.queryByText('Explicação principal')).not.toBeInTheDocument();
    expect(screen.queryByText('Detalhamento complementar')).not.toBeInTheDocument();
    expect(screen.queryByText('Observações finais')).not.toBeInTheDocument();
  });
});
