import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, PartyPopper, Megaphone, Gift, Bell, Info } from 'lucide-react';

export type WelcomeBanner = {
  enabled: boolean;
  title: string;
  message: string;
  cta_label: string;
  cta_url: string;
  audience: 'all' | 'guests' | 'members';
  variant: 'sparkles' | 'party' | 'megaphone' | 'gift' | 'bell' | 'info';
  accent: 'primary' | 'success' | 'destructive' | 'amber' | 'violet';
  version: number; // bump to re-show even after dismiss
};

export const DEFAULT_WELCOME: WelcomeBanner = {
  enabled: false,
  title: 'স্বাগতম! 🎉',
  message: 'JomaKhoros-এ আপনাকে স্বাগত জানাই। আপনার আর্থিক যাত্রা শুরু হোক আজ থেকেই।',
  cta_label: '',
  cta_url: '',
  audience: 'all',
  variant: 'sparkles',
  accent: 'primary',
  version: 1,
};

export function WelcomeBannerEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<WelcomeBanner>(DEFAULT_WELCOME);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'welcome_banner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings').select('setting_value')
        .eq('setting_key', 'welcome_banner').maybeSingle();
      if (error) throw error;
      return (data?.setting_value as WelcomeBanner) ?? DEFAULT_WELCOME;
    },
  });

  useEffect(() => {
    if (data) setC({ ...DEFAULT_WELCOME, ...data });
  }, [data]);

  const save = useMutation({
    mutationFn: async (v: WelcomeBanner) => {
      const { error } = await supabase.from('app_settings')
        .upsert({ setting_key: 'welcome_banner', setting_value: v as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'welcome_banner'] });
      toast.success('ওয়েলকাম ব্যানার আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reshow = () => {
    const next = { ...c, version: (c.version || 1) + 1 };
    setC(next);
    save.mutate(next);
    toast.success('সকল ব্যবহারকারীকে আবার দেখানো হবে');
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">ওয়েলকাম পপআপ ব্যানার</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div>
            <Label className="text-base font-medium">পপআপ চালু করুন</Label>
            <p className="text-sm text-muted-foreground">চালু থাকলে নির্বাচিত দর্শকদের পপআপ দেখানো হবে।</p>
          </div>
          <Switch checked={c.enabled} onCheckedChange={(v) => setC({ ...c, enabled: v })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">দর্শক</Label>
            <Select value={c.audience} onValueChange={(v: any) => setC({ ...c, audience: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সবাই (ভিজিটর + মেম্বার)</SelectItem>
                <SelectItem value="guests">শুধু ভিজিটর (লগইন ছাড়া)</SelectItem>
                <SelectItem value="members">শুধু মেম্বার (লগইন)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">আইকন</Label>
            <Select value={c.variant} onValueChange={(v: any) => setC({ ...c, variant: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sparkles">✨ Sparkles</SelectItem>
                <SelectItem value="party">🎉 Party</SelectItem>
                <SelectItem value="megaphone">📣 Megaphone</SelectItem>
                <SelectItem value="gift">🎁 Gift</SelectItem>
                <SelectItem value="bell">🔔 Bell</SelectItem>
                <SelectItem value="info">ℹ️ Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">রঙের থিম</Label>
            <Select value={c.accent} onValueChange={(v: any) => setC({ ...c, accent: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">টিল (প্রাইমারি)</SelectItem>
                <SelectItem value="success">সবুজ</SelectItem>
                <SelectItem value="destructive">লাল</SelectItem>
                <SelectItem value="amber">কমলা</SelectItem>
                <SelectItem value="violet">বেগুনি</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">শিরোনাম</Label>
          <Input value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">বার্তা</Label>
          <Textarea rows={4} value={c.message} onChange={(e) => setC({ ...c, message: e.target.value })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">বাটন লেবেল (ঐচ্ছিক)</Label>
            <Input value={c.cta_label} onChange={(e) => setC({ ...c, cta_label: e.target.value })} placeholder="যেমন: এখনই শুরু করুন" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">বাটন লিংক</Label>
            <Input value={c.cta_url} onChange={(e) => setC({ ...c, cta_url: e.target.value })} placeholder="/subscription বা https://..." />
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">প্রিভিউ</Label>
          <div className="rounded-xl border bg-muted/30 p-4">
            <WelcomeBannerPreview banner={c} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="flex-1">
            {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </Button>
          <Button variant="outline" onClick={reshow} disabled={save.isPending}>
            সবাইকে আবার দেখান
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          টিপ: কেউ "বন্ধ করুন" চাপলে পপআপ আর দেখাবে না। "সবাইকে আবার দেখান" চাপলে ভার্সন বেড়ে যাবে এবং সবার কাছে আবার দেখাবে।
        </p>
      </CardContent>
    </Card>
  );
}

const ICONS = { sparkles: Sparkles, party: PartyPopper, megaphone: Megaphone, gift: Gift, bell: Bell, info: Info };
const ACCENT_CLASSES: Record<WelcomeBanner['accent'], { ring: string; text: string; bgIcon: string; gradient: string }> = {
  primary: { ring: 'ring-primary/30', text: 'text-primary', bgIcon: 'bg-primary/10', gradient: 'from-primary/20 via-primary/5 to-transparent' },
  success: { ring: 'ring-success/30', text: 'text-success', bgIcon: 'bg-success/10', gradient: 'from-success/20 via-success/5 to-transparent' },
  destructive: { ring: 'ring-destructive/30', text: 'text-destructive', bgIcon: 'bg-destructive/10', gradient: 'from-destructive/20 via-destructive/5 to-transparent' },
  amber: { ring: 'ring-amber-400/30', text: 'text-amber-500', bgIcon: 'bg-amber-500/10', gradient: 'from-amber-500/20 via-amber-500/5 to-transparent' },
  violet: { ring: 'ring-violet-400/30', text: 'text-violet-500', bgIcon: 'bg-violet-500/10', gradient: 'from-violet-500/20 via-violet-500/5 to-transparent' },
};

export function getAccentClasses(a: WelcomeBanner['accent']) { return ACCENT_CLASSES[a] ?? ACCENT_CLASSES.primary; }
export function getVariantIcon(v: WelcomeBanner['variant']) { return ICONS[v] ?? Sparkles; }

function WelcomeBannerPreview({ banner }: { banner: WelcomeBanner }) {
  const Icon = getVariantIcon(banner.variant);
  const cls = getAccentClasses(banner.accent);
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm ring-1 ${cls.ring}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cls.gradient}`} />
      <div className="relative flex gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${cls.bgIcon}`}>
          <Icon className={`h-6 w-6 ${cls.text}`} />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold">{banner.title || 'শিরোনাম'}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{banner.message || 'বার্তা'}</p>
          {banner.cta_label && <Button size="sm" className="mt-2">{banner.cta_label}</Button>}
        </div>
      </div>
    </div>
  );
}
