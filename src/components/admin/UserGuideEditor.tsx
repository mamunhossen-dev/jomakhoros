import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export type GuideItem = { title: string; desc: string };
export type GuideSection = { key: string; heading: string; items: GuideItem[] };

export type UserGuideContent = {
  page_title: string;
  page_subtitle: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_desc: string;
  sections: GuideSection[];
  notice_title: string;
  notice_intro: string;
  notice_points: string[];
  tip_title: string;
  tip_desc: string;
  cta_title: string;
  cta_desc: string;
  cta_register_label: string;
  cta_login_label: string;
  footer_brand_name: string;
  footer_tagline: string;
  pdf_filename: string;
};

export const DEFAULT_GUIDE: UserGuideContent = {
  page_title: 'ব্যবহার নির্দেশিকা',
  page_subtitle: 'JomaKhoros-এর সম্পূর্ণ ব্যবহার গাইড',
  hero_eyebrow: 'স্বাগতম',
  hero_title: 'JomaKhoros-এ আপনাকে স্বাগতম',
  hero_desc:
    'দৈনন্দিন জীবনের জন্য একটি সহজ আয়-ব্যয় ট্র্যাকিং সিস্টেম। বাংলায় তৈরি, আপনার আর্থিক জীবনকে সহজ করার জন্য।',
  sections: [
    {
      key: 'getting_started',
      heading: 'শুরু করার ধাপসমূহ',
      items: [
        { title: 'ধাপ ১: অ্যাকাউন্ট তৈরি বা লগইন', desc: 'প্রথমে নিবন্ধন করুন অথবা আপনার বিদ্যমান অ্যাকাউন্ট দিয়ে লগইন করুন।' },
        { title: 'ধাপ ২: ওয়ালেট যোগ করুন', desc: 'নগদ, ব্যাংক, বিকাশ, নগদ ইত্যাদি ওয়ালেট তৈরি করুন।' },
        { title: 'ধাপ ৩: ক্যাটাগরি তৈরি করুন', desc: 'আয় ও ব্যয়ের জন্য আলাদা ক্যাটাগরি যোগ করুন।' },
        { title: 'ধাপ ৪: লেনদেন যোগ করুন', desc: 'প্রতিদিনের আয় ও খরচ লিপিবদ্ধ করুন।' },
        { title: 'ধাপ ৫: অ্যানালিটিক্স দেখুন', desc: 'চার্ট ও রিপোর্টের মাধ্যমে আপনার আর্থিক অবস্থা বুঝুন।' },
      ],
    },
    {
      key: 'wallet',
      heading: 'ওয়ালেট ব্যবস্থাপনা',
      items: [
        { title: 'ওয়ালেট কী?', desc: 'ওয়ালেট হলো আপনার টাকা রাখার ভার্চুয়াল জায়গা—যেমন নগদ, ব্যাংক বা মোবাইল ব্যাংকিং অ্যাকাউন্ট।' },
        { title: 'ওয়ালেট তৈরি করুন', desc: '"ওয়ালেট" পেজ থেকে নাম, ধরন (Cash/Bank/Mobile Banking) ও প্রাথমিক ব্যালেন্স দিয়ে নতুন ওয়ালেট তৈরি করুন।' },
        { title: 'ব্যালেন্স ম্যানেজ', desc: 'প্রতিটি লেনদেনের সাথে ওয়ালেটের ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হয়।' },
        { title: 'ওয়ালেটের মাঝে স্থানান্তর', desc: 'এক ওয়ালেট থেকে অন্য ওয়ালেটে সহজেই টাকা ট্রান্সফার করুন।' },
      ],
    },
    {
      key: 'category',
      heading: 'ক্যাটাগরি ব্যবস্থাপনা',
      items: [
        { title: 'ক্যাটাগরি কী?', desc: 'ক্যাটাগরি হলো আয়-ব্যয়ের ধরন—যেমন বেতন, খাবার, যাতায়াত ইত্যাদি।' },
        { title: 'আয়ের ক্যাটাগরি', desc: 'বেতন, ব্যবসা, ফ্রিল্যান্স, উপহার—এমন ক্যাটাগরি তৈরি করুন।' },
        { title: 'খরচের ক্যাটাগরি', desc: 'বাজার, ভাড়া, যাতায়াত, বিল, বিনোদন ইত্যাদি যোগ করুন।' },
        { title: 'এডিট ও মুছে ফেলা', desc: 'যেকোনো সময় ক্যাটাগরি এডিট বা মুছে ফেলতে পারবেন।' },
      ],
    },
    {
      key: 'transactions',
      heading: 'লেনদেন (Transactions)',
      items: [
        { title: 'আয় যোগ করুন', desc: 'টাকার পরিমাণ, ক্যাটাগরি ও ওয়ালেট নির্বাচন করে আয় এন্ট্রি দিন।' },
        { title: 'খরচ যোগ করুন', desc: 'একইভাবে দৈনিক খরচ লিপিবদ্ধ করুন।' },
        { title: 'ওয়ালেট নির্বাচন', desc: 'কোন ওয়ালেট থেকে লেনদেনটি হয়েছে তা চিহ্নিত করুন।' },
        { title: 'ক্যাটাগরি নির্বাচন', desc: 'সঠিক ক্যাটাগরি বাছাই করুন রিপোর্টিং সঠিক রাখতে।' },
        { title: 'নোট যোগ করুন (ঐচ্ছিক)', desc: 'লেনদেনের বিস্তারিত মনে রাখতে নোট লিখুন।' },
        { title: 'এডিট / ডিলিট', desc: 'ভুল হলে যেকোনো লেনদেন এডিট বা মুছে ফেলুন।' },
      ],
    },
    {
      key: 'analytics',
      heading: 'অ্যানালিটিক্স ড্যাশবোর্ড',
      items: [
        { title: 'ওভারভিউ', desc: 'মোট আয়, মোট ব্যয় ও বর্তমান ব্যালেন্স এক নজরে দেখুন।' },
        { title: 'বার ও পাই চার্ট', desc: 'মাসিক ট্রেন্ড ও ক্যাটাগরি-ভিত্তিক খরচ ভিজ্যুয়ালি বুঝুন।' },
        { title: 'ট্রেন্ড বিশ্লেষণ', desc: 'কোন মাসে কোথায় বেশি খরচ হচ্ছে তা বুঝে পরিকল্পনা করুন।' },
      ],
    },
    {
      key: 'features',
      heading: 'মূল ফিচারসমূহ',
      items: [
        { title: 'মাল্টি-ওয়ালেট সাপোর্ট', desc: 'একাধিক ওয়ালেট একসাথে।' },
        { title: 'ক্যাটাগরি ট্র্যাকিং', desc: 'ক্যাটাগরি অনুযায়ী রিপোর্ট।' },
        { title: 'অ্যানালিটিক্স ড্যাশবোর্ড', desc: 'ভিজ্যুয়াল চার্ট ও KPI।' },
        { title: 'বাংলা-বান্ধব UI', desc: 'সহজ ও পরিষ্কার ডিজাইন।' },
        { title: 'স্মার্ট ইনসাইটস', desc: 'খরচের প্যাটার্ন বুঝুন।' },
      ],
    },
    {
      key: 'tips',
      heading: 'ভালো ব্যবহারের টিপস',
      items: [
        { title: 'প্রতিদিন এন্ট্রি দিন', desc: 'রাতে মাত্র ২ মিনিট সময় নিয়ে দিনের লেনদেন লিখুন।' },
        { title: 'সঠিক ক্যাটাগরি ব্যবহার করুন', desc: 'রিপোর্ট সঠিক রাখতে সঠিক ক্যাটাগরি বাছুন।' },
        { title: 'সাপ্তাহিক রিভিউ', desc: 'প্রতি সপ্তাহে অ্যানালিটিক্স দেখে পরিকল্পনা করুন।' },
        { title: 'অপ্রয়োজনীয় খরচ কমান', desc: 'ট্রেন্ড দেখে অপ্রয়োজনীয় ব্যয় চিহ্নিত করুন।' },
      ],
    },
    {
      key: 'benefits',
      heading: 'কেন JomaKhoros ব্যবহার করবেন',
      items: [
        { title: 'টাকা ব্যবস্থাপনা সহজ করে', desc: 'কোথায় কত খরচ স্পষ্ট জানুন।' },
        { title: 'সঞ্চয়ের অভ্যাস বাড়ায়', desc: 'লক্ষ্য নির্ধারণ করে সঞ্চয় বাড়ান।' },
        { title: 'নতুনদের জন্য সহজ', desc: 'যে কেউ মুহূর্তেই ব্যবহার করতে পারবেন।' },
      ],
    },
  ],
  notice_title: 'গুরুত্বপূর্ণ: ওয়ালেট ব্যালেন্স সম্পর্কে স্পষ্টীকরণ',
  notice_intro:
    'JomaKhoros-এ যে ব্যালেন্স যোগ করা হয় তা সম্পূর্ণ ভার্চুয়াল ও ম্যানুয়াল হিসাবরক্ষণের তথ্য মাত্র — এটি আপনার আসল ব্যাংক, বিকাশ, নগদ বা রকেট অ্যাকাউন্টের সাথে কোনোভাবেই সংযুক্ত নয়।',
  notice_points: [
    'আমরা আপনার আসল অ্যাকাউন্টের কোনো তথ্য, পিন, OTP বা পাসওয়ার্ড চাই না এবং সংরক্ষণ করি না।',
    'এখানে দেওয়া ব্যালেন্স আপনার নিজস্ব হিসাব রাখার জন্য — এটি দিয়ে কোনো টাকা পাঠানো, তোলা বা লেনদেন করা যায় না।',
    'এই অ্যাপ থেকে কেউ আপনার আসল টাকা হ্যাক বা স্ক্যাম করতে পারবে না, কারণ অ্যাপটি কোনো আর্থিক প্রতিষ্ঠানের সাথে সরাসরি সংযুক্ত নয়।',
    'মনে করুন এটি একটি ডিজিটাল খাতা/ডায়েরি — আপনি কাগজে যেভাবে আয়-ব্যয় লিখে রাখতেন, ঠিক সেভাবেই এখানে লিখে রাখছেন।',
  ],
  tip_title: 'টিপ',
  tip_desc: 'প্রতিদিন রাতে মাত্র ২ মিনিট সময় নিয়ে দিনের লেনদেন এন্ট্রি করুন—এটি অভ্যাসে পরিণত হবে।',
  cta_title: 'আজই শুরু করুন আপনার আর্থিক যাত্রা',
  cta_desc: 'JomaKhoros-এ বিনামূল্যে অ্যাকাউন্ট খুলুন এবং সহজেই আপনার আয়-ব্যয় ট্র্যাক করা শুরু করুন।',
  cta_register_label: 'রেজিস্ট্রেশন করুন',
  cta_login_label: 'লগইন করুন',
  footer_brand_name: 'JomaKhoros',
  footer_tagline: 'আপনার ব্যক্তিগত আর্থিক সঙ্গী • Track. Save. Grow.',
  pdf_filename: 'JomaKhoros-User-Guide',
};

