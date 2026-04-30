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
  page_title: 'জমা-খরচ (JomaKhoros) ব্যবহারের শর্তাবলী',
  sections: [
    {
      heading: 'ভূমিকা',
      body_md:
        'স্বাগতম! জমা-খরচ আপনার ব্যক্তিগত বা ক্ষুদ্র ব্যবসার হিসাব-নিকাশ সহজ করতে তৈরি করা একটি প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য হলো আপনাকে স্বচ্ছ এবং নির্ভুল আর্থিক হিসাবের নিশ্চয়তা দেওয়া। আমাদের সেবাগুলো ব্যবহারের ক্ষেত্রে নিচের শর্তাবলী প্রযোজ্য হবে।',
    },
    {
      heading: '১. বিশেষ আর্লি-বার্ড অফার (সীমিত সময়ের জন্য) 🎁',
      body_md:
        'আমাদের নতুন প্রজেক্টের যাত্রায় সঙ্গী হওয়ার জন্য আপনাকে ধন্যবাদ!\n\nযারা আমাদের নিজস্ব ডোমেইন (Custom Domain) যুক্ত হওয়ার আগেই রেজিস্ট্রেশন করবেন, তারা কোনো শর্ত ছাড়াই **২ বছরের জন্য প্রো সাবস্ক্রিপশন সম্পূর্ণ ফ্রি** পাবেন।',
    },
    {
      heading: '২. ফ্রি ট্রায়াল এবং মেম্বারশিপ',
      body_md:
        '- সকল নতুন ইউজার রেজিস্ট্রেশনের পর **১ মাস সম্পূর্ণ ফ্রিতে** প্রো ফিচারের অভিজ্ঞতা নিতে পারবেন।\n- ট্রায়াল পিরিয়ড শেষ হওয়ার পর আপনি চাইলে আমাদের অত্যন্ত সাশ্রয়ী প্যাকেজগুলো বেছে নিতে পারেন অথবা ফ্রি ভার্সন চালিয়ে যেতে পারেন।',
    },
    {
      heading: '৩. ফ্রি ভার্সন এবং ডেটা সুরক্ষা',
      body_md:
        'ট্রায়াল বা প্রো মেম্বারশিপের মেয়াদ শেষ হলে ফ্রি ভার্সনে কিছু সীমাবদ্ধতা থাকতে পারে (যেমন: শুধুমাত্র শেষ ১৫ দিনের বিস্তারিত হিসাব দেখা বা পিডিএফ রিপোর্ট)। তবে **আপনার কোনো ডেটা ডিলিট করা হবে না**। আপনার ইনপুট করা সকল তথ্য আমাদের সার্ভারে সুরক্ষিত থাকবে। পরবর্তীতে প্রো অ্যাকাউন্টে আপগ্রেড করলেই আপনি আপনার পুরনো সকল ডেটা ও ফুল হিস্ট্রি পুনরায় দেখতে পাবেন।',
    },
    {
      heading: '৪. সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান',
      body_md:
        'আমরা বিশ্বাস করি হিসাব রাখার সুবিধা সবার কাছে পৌঁছানো উচিত। তাই আমাদের ফি রাখা হয়েছে একেবারেই নামমাত্র:\n\n| প্ল্যান | মূল্য |\n|---|---|\n| ১ মাস | ১০ ৳ |\n| ৬ মাস | ৫০ ৳ |\n| ১ বছর | ১০০ ৳ |',
    },
    {
      heading: '৫. সহজ পেমেন্ট ও অ্যাক্টিভেশন প্রক্রিয়া',
      body_md:
        '- ইউজার অ্যাপের ভেতর দেওয়া **বিকাশ, নগদ বা রকেট** নম্বরে সেন্ড মানি করে ট্রানজেকশন/রেফারেন্স আইডি সাবমিট করবেন।\n- আপনার পেমেন্ট পাওয়ার পর আমাদের টিম যাচাই করে **সর্বোচ্চ ২৪ ঘণ্টার মধ্যে** আপনার প্রো অ্যাকাউন্ট সক্রিয় করে দেবে। সাধারণত আমরা এর চেয়েও দ্রুত করার চেষ্টা করি।',
    },
    {
      heading: '৬. রিফান্ড ও সাপোর্ট পলিসি',
      body_md:
        'এটি একটি ডিজিটাল সার্ভিস হওয়ায় সরাসরি রিফান্ড প্রযোজ্য নয়। তবে যদি পেমেন্ট করার পর কোনো টেকনিক্যাল সমস্যার কারণে অ্যাকাউন্ট সক্রিয় না হয়, তবে আমরা দ্রুত সেটি সমাধান করতে দায়বদ্ধ।',
    },
    {
      heading: '৭. গোপনীয়তা রক্ষা',
      body_md:
        'আপনার ব্যক্তিগত লেনদেনের তথ্য আমাদের কাছে আমানত। আমরা কোনোভাবেই আপনার ডেটা অন্য কারো কাছে শেয়ার করি না এবং উন্নত এনক্রিপশনের মাধ্যমে ডেটা সুরক্ষিত রাখি।',
    },
    {
      heading: '৮. আপনার আর্থিক তথ্যের সুরক্ষা — আমাদের প্রতিশ্রুতি 🔒',
      body_md:
        'আমরা বিশ্বাস করি, আর্থিক তথ্য মানুষের সবচেয়ে সংবেদনশীল ব্যক্তিগত তথ্যের একটি। তাই JomaKhoros-এ আপনার ডেটা সুরক্ষায় আমরা **ডাটাবেস লেভেলে কঠোর নিয়ম** (Row-Level Security) প্রয়োগ করেছি।\n\n**আপনার যে ডেটা শুধুমাত্র আপনিই দেখতে পাবেন:**\n\n| তথ্যের ধরন | কে দেখতে পাবে |\n|---|---|\n| লেনদেন (আয়/ব্যয়) | শুধুমাত্র আপনি |\n| ওয়ালেট ও ব্যালেন্স | শুধুমাত্র আপনি |\n| বাজেট | শুধুমাত্র আপনি |\n| ঋণ (দেনা/পাওনা) | শুধুমাত্র আপনি |\n| ক্যাটাগরি | শুধুমাত্র আপনি |\n\n**গুরুত্বপূর্ণ:** এই অ্যাপের **এডমিন বা মডারেটর কেউই আপনার লেনদেন, ব্যালেন্স, বাজেট বা ঋণের তথ্য দেখতে পান না, এক্সপোর্ট করতে পারেন না, বা পরিবর্তন করতে পারেন না।** এমনকি আমরাও না। এটি কোনো নীতিগত প্রতিশ্রুতি নয় — এটি আমাদের ডাটাবেসে **টেকনিক্যালি প্রয়োগ করা** নিয়ম।',
    },
    {
      heading: '৯. এডমিন কী কী দেখতে ও করতে পারেন',
      body_md:
        'স্বচ্ছতার স্বার্থে আপনাকে জানিয়ে রাখি, এডমিন/মডারেটরের অ্যাক্সেস শুধুমাত্র সাপোর্ট ও অ্যাকাউন্ট ম্যানেজমেন্টের জন্য সীমাবদ্ধ:\n\n- ✅ আপনার প্রোফাইল তথ্য (নাম, ইমেইল, ফোন, ঠিকানা) — সাপোর্ট ও যোগাযোগের জন্য\n- ✅ অ্যাকাউন্ট স্ট্যাটাস (ট্রায়াল/ফ্রি/প্রো), ব্লক/আনব্লক\n- ✅ পেমেন্ট রিকোয়েস্ট ও সাবস্ক্রিপশন ম্যানেজমেন্ট\n- ✅ সাপোর্ট চ্যাট ও ফিডব্যাক\n- ✅ সামগ্রিক পরিসংখ্যান (মোট ব্যবহারকারী সংখ্যা ইত্যাদি — কারো ব্যক্তিগত তথ্য ছাড়া)\n- ❌ আপনার লেনদেন, ওয়ালেট, বাজেট বা ঋণের কোনো তথ্য **নয়**\n\nএভাবেই আমরা আপনাকে নিশ্চিন্তে আপনার সব আর্থিক হিসাব রাখার পরিবেশ তৈরি করেছি।',
    },
    {
      heading: 'কেন আপনি হতাশ হবেন না?',
      body_md:
        '- আমরা আপনার একটি পয়সাও নষ্ট হতে দেব না।\n- আপনার মূল্যবান তথ্য সবসময় আমাদের কাছে সুরক্ষিত।\n- যেকোনো প্রয়োজনে আমরা সরাসরি মেসেজ বা সাপোর্টে আপনার পাশে আছি।',
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
