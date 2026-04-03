import { render } from '@testing-library/react';

import { DocumentMeta } from '@/components/DocumentMeta';
import { SITE_AUTHOR_LABEL } from '@/lib/site-identity';

describe('DocumentMeta', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = originalTitle;
    document.head.querySelectorAll('meta[name="description"], meta[name="author"], meta[property="og:title"], meta[property="og:description"], meta[property="og:url"], meta[name="twitter:title"], meta[name="twitter:description"], link[rel="canonical"]').forEach((node) => node.remove());
  });

  afterAll(() => {
    document.title = originalTitle;
  });

  it('applies page title and metadata', () => {
    render(
      <DocumentMeta
        title="CLARA — Teste"
        description="Descricao da pagina"
        canonical="https://clarainova02.vercel.app/teste"
      />,
    );

    expect(document.title).toBe('CLARA — Teste');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Descricao da pagina');
    expect(document.head.querySelector('meta[name="author"]')?.getAttribute('content')).toBe(SITE_AUTHOR_LABEL);
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('CLARA — Teste');
    expect(document.head.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('Descricao da pagina');
    expect(document.head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://clarainova02.vercel.app/teste');
    expect(document.head.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('CLARA — Teste');
    expect(document.head.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe('Descricao da pagina');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://clarainova02.vercel.app/teste');
  });

  it('restores previous title and removes created metadata on unmount', () => {
    document.title = 'Titulo anterior';

    const { unmount } = render(
      <DocumentMeta
        title="Pagina temporaria"
        description="Descricao temporaria"
      />,
    );

    expect(document.title).toBe('Pagina temporaria');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Descricao temporaria');

    unmount();

    expect(document.title).toBe('Titulo anterior');
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('meta[name="author"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:title"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:description"]')).toBeNull();
    expect(document.head.querySelector('meta[name="twitter:title"]')).toBeNull();
    expect(document.head.querySelector('meta[name="twitter:description"]')).toBeNull();
  });
});
