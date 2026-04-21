import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatStructuredMessage } from '@/components/chat/ChatStructuredMessage';
import { buildMockStructuredResponse } from '@/lib/clara-response';

vi.mock('@/components/chat/ChatFeedbackControls', () => ({
  ChatFeedbackControls: () => null,
}));

describe('ChatStructuredMessage', () => {
  it('renders the didatico mode with explicit editorial sections and readable step labels', () => {
    const response = buildMockStructuredResponse('Como montar um bloco de assinatura?', 'didatico');

    render(<ChatStructuredMessage response={response} responseMode="didatico" />);

    expect(screen.getByText(response.tituloCurto)).toBeInTheDocument();
    expect(screen.getByText(response.resumoInicial)).toBeInTheDocument();
    expect(screen.getAllByText('Panorama do caso')).toHaveLength(2);
    expect(screen.getAllByText('Guia detalhado')).toHaveLength(2);
    expect(screen.getByText('Etapa 1')).toBeInTheDocument();
    expect(screen.getByText(response.etapas[0].titulo)).toBeInTheDocument();
    expect(screen.getAllByText('Fontes citadas')).toHaveLength(2);
  });

  it('keeps long didatico responses expanded by default even when collapsing is available', () => {
    const response = buildMockStructuredResponse('Como montar um bloco de assinatura?', 'didatico');
    response.etapas = Array.from({ length: 5 }, (_, index) => ({
      ...response.etapas[index % response.etapas.length],
      numero: index + 1,
      titulo: `Etapa adicional ${index + 1}`,
      conteudo: `Conteudo detalhado da etapa ${index + 1}.`,
    }));

    render(<ChatStructuredMessage response={response} responseMode="didatico" />);

    expect(screen.getByText('Etapa adicional 5')).toBeInTheDocument();
    expect(screen.getByText('Conteudo detalhado da etapa 5.')).toBeInTheDocument();
  });
});
