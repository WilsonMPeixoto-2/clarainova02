import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

function ThrowError() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>Conteúdo seguro</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Conteúdo seguro')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recarregar/i })).toBeInTheDocument();
  });
});
