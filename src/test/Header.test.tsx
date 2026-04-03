import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Header from '@/components/Header';

const openChatMock = vi.fn();

vi.mock('@/hooks/useScrollPosition', () => ({
  useScrollPosition: () => ({ isScrolled: false }),
}));

vi.mock('@/hooks/useChatStore', () => ({
  useChat: () => ({ openChat: openChatMock }),
}));

describe('Header', () => {
  beforeEach(() => {
    openChatMock.mockReset();
  });

  function renderHeader(initialEntries: string[] = ['/']) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Header />
      </MemoryRouter>,
    );
  }

  it('renders brand and main actions', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: /clara - página inicial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar chat/i })).toBeInTheDocument();
  });

  it('opens the mobile menu and closes it from the close button', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));

    const dialog = screen.getByRole('dialog', { name: /menu clara/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /política de privacidade/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /acesso administrativo/i })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /fechar menu/i }));

    expect(screen.queryByRole('dialog', { name: /menu clara/i })).not.toBeInTheDocument();
  });

  it('closes the mobile menu after navigating from a menu link', () => {
    renderHeader(['/']);

    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));
    const dialog = screen.getByRole('dialog', { name: /menu clara/i });

    fireEvent.click(within(dialog).getByRole('link', { name: /termos de uso/i }));

    expect(screen.queryByRole('dialog', { name: /menu clara/i })).not.toBeInTheDocument();
  });

  it('opens the chat from both header actions', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /iniciar chat/i }));
    expect(openChatMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));
    const dialog = screen.getByRole('dialog', { name: /menu clara/i });

    fireEvent.click(within(dialog).getByRole('button', { name: /chat com clara/i }));

    return waitFor(() => {
      expect(openChatMock).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('dialog', { name: /menu clara/i })).not.toBeInTheDocument();
    });
  });
});
