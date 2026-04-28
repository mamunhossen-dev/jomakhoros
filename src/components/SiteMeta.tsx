import { useEffect } from 'react';
import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_SITE, type SiteSettings } from '@/components/admin/SiteSettingsEditor';

/**
 * Updates document.title and meta tags from admin-controlled site settings.
 * Mounted once at the App root.
 */
export function SiteMeta() {
  const { data } = useAppSetting<SiteSettings>('site_settings', DEFAULT_SITE);

  useEffect(() => {
    if (!data) return;
    if (data.site_title) document.title = data.site_title;

    const setMeta = (selector: string, attr: string, value: string) => {
      if (!value) return;
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) ?? [];
        if (name) {
          if (selector.includes('property=')) el.setAttribute('property', name);
          else el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', data.meta_description);
    setMeta('meta[property="og:title"]', 'content', data.site_title);
    setMeta('meta[property="og:description"]', 'content', data.meta_description);
    setMeta('meta[name="twitter:title"]', 'content', data.site_title);
    setMeta('meta[name="twitter:description"]', 'content', data.meta_description);
    if (data.og_image_url) {
      setMeta('meta[property="og:image"]', 'content', data.og_image_url);
      setMeta('meta[name="twitter:image"]', 'content', data.og_image_url);
    }
  }, [data]);

  return null;
}
