import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppSetting } from '@/hooks/useAppSetting';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_WELCOME, getAccentClasses, getVariantIcon, type WelcomeBanner as WB } from '@/components/admin/WelcomeBannerEditor';

const STORAGE_KEY = 'welcome_banner_dismissed_v';

export function WelcomeBanner() {
  const { user, loading } = useAuth();
  const { data } = useAppSetting<WB>('welcome_banner', DEFAULT_WELCOME);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !data || !data.enabled) return;
    // Audience filter
    if (data.audience === 'guests' && user) return;
    if (data.audience === 'members' && !user) return;
    // Dismiss check (per version)
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && Number(dismissed) >= (data.version || 1)) return;
    // Small delay so it doesn't slam on first paint
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [data, user, loading]);

  if (!data || !data.enabled) return null;

  const Icon = getVariantIcon(data.variant);
  const cls = getAccentClasses(data.accent);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(data.version || 1));
    setOpen(false);
  };

  const handleCta = () => {
    dismiss();
    if (data.cta_url) {
      if (/^https?:\/\//i.test(data.cta_url)) window.open(data.cta_url, '_blank', 'noopener');
      else window.location.assign(data.cta_url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-md overflow-hidden border-0 p-0">
        <div className={`relative ${cls.ring} ring-1`}>
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cls.gradient}`} />
          <div className="relative p-6 sm:p-7">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${cls.bgIcon}`}>
              <Icon className={`h-8 w-8 ${cls.text}`} />
            </div>
            <h2 className="text-center font-display text-2xl font-bold">{data.title}</h2>
            <p className="mt-3 text-center text-sm text-muted-foreground whitespace-pre-line">{data.message}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              {data.cta_label && (
                <Button onClick={handleCta} className="flex-1">{data.cta_label}</Button>
              )}
              <Button variant="outline" onClick={dismiss} className="flex-1">
                {data.cta_label ? 'পরে দেখব' : 'বন্ধ করুন'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
