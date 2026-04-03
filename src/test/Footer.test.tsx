import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Footer from '@/components/Footer';

describe('Footer', () => {
  it('exposes a discreet path to the admin area from public navigation', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /acesso administrativo/i })).toHaveAttribute('href', '/admin');
  });
});
