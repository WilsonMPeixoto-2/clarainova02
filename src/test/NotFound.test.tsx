import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatProvider } from '@/hooks/useChatStore';
import NotFound from '@/pages/NotFound';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/pagina-inexistente']}>
      <ChatProvider>{children}</ChatProvider>
    </MemoryRouter>
  );
}

describe('NotFound', () => {
  it('renders 404 heading and navigation links', () => {
    render(<NotFound />, { wrapper: Wrapper });

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Rota não encontrada')).toBeInTheDocument();
    expect(screen.getByText('Voltar para a home')).toBeInTheDocument();
    expect(screen.getByText('Falar com a CLARA')).toBeInTheDocument();
  });

  it('displays the attempted path', () => {
    render(<NotFound />, { wrapper: Wrapper });

    expect(screen.getByText('/pagina-inexistente')).toBeInTheDocument();
  });
});
