import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export type FooterLink = { label: string; url: string };
export type SiteSettings = {
  site_title: string;
  meta_description: string;
  og_image_url: string;
  not_found_title: string;
  not_found_message: string;
  not_found_back_label: string;
  footer_links: FooterLink[];
};

export const DEFAULT_SITE: SiteSettings = {
  site_title: 'JomaKhoros - আপনার আর্থিক সহচর',
  meta_description: 'JomaKhoros - আয়, ব্যয়, বাজেট ও আর্থিক রিপোর্ট ট্র্যাক করুন এক জায়গায়।',
  og_image_url: '',
  not_found_title: '৪০৪',
  not_found_message: 'দুঃখিত! এই পেইজটি খুঁজে পাওয়া যায়নি।',
  not_found_back_label: 'হোমে ফিরে যান',
  footer_links: [
    { label: 'গাইড', url: '/user-guide' },
    { label: 'শর্তাবলী', url: '/terms' },
    { label: 'লগইন', url: '/login' },
  ],
};

export function SiteSettingsEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<SiteSettings>(DEFAULT_SITE);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings').select('setting_value')
        .eq('setting_key', 'site_settings').maybeSingle();
      if (error) throw error;
      return (data?.setting_value as SiteSettings) ?? DEFAULT_SITE;
    },
  });

  useEffect(() => {
    if (data) setC({ ...DEFAULT_SITE, ...data, footer_links: data.footer_links ?? DEFAULT_SITE.footer_links });
  }, [data]);

  const save = useMutation({
    mutationFn: async (v: SiteSettings) => {
      const { error } = await supabase.from('app_settings')
        .upsert({ setting_key: 'site_settings', setting_value: v as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'site_settings'] });
      toast.success('সাইট সেটিংস আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateLink = (i: number, p: Partial<FooterLink>) =>
    setC({ ...c, footer_links: c.footer_links.map((l, idx) => idx === i ? { ...l, ...p } : l) });
  const addLink = () => setC({ ...c, footer_links: [...c.footer_links, { label: '', url: '' }] });
  const removeLink = (i: number) => setC({ ...c, footer_links: c.footer_links.filter((_, idx) => idx !== i) });

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">সাধারণ সাইট সেটিংস</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* SEO */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">SEO / মেটা ট্যাগ</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">পেইজ টাইটেল (ব্রাউজার ট্যাবে দেখাবে)</Label>
            <Input value={c.site_title} onChange={(e) => setC({ ...c, site_title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Meta Description (সার্চ রেজাল্টে)</Label>
            <Textarea rows={2} value={c.meta_description} onChange={(e) => setC({ ...c, meta_description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">OG Image URL (সোশ্যাল শেয়ারে)</Label>
            <Input value={c.og_image_url} onChange={(e) => setC({ ...c, og_image_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>

        {/* 404 */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">404 পেইজ</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="শিরোনাম (যেমন: ৪০৪)" value={c.not_found_title} onChange={(e) => setC({ ...c, not_found_title: e.target.value })} />
            <Input placeholder="ব্যাক বাটন লেবেল" value={c.not_found_back_label} onChange={(e) => setC({ ...c, not_found_back_label: e.target.value })} />
          </div>
          <Textarea rows={2} placeholder="মেসেজ" value={c.not_found_message} onChange={(e) => setC({ ...c, not_found_message: e.target.value })} />
        </div>

        {/* Footer links */}
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">ল্যান্ডিং ফুটার লিংক</Label>
            <Button variant="outline" size="sm" onClick={addLink}>
              <Plus className="mr-1 h-3.5 w-3.5" /> লিংক যোগ
            </Button>
          </div>
          {c.footer_links.map((l, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder="লেবেল" value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
              <Input placeholder="URL (যেমন: /terms বা https://...)" value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeLink(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
