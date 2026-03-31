import { useEffect } from 'react';

export interface DocumentMetaOptions {
  title: string;
  description: string;
  author?: string;
  canonical?: string;
}

export function DocumentMeta({
  title,
  description,
  author = 'Wilson M. Peixoto - SME/RJ',
  canonical,
}: DocumentMetaOptions) {
  useEffect(() => {
    const previousTitle = document.title;

    const updateMeta = (
      selector: 'name' | 'property',
      key: string,
      value: string,
    ) => {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[${selector}="${key}"]`);
      const created = !existing;
      const meta = existing ?? document.createElement('meta');

      if (created) {
        meta.setAttribute(selector, key);
        document.head.appendChild(meta);
      }

      const previousContent = meta.getAttribute('content');
      meta.setAttribute('content', value);

      return () => {
        if (previousContent == null) {
          if (created) {
            meta.remove();
          } else {
            meta.removeAttribute('content');
          }
          return;
        }

        meta.setAttribute('content', previousContent);
      };
    };

    const updateCanonical = (href: string) => {
      const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      const created = !existing;
      const link = existing ?? document.createElement('link');

      if (created) {
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }

      const previousHref = link.getAttribute('href');
      link.setAttribute('href', href);

      return () => {
        if (previousHref == null) {
          if (created) {
            link.remove();
          } else {
            link.removeAttribute('href');
          }
          return;
        }

        link.setAttribute('href', previousHref);
      };
    };

    document.title = title;

    const cleanups = [
      updateMeta('name', 'description', description),
      updateMeta('name', 'author', author),
      updateMeta('property', 'og:title', title),
      updateMeta('property', 'og:description', description),
      updateMeta('name', 'twitter:title', title),
      updateMeta('name', 'twitter:description', description),
      canonical ? updateMeta('property', 'og:url', canonical) : null,
      canonical ? updateCanonical(canonical) : null,
    ].filter(Boolean) as Array<() => void>;

    return () => {
      document.title = previousTitle;
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [author, canonical, description, title]);

  return null;
}
