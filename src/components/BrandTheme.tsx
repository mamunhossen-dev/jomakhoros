import { useEffect } from 'react';
import { useBrand } from '@/hooks/useBrand';

/**
 * Applies the admin-controlled primary color to the running app by overriding
 * the relevant CSS custom properties on :root. All components that consume
 * --primary, --accent, --ring, --sidebar-primary, --sidebar-ring will update.
 */
export function BrandTheme() {
  const { primary_hsl } = useBrand();

  useEffect(() => {
    if (!primary_hsl) return;
    const root = document.documentElement;
    const tokens = ['--primary', '--accent', '--ring', '--sidebar-primary', '--sidebar-ring'];
    tokens.forEach((t) => root.style.setProperty(t, primary_hsl));
    return () => { tokens.forEach((t) => root.style.removeProperty(t)); };
  }, [primary_hsl]);

  return null;
}
