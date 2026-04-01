import { useRef, useState } from 'react';
import { List, X, ChatCircle } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { Link, useLocation } from 'react-router-dom';
import { useChat } from '@/hooks/useChatStore';
import { ClaraMonogram } from '@/components/ClaraMonogram';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';

type NavItem = {
  label: string;
  note?: string;
  to?: string;
  href?: string;
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isScrolled } = useScrollPosition(50);
  const location = useLocation();
  const { openChat } = useChat();
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuCloseButtonRef = useRef<HTMLButtonElement>(null);

  useModalAccessibility({
    active: menuOpen,
    containerRef: menuDialogRef,
    initialFocusRef: menuCloseButtonRef,
    onClose: () => setMenuOpen(false),
  });

  const navLinks: NavItem[] = [
    { label: 'Perguntas frequentes', to: '/#faq' },
    { label: 'Política de Privacidade', to: '/privacidade', note: 'Uso e proteção de dados' },
    { label: 'Termos de Uso', to: '/termos', note: 'Condições de acesso ao serviço' },
    { label: 'Contato', href: 'mailto:wilsonmp2@gmail.com', note: 'wilsonmp2@gmail.com' },
  ];

  const isActiveLink = (target: string) => {
    if (target.includes('#')) {
      const [path, hash] = target.split('#');
      const hashWithPrefix = hash ? `#${hash}` : '';
      if (path && location.pathname !== path) return false;
      return hashWithPrefix ? location.hash === hashWithPrefix : false;
    }
    if (target.includes('privacidade')) return location.pathname.startsWith('/privacidade');
    if (target.includes('termos')) return location.pathname.startsWith('/termos');
    if (target.startsWith('/')) return location.pathname === target;
    return false;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[220ms] ${
          isScrolled
            ? 'site-header-frame is-scrolled'
            : 'bg-transparent border-b border-transparent'
        }`}
        role="banner"
      >
        <div className="container mx-auto max-w-[1580px] px-4 md:px-6 xl:px-8">
          <div className="flex items-center h-16 gap-3 md:h-20 md:grid md:grid-cols-[minmax(250px,auto)_1fr_auto] md:gap-6">
            <Link
              to="/"
              className="header-brand-link inline-flex items-center gap-3 shrink-0 min-w-[120px] sm:min-w-[150px] md:justify-self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
            >
              <ClaraMonogram className="h-9 w-9 shrink-0" />
              <span className="header-brand-title text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-80">
                CLARA
              </span>
              <span className="sr-only">CLARA - Página inicial</span>
            </Link>

            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-center">
              <nav className="flex items-center gap-8">
                {navLinks.map((link) => {
                  const target = link.to ?? link.href ?? '/';
                  const baseClasses = "text-[13px] uppercase tracking-[0.05em] font-medium text-foreground/75 hover:text-primary transition-colors duration-200";
                  return link.to ? (
                    <Link key={link.label} to={link.to} className={baseClasses}>{link.label}</Link>
                  ) : (
                    <a key={link.label} href={link.href} className={baseClasses}>{link.label}</a>
                  );
                })}
              </nav>
            </div>
  
            <div className="ml-auto md:ml-0 flex items-center gap-2 md:gap-2.5 shrink-0 md:justify-self-end">
              <button
                type="button"
                className="header-pill header-pill-action header-chat-pill"
                onClick={() => openChat()}
              >
                <ChatCircle weight="duotone" size={16} aria-hidden="true" />
                Iniciar chat
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="header-pill header-pill-action"
                aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={menuOpen}
                aria-controls="site-menu"
              >
                {menuOpen ? <X weight="bold" size={18} aria-hidden="true" /> : <List weight="bold" size={18} aria-hidden="true" />}
                <span className="hidden sm:inline text-[11px] uppercase tracking-[0.08em] font-semibold">
                  {menuOpen ? 'Fechar' : 'Menu'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />

          <div
            ref={menuDialogRef}
            id="site-menu"
            className="drawer-shell fixed top-0 right-0 z-[95] h-full w-[min(92vw,360px)] border-l"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-menu-title"
            tabIndex={-1}
          >
            <div className="drawer-header-surface flex items-center justify-between px-6 py-5 border-b">
              <div className="flex items-center gap-3">
                <ClaraMonogram className="h-8 w-8" title="" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.11em] text-muted-foreground">Navegação</p>
                  <p id="site-menu-title" className="text-sm font-semibold text-foreground">Menu CLARA</p>
                </div>
              </div>
              <button
                ref={menuCloseButtonRef}
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-3)/0.5)] transition-all duration-[150ms]"
                aria-label="Fechar menu"
              >
                <X size={20} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col h-[calc(100%-86px)]">
              <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <nav className="space-y-1" aria-label="Navegação principal">
                  <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.11em] text-muted-foreground">Navegação e Avisos Legais</p>
                  {navLinks.map((link) => {
                    const target = link.to ?? link.href ?? '/';
                    const isActive = isActiveLink(target);
                    const className = `group flex flex-col px-3 py-3 rounded-xl border transition-all duration-[150ms]
                      ${isActive
                        ? 'border-primary/45 bg-primary/10'
                        : 'border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-2)/0.45)] hover:border-primary/30 hover:bg-[hsl(var(--surface-2)/0.72)]'
                      }
                    `;

                    if (link.to) {
                      return (
                        <Link
                          key={link.label}
                          to={link.to}
                          onClick={() => setMenuOpen(false)}
                          className={className}
                        >
                          <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                            {link.label}
                          </span>
                          {link.note && <span className="text-xs text-muted-foreground mt-1">{link.note}</span>}
                        </Link>
                      );
                    }

                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={className}
                      >
                        <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                          {link.label}
                        </span>
                        {link.note && <span className="text-xs text-muted-foreground mt-1">{link.note}</span>}
                      </a>
                    );
                  })}
                </nav>
              </div>

              <div className="drawer-footer-surface px-4 py-5 border-t">
                <button
                  type="button"
                  className="btn-clara-primary type-label w-full gap-2 h-11 inline-flex items-center justify-center"
                  onClick={() => {
                    setMenuOpen(false);
                    window.setTimeout(() => openChat(), 0);
                  }}
                >
                  <ChatCircle weight="duotone" size={18} aria-hidden="true" />
                  Chat com CLARA
                </button>
                <p className="text-hint text-center mt-3 leading-relaxed">
                  Abra o chat para fazer uma pergunta.
                </p>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
};

export default Header;
