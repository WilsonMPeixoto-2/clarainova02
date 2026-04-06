import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChatStructuredMessage } from '@/components/chat/ChatStructuredMessage';
import { buildPreviewStructuredResponse } from '@/lib/clara-response';

describe('ChatStructuredMessage', () => {
  it('removes visible editorial scaffolding and confidence badges from the response shell', () => {
    const response = buildPreviewStructuredResponse('Como incluir documento externo?', 'didatico');

    render(<ChatStructuredMessage response={response} responseMode="didatico" />);

    expect(screen.getByText('Resposta explicada')).toBeInTheDocument();
    expect(screen.getByText('Passos')).toBeInTheDocument();
    expect(screen.getByText('Fontes')).toBeInTheDocument();

    expect(screen.queryByText('Guia didático')).not.toBeInTheDocument();
    expect(screen.queryByText('Veredito inicial')).not.toBeInTheDocument();
    expect(screen.queryByText('Passo a passo guiado')).not.toBeInTheDocument();
    expect(screen.queryByText('Resposta fundamentada')).not.toBeInTheDocument();
    expect(screen.queryByText('Detalhamento complementar')).not.toBeInTheDocument();
  });
});