export function UserGuideEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<UserGuideContent>(DEFAULT_GUIDE);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'user_guide_content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings').select('setting_value')
        .eq('setting_key', 'user_guide_content').maybeSingle();
      if (error) throw error;
      return (data?.setting_value as UserGuideContent) ?? DEFAULT_GUIDE;
    },
  });

  useEffect(() => {
    if (data) {
      setC({
        ...DEFAULT_GUIDE,
        ...data,
        sections: data.sections?.length ? data.sections : DEFAULT_GUIDE.sections,
        notice_points: data.notice_points ?? DEFAULT_GUIDE.notice_points,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async (v: UserGuideContent) => {
      const { error } = await supabase.from('app_settings')
        .upsert({ setting_key: 'user_guide_content', setting_value: v as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'user_guide_content'] });
      toast.success('গাইড আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSection = (i: number, p: Partial<GuideSection>) =>
    setC({ ...c, sections: c.sections.map((s, idx) => idx === i ? { ...s, ...p } : s) });
  const updateItem = (si: number, ii: number, p: Partial<GuideItem>) =>
    updateSection(si, { items: c.sections[si].items.map((it, idx) => idx === ii ? { ...it, ...p } : it) });
  const addItem = (si: number) =>
    updateSection(si, { items: [...c.sections[si].items, { title: '', desc: '' }] });
  const removeItem = (si: number, ii: number) =>
    updateSection(si, { items: c.sections[si].items.filter((_, idx) => idx !== ii) });

  const updateNoticePoint = (i: number, v: string) =>
    setC({ ...c, notice_points: c.notice_points.map((p, idx) => idx === i ? v : p) });
  const addNoticePoint = () => setC({ ...c, notice_points: [...c.notice_points, ''] });
  const removeNoticePoint = (i: number) =>
    setC({ ...c, notice_points: c.notice_points.filter((_, idx) => idx !== i) });

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">User Guide পেইজ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Page heading */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">পেইজ হেডার</Label>
          <Input placeholder="পেইজ টাইটেল" value={c.page_title} onChange={(e) => setC({ ...c, page_title: e.target.value })} />
          <Input placeholder="সাব-টাইটেল" value={c.page_subtitle} onChange={(e) => setC({ ...c, page_subtitle: e.target.value })} />
        </div>

        {/* Hero */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">হিরো / স্বাগতম সেকশন</Label>
          <Input placeholder="ছোট লেবেল (যেমন: স্বাগতম)" value={c.hero_eyebrow} onChange={(e) => setC({ ...c, hero_eyebrow: e.target.value })} />
          <Input placeholder="হিরো টাইটেল" value={c.hero_title} onChange={(e) => setC({ ...c, hero_title: e.target.value })} />
          <Textarea rows={3} placeholder="হিরো বিবরণ" value={c.hero_desc} onChange={(e) => setC({ ...c, hero_desc: e.target.value })} />
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">সেকশনসমূহ</Label>
          {c.sections.map((s, si) => {
            const open = openSection === s.key;
            return (
              <div key={s.key} className="rounded-lg border">
                <button
                  type="button"
                  onClick={() => setOpenSection(open ? null : s.key)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <span className="text-sm font-medium">{s.heading || s.key}</span>
                  {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {open && (
                  <div className="space-y-3 border-t p-3">
                    <Input
                      placeholder="সেকশন শিরোনাম"
                      value={s.heading}
                      onChange={(e) => updateSection(si, { heading: e.target.value })}
                    />
                    {s.items.map((it, ii) => (
                      <div key={ii} className="space-y-2 rounded-md border p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">আইটেম #{ii + 1}</span>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(si, ii)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Input placeholder="আইটেম শিরোনাম" value={it.title} onChange={(e) => updateItem(si, ii, { title: e.target.value })} />
                        <Textarea rows={2} placeholder="বিবরণ" value={it.desc} onChange={(e) => updateItem(si, ii, { desc: e.target.value })} />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addItem(si)}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> আইটেম যোগ
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Notice */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">নিরাপত্তা নোটিশ (ওয়ালেট সেকশনের নিচে)</Label>
          <Input placeholder="নোটিশ শিরোনাম" value={c.notice_title} onChange={(e) => setC({ ...c, notice_title: e.target.value })} />
          <Textarea rows={3} placeholder="ভূমিকা" value={c.notice_intro} onChange={(e) => setC({ ...c, notice_intro: e.target.value })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">পয়েন্টসমূহ</Label>
              <Button variant="outline" size="sm" onClick={addNoticePoint}>
                <Plus className="mr-1 h-3.5 w-3.5" /> পয়েন্ট
              </Button>
            </div>
            {c.notice_points.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Textarea rows={2} value={p} onChange={(e) => updateNoticePoint(i, e.target.value)} />
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeNoticePoint(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">টিপ বক্স</Label>
          <Input placeholder="টিপ শিরোনাম" value={c.tip_title} onChange={(e) => setC({ ...c, tip_title: e.target.value })} />
          <Textarea rows={2} placeholder="টিপ" value={c.tip_desc} onChange={(e) => setC({ ...c, tip_desc: e.target.value })} />
        </div>

        {/* CTA */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">CTA (অতিথিদের জন্য)</Label>
          <Input placeholder="CTA টাইটেল" value={c.cta_title} onChange={(e) => setC({ ...c, cta_title: e.target.value })} />
          <Textarea rows={2} placeholder="CTA বিবরণ" value={c.cta_desc} onChange={(e) => setC({ ...c, cta_desc: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="রেজিস্ট্রেশন বাটন" value={c.cta_register_label} onChange={(e) => setC({ ...c, cta_register_label: e.target.value })} />
            <Input placeholder="লগইন বাটন" value={c.cta_login_label} onChange={(e) => setC({ ...c, cta_login_label: e.target.value })} />
          </div>
        </div>

        {/* Footer brand */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">ফুটার ব্র্যান্ড</Label>
          <Input placeholder="ব্র্যান্ড নাম" value={c.footer_brand_name} onChange={(e) => setC({ ...c, footer_brand_name: e.target.value })} />
          <Input placeholder="ট্যাগলাইন" value={c.footer_tagline} onChange={(e) => setC({ ...c, footer_tagline: e.target.value })} />
          <Input placeholder="PDF ফাইল নাম (এক্সটেনশন ছাড়া)" value={c.pdf_filename} onChange={(e) => setC({ ...c, pdf_filename: e.target.value })} />
        </div>

        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
