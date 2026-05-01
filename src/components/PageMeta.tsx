import { useEffect } from 'react';

type Props = {
  title?: string;
  description?: string;
  canonicalPath?: string;
};

/**
 * Lightweight per-page SEO meta updater (no react-helmet dependency).
 * Sets <title>, meta description, og:title, og:description, twitter equivalents,
 * and canonical link. Restores nothing on unmount — next page sets its own.
 */
export function PageMeta({ title, description, canonicalPath }: Props) {
  useEffect(() => {
    if (title) document.title = title;

    const upsertMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    }
    if (title) {
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
      upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    }

    if (canonicalPath) {
      const href = `${window.location.origin}${canonicalPath}`;
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    }
  }, [title, description, canonicalPath]);

  return null;
}
