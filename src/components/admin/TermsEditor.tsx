import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type TermsSection = { heading: string; body_md: string };
export type TermsContent = {
  page_title: string;
  sections: TermsSection[];
  footer_note: string;
};

export const DEFAULT_TERMS: TermsContent = {
  page_title: 'শর্তাবলী (Terms & Conditions)',
  sections: [
    {
      heading: '১. ফ্রি ট্রায়াল নীতি',
      body_md:
        '- প্রতিটি নতুন ব্যবহারকারী রেজিস্ট্রেশনের পর **১ মাস ফ্রি ট্রায়াল** পাবেন।\n- ট্রায়াল চলাকালীন সকল প্রো ফিচার সম্পূর্ণ বিনামূল্যে ব্যবহার করা যাবে।\n- ট্রায়ালের মেয়াদ শেষ হলে আপগ্রেড অপশন দেখানো হবে।',
    },
    {
      heading: '২. ফ্রি ভার্সনের সীমাবদ্ধতা',
      body_md:
        'ট্রায়ালের মেয়াদ শেষ হলে এবং আপগ্রেড না করলে ফ্রি ভার্সনে নিম্নলিখিত সীমাবদ্ধতা থাকবে:\n\n- শুধুমাত্র শেষ ১৫ দিনের লেনদেন দেখা যাবে\n- পূর্ণ লেনদেনের ইতিহাস লুকানো থাকবে\n- PDF এক্সপোর্ট নিষ্ক্রিয়\n- কিছু রিপোর্ট সীমিত থাকবে',
    },
    {
      heading: '৩. সাবস্ক্রিপশন মূল্য',
      body_md: '| প্ল্যান | মূল্য |\n|---|---|\n| ১ মাস | ১০ ৳ |\n| ৬ মাস | ৫০ ৳ |\n| ১ বছর | ১০০ ৳ |',
    },
    {
      heading: '৪. পেমেন্ট যাচাই প্রক্রিয়া',
      body_md:
        '- ব্যবহারকারী সাবস্ক্রিপশন প্ল্যান নির্বাচন করবেন\n- বিকাশ / নগদ / রকেট নম্বরে অথবা ব্যাংক একাউন্টে টাকা পাঠাবেন\n- পেমেন্ট পদ্ধতি ও ট্রানজেকশন/রেফারেন্স আইডি জমা দেবেন\n- অ্যাডমিন যাচাই করে প্রো অ্যাকাউন্ট সক্রিয় করবেন',
    },
    {
      heading: '৫. রিফান্ড নীতি',
      body_md: '**কোনো রিফান্ড প্রদান করা হবে না। সকল বিক্রয় চূড়ান্ত।**',
    },
    {
      heading: '৬. সম্মতি',
      body_md:
        'রেজিস্ট্রেশনের সময় "আমি শর্তাবলীতে সম্মত" চেকবক্স চেক করে আপনি উপরের সকল শর্তে সম্মত হচ্ছেন।',
    },
  ],
  footer_note: '',
};

export function TermsEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<TermsContent>(DEFAULT_TERMS);
  const [preview, setPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'terms_page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'terms_page')
        .maybeSingle();
      if (error) throw error;
      return (data?.setting_value as TermsContent) ?? DEFAULT_TERMS;
    },
  });

  useEffect(() => {
    if (data) setC({ ...DEFAULT_TERMS, ...data, sections: data.sections ?? DEFAULT_TERMS.sections });
  }, [data]);

  const save = useMutation({
    mutationFn: async (value: TermsContent) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { setting_key: 'terms_page', setting_value: value as any },
          { onConflict: 'setting_key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'terms_page'] });
      toast.success('শর্তাবলী আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSec = (i: number, p: Partial<TermsSection>) =>
    setC({ ...c, sections: c.sections.map((s, idx) => (idx === i ? { ...s, ...p } : s)) });
  const addSec = () => setC({ ...c, sections: [...c.sections, { heading: '', body_md: '' }] });
  const removeSec = (i: number) => setC({ ...c, sections: c.sections.filter((_, idx) => idx !== i) });
  const moveSec = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= c.sections.length) return;
    const arr = [...c.sections];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setC({ ...c, sections: arr });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">শর্তাবলী পেইজ কন্টেন্ট</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
          <Eye className="mr-1 h-3.5 w-3.5" />
          {preview ? 'এডিট' : 'প্রিভিউ'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {preview ? (
          <div className="rounded-lg border p-4">
            <h2 className="font-display text-2xl font-bold">{c.page_title}</h2>
            <div className="mt-4 space-y-5">
              {c.sections.map((s, i) => (
                <section key={i}>
                  <h3 className="font-display text-lg font-semibold">{s.heading}</h3>
                  <div className="prose prose-sm dark:prose-invert mt-1 max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.body_md}</ReactMarkdown>
                  </div>
                </section>
              ))}
            </div>
            {c.footer_note && (
              <p className="mt-4 text-sm text-muted-foreground italic">{c.footer_note}</p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>পেইজ শিরোনাম</Label>
              <Input value={c.page_title} onChange={(e) => setC({ ...c, page_title: e.target.value })} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>সেকশন লিস্ট (Markdown সাপোর্ট)</Label>
                <Button variant="outline" size="sm" onClick={addSec}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> সেকশন যোগ
                </Button>
              </div>
              {c.sections.map((s, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">সেকশন #{i + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => moveSec(i, -1)} disabled={i === 0}>↑</Button>
                      <Button variant="ghost" size="sm" onClick={() => moveSec(i, 1)} disabled={i === c.sections.length - 1}>↓</Button>
                      <Button variant="ghost" size="sm" onClick={() => removeSec(i)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Input placeholder="শিরোনাম" value={s.heading} onChange={(e) => updateSec(i, { heading: e.target.value })} />
                  <Textarea rows={5} placeholder="মার্কডাউন কন্টেন্ট" value={s.body_md} onChange={(e) => updateSec(i, { body_md: e.target.value })} />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>ফুটার নোট (ঐচ্ছিক)</Label>
              <Textarea rows={2} value={c.footer_note} onChange={(e) => setC({ ...c, footer_note: e.target.value })} />
            </div>
          </>
        )}

        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
