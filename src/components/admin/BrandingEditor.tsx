import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export type Brand = {
  name: string;
  tagline: string;
  /** HSL components (e.g. "160 84% 39%") — without hsl() wrapper */
  primary_hsl: string;
};

export const DEFAULT_BRAND: Brand = {
  name: 'JomaKhoros',
  tagline: 'Track. Save. Grow.',
  primary_hsl: '160 84% 39%',
};

const PRESETS: { label: string; hsl: string }[] = [
  { label: 'Teal (ডিফল্ট)', hsl: '160 84% 39%' },
  { label: 'Emerald', hsl: '152 76% 36%' },
  { label: 'Blue', hsl: '217 91% 60%' },
  { label: 'Indigo', hsl: '239 84% 60%' },
  { label: 'Violet', hsl: '262 83% 58%' },
  { label: 'Pink', hsl: '330 81% 60%' },
  { label: 'Rose', hsl: '347 77% 50%' },
  { label: 'Orange', hsl: '25 95% 53%' },
];

// Convert HSL "160 84% 39%" → hex for color input
function hslToHex(hslStr: string): string {
  const m = hslStr.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return '#10b981';
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return '160 84% 39%';
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function BrandingEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<Brand>(DEFAULT_BRAND);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'brand'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings').select('setting_value')
        .eq('setting_key', 'brand').maybeSingle();
      if (error) throw error;
      return (data?.setting_value as Brand) ?? DEFAULT_BRAND;
    },
  });

  useEffect(() => { if (data) setC({ ...DEFAULT_BRAND, ...data }); }, [data]);

  const save = useMutation({
    mutationFn: async (v: Brand) => {
      const { error } = await supabase.from('app_settings')
        .upsert({ setting_key: 'brand', setting_value: v as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'brand'] });
      toast.success('ব্র্যান্ডিং আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">ব্র্যান্ডিং</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>অ্যাপ নাম</Label>
            <Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>ট্যাগলাইন</Label>
            <Input value={c.tagline} onChange={(e) => setC({ ...c, tagline: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">প্রাইমারি কালার</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={hslToHex(c.primary_hsl)}
              onChange={(e) => setC({ ...c, primary_hsl: hexToHsl(e.target.value) })}
              className="h-10 w-16 cursor-pointer rounded border"
            />
            <Input
              value={c.primary_hsl}
              onChange={(e) => setC({ ...c, primary_hsl: e.target.value })}
              placeholder="HSL (যেমন: 160 84% 39%)"
              className="font-mono text-sm"
            />
            <div
              className="h-10 w-16 shrink-0 rounded border shadow-sm"
              style={{ background: `hsl(${c.primary_hsl})` }}
              title="প্রিভিউ"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {PRESETS.map(p => (
              <button
                key={p.hsl}
                type="button"
                onClick={() => setC({ ...c, primary_hsl: p.hsl })}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition hover:border-foreground/30 ${c.primary_hsl === p.hsl ? 'border-foreground/50 bg-muted' : ''}`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: `hsl(${p.hsl})` }} />
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            পরিবর্তন সংরক্ষণ করার পর সাইটের সব প্রাইমারি কালার (বাটন, ব্যাজ, লিংক, সাইডবার অ্যাকসেন্ট) স্বয়ংক্রিয়ভাবে আপডেট হবে।
          </p>
        </div>

        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
