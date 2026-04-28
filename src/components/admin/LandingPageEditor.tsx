import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export type LandingStat = { value: string; label: string };
export type LandingStep = { title: string; desc: string };
export type LandingFeature = { title: string; desc: string };
export type LandingTestimonial = { name: string; role: string; text: string };
export type LandingFaq = { q: string; a: string };

export type LandingContent = {
  hero: {
    badge: string;
    title_part1: string;
    title_highlight: string;
    subtitle: string;
    cta_primary: string;
    cta_secondary: string;
    rating_text: string;
  };
  stats: LandingStat[];
  how: {
    badge: string;
    title: string;
    subtitle: string;
    steps: LandingStep[];
  };
  features: {
    badge: string;
    title: string;
    subtitle: string;
    items: LandingFeature[];
  };
  why: {
    title: string;
    subtitle: string;
    bullets: string[];
  };
  testimonials: {
    badge: string;
    title: string;
    subtitle: string;
    items: LandingTestimonial[];
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    items: LandingFaq[];
  };
  final_cta: {
    title: string;
    subtitle: string;
    cta_primary: string;
    cta_secondary: string;
  };
  footer: {
    tagline: string;
    copyright: string;
  };
};

export const DEFAULT_LANDING: LandingContent = {
  hero: {
    badge: 'বাংলাদেশের #১ পার্সোনাল ফাইন্যান্স অ্যাপ',
    title_part1: 'Spend smart.',
    title_highlight: 'Live better.',
    subtitle:
      'JomaKhoros দিয়ে দৈনন্দিন আয়-ব্যয় ট্র্যাক করুন, বাজেট তৈরি করুন এবং সহজেই সঞ্চয়ের অভ্যাস গড়ে তুলুন। সম্পূর্ণ বাংলায়, সম্পূর্ণ বিনামূল্যে শুরু।',
    cta_primary: 'ফ্রি অ্যাকাউন্ট খুলুন',
    cta_secondary: 'ফিচারগুলো দেখুন',
    rating_text: '৪.৯ • হাজারো ব্যবহারকারীর পছন্দ',
  },
  stats: [
    { value: '১০,০০০+', label: 'সক্রিয় ব্যবহারকারী' },
    { value: '৫০ লক্ষ+', label: 'লেনদেন ট্র্যাক' },
    { value: '৪.৯★', label: 'গড় রেটিং' },
  ],
  how: {
    badge: 'মাত্র ৩ ধাপে শুরু',
    title: 'কীভাবে কাজ করে',
    subtitle: 'জটিলতা নেই। মাত্র ১ মিনিটেই শুরু করতে পারবেন আপনার আর্থিক যাত্রা।',
    steps: [
      { title: 'অ্যাকাউন্ট খুলুন', desc: 'মাত্র ১ মিনিটে ফ্রি রেজিস্ট্রেশন করুন।' },
      { title: 'লেনদেন যোগ করুন', desc: 'প্রতিদিনের আয়-ব্যয় সহজে এন্ট্রি দিন।' },
      { title: 'অগ্রগতি দেখুন', desc: 'রিপোর্ট ও চার্টে আপনার আর্থিক চিত্র জানুন।' },
    ],
  },
  features: {
    badge: 'শক্তিশালী ফিচার',
    title: 'আপনার জন্য যা যা দরকার, সব এক অ্যাপে',
    subtitle: 'সহজ, দ্রুত এবং কার্যকর — যাতে আপনি সময় নষ্ট না করে আর্থিক সিদ্ধান্ত নিতে পারেন।',
    items: [
      { title: 'মাল্টি-ওয়ালেট', desc: 'নগদ, ব্যাংক, বিকাশ, রকেট — সব এক জায়গায়।' },
      { title: 'স্মার্ট ক্যাটাগরি', desc: 'আয়-ব্যয় সাজান আপনার মতো করে।' },
      { title: 'লাইভ অ্যানালিটিক্স', desc: 'চার্ট ও রিপোর্টে স্পষ্ট চিত্র।' },
      { title: 'বাজেট ও সঞ্চয়', desc: 'লক্ষ্য সেট করে সঞ্চয় বাড়ান।' },
      { title: 'স্মার্ট রিমাইন্ডার', desc: 'প্রতিদিনের খরচ লিখতে ভুলবেন না।' },
      { title: 'মোবাইল ফ্রেন্ডলি', desc: 'যেকোনো ডিভাইসে নিখুঁত।' },
      { title: 'PDF রিপোর্ট', desc: 'মাসিক রিপোর্ট ডাউনলোড করুন এক ক্লিকে।' },
      { title: 'লোন ট্র্যাকিং', desc: 'ধার দেওয়া-নেওয়ার হিসাব রাখুন।' },
      { title: 'সম্পূর্ণ বাংলায়', desc: 'বাংলাভাষীদের জন্য তৈরি।' },
    ],
  },
  why: {
    title: 'কেন JomaKhoros?',
    subtitle: 'বাংলাভাষীদের জন্য, বাংলাদেশের প্রেক্ষাপটে তৈরি — যাতে হিসাব রাখা হয়ে ওঠে সহজ ও আনন্দদায়ক।',
    bullets: [
      'সম্পূর্ণ বাংলায় ইন্টারফেস',
      'টাকার মাধ্যমে হিসাব (৳)',
      'বিকাশ, নগদ, রকেট সাপোর্ট',
      'PDF রিপোর্ট ডাউনলোড',
      'কোনো বিজ্ঞাপন নেই',
    ],
  },
  testimonials: {
    badge: 'ব্যবহারকারীদের কথা',
    title: 'যারা JomaKhoros-কে ভালোবাসেন',
    subtitle: 'হাজারো মানুষ ইতোমধ্যে তাদের আর্থিক জীবন বদলেছেন। আপনিও যোগ দিন।',
    items: [
      { name: 'রাকিবুল হাসান', role: 'শিক্ষার্থী, ঢাকা', text: 'আগে মাস শেষে টাকা কোথায় খরচ হলো বুঝতাম না। JomaKhoros ব্যবহার শুরুর পর প্রতিটি টাকার হিসাব এখন আমার হাতে।' },
      { name: 'সুমাইয়া আক্তার', role: 'গৃহিণী, চট্টগ্রাম', text: 'বাজার, বিল, বাচ্চার খরচ — সব আলাদা ক্যাটাগরিতে রাখতে পারি। বাংলায় হওয়ায় ব্যবহার করা খুবই সহজ।' },
      { name: 'তানভীর আহমেদ', role: 'ফ্রিল্যান্সার, সিলেট', text: 'বিকাশ, ব্যাংক, নগদ — সব ওয়ালেট এক অ্যাপে। মাসিক PDF রিপোর্ট দেখে এখন বাজেট প্ল্যান করতে পারি।' },
    ],
  },
  faq: {
    badge: 'সাধারণ প্রশ্ন',
    title: 'আপনার প্রশ্ন, আমাদের উত্তর',
    subtitle: 'যদি আরও কিছু জানতে চান, আমাদের সাথে যোগাযোগ করুন।',
    items: [
      { q: 'JomaKhoros কি ফ্রি?', a: 'হ্যাঁ, রেজিস্ট্রেশন সম্পূর্ণ বিনামূল্যে। প্রথম এক মাস সব Pro ফিচার ফ্রি ট্রায়াল হিসেবে পাবেন। এরপর আপনি ফ্রি প্ল্যানে চালিয়ে যেতে পারবেন বা মাত্র ১০ টাকা থেকে শুরু হওয়া Pro প্ল্যান নিতে পারবেন।' },
      { q: 'আমার ডেটা কি নিরাপদ?', a: 'অবশ্যই। আপনার সব ডেটা এনক্রিপ্টেড সার্ভারে সুরক্ষিত থাকে এবং শুধুমাত্র আপনি নিজেই অ্যাক্সেস করতে পারেন।' },
      { q: 'আমি কি একাধিক ওয়ালেট ব্যবহার করতে পারব?', a: 'হ্যাঁ। নগদ, ব্যাংক, বিকাশ, রকেট — যত ইচ্ছা ওয়ালেট তৈরি করতে পারবেন।' },
      { q: 'মোবাইলে কি ব্যবহার করা যাবে?', a: 'হ্যাঁ। JomaKhoros সম্পূর্ণ মোবাইল-ফ্রেন্ডলি।' },
      { q: 'পেমেন্ট কীভাবে করব?', a: 'বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি Send Money করে পেমেন্ট করতে পারবেন।' },
    ],
  },
  final_cta: {
    title: 'আজই শুরু করুন আপনার আর্থিক যাত্রা',
    subtitle: 'মাত্র ১ মিনিটে অ্যাকাউন্ট খুলুন। কোনো ক্রেডিট কার্ড লাগবে না।',
    cta_primary: 'ফ্রি রেজিস্ট্রেশন',
    cta_secondary: 'লগইন করুন',
  },
  footer: {
    tagline: 'Track. Save. Grow.',
    copyright: '© 2026 JomaKhoros • সর্বস্বত্ব সংরক্ষিত',
  },
};

// Helpers for list manipulation
function ListEditor<T>({
  label, items, onChange, render, blank,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  blank: T;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button variant="outline" size="sm" onClick={() => onChange([...items, { ...blank }])}>
          <Plus className="mr-1 h-3.5 w-3.5" /> যোগ করুন
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => {
                const arr = [...items]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; onChange(arr);
              }}>↑</Button>
              <Button variant="ghost" size="sm" disabled={i === items.length - 1} onClick={() => {
                const arr = [...items]; [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; onChange(arr);
              }}>↓</Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {render(item, (patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))))}
        </div>
      ))}
    </div>
  );
}

export function LandingPageEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<LandingContent>(DEFAULT_LANDING);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'landing_page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings').select('setting_value')
        .eq('setting_key', 'landing_page').maybeSingle();
      if (error) throw error;
      return (data?.setting_value as LandingContent) ?? DEFAULT_LANDING;
    },
  });

  useEffect(() => {
    if (data) {
      // Deep merge with defaults to handle missing fields
      setC({
        ...DEFAULT_LANDING,
        ...data,
        hero: { ...DEFAULT_LANDING.hero, ...(data.hero ?? {}) },
        stats: data.stats ?? DEFAULT_LANDING.stats,
        how: { ...DEFAULT_LANDING.how, ...(data.how ?? {}), steps: data.how?.steps ?? DEFAULT_LANDING.how.steps },
        features: { ...DEFAULT_LANDING.features, ...(data.features ?? {}), items: data.features?.items ?? DEFAULT_LANDING.features.items },
        why: { ...DEFAULT_LANDING.why, ...(data.why ?? {}), bullets: data.why?.bullets ?? DEFAULT_LANDING.why.bullets },
        testimonials: { ...DEFAULT_LANDING.testimonials, ...(data.testimonials ?? {}), items: data.testimonials?.items ?? DEFAULT_LANDING.testimonials.items },
        faq: { ...DEFAULT_LANDING.faq, ...(data.faq ?? {}), items: data.faq?.items ?? DEFAULT_LANDING.faq.items },
        final_cta: { ...DEFAULT_LANDING.final_cta, ...(data.final_cta ?? {}) },
        footer: { ...DEFAULT_LANDING.footer, ...(data.footer ?? {}) },
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async (value: LandingContent) => {
      const { error } = await supabase.from('app_settings')
        .upsert({ setting_key: 'landing_page', setting_value: value as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'landing_page'] });
      toast.success('হোম পেইজ আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">হোম পেইজ কন্টেন্ট</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="w-full">
          {/* HERO */}
          <AccordionItem value="hero">
            <AccordionTrigger>Hero সেকশন</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2"><Label>ব্যাজ টেক্সট</Label>
                <Input value={c.hero.badge} onChange={(e) => setC({ ...c, hero: { ...c.hero, badge: e.target.value } })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>টাইটেল (অংশ ১)</Label>
                  <Input value={c.hero.title_part1} onChange={(e) => setC({ ...c, hero: { ...c.hero, title_part1: e.target.value } })} /></div>
                <div className="space-y-2"><Label>টাইটেল (হাইলাইট)</Label>
                  <Input value={c.hero.title_highlight} onChange={(e) => setC({ ...c, hero: { ...c.hero, title_highlight: e.target.value } })} /></div>
              </div>
              <div className="space-y-2"><Label>সাব-টাইটেল</Label>
                <Textarea rows={3} value={c.hero.subtitle} onChange={(e) => setC({ ...c, hero: { ...c.hero, subtitle: e.target.value } })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>প্রাইমারি বাটন</Label>
                  <Input value={c.hero.cta_primary} onChange={(e) => setC({ ...c, hero: { ...c.hero, cta_primary: e.target.value } })} /></div>
                <div className="space-y-2"><Label>সেকেন্ডারি বাটন</Label>
                  <Input value={c.hero.cta_secondary} onChange={(e) => setC({ ...c, hero: { ...c.hero, cta_secondary: e.target.value } })} /></div>
              </div>
              <div className="space-y-2"><Label>রেটিং টেক্সট</Label>
                <Input value={c.hero.rating_text} onChange={(e) => setC({ ...c, hero: { ...c.hero, rating_text: e.target.value } })} /></div>
            </AccordionContent>
          </AccordionItem>

          {/* STATS */}
          <AccordionItem value="stats">
            <AccordionTrigger>পরিসংখ্যান (Stats)</AccordionTrigger>
            <AccordionContent className="pt-2">
              <ListEditor<LandingStat>
                label="স্ট্যাট লিস্ট" items={c.stats}
                onChange={(stats) => setC({ ...c, stats })}
                blank={{ value: '', label: '' }}
                render={(item, update) => (
                  <>
                    <Input placeholder="মান (যেমন: ১০,০০০+)" value={item.value} onChange={(e) => update({ value: e.target.value })} />
                    <Input placeholder="লেবেল" value={item.label} onChange={(e) => update({ label: e.target.value })} />
                  </>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* HOW */}
          <AccordionItem value="how">
            <AccordionTrigger>কীভাবে কাজ করে</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Input placeholder="ব্যাজ" value={c.how.badge} onChange={(e) => setC({ ...c, how: { ...c.how, badge: e.target.value } })} />
              <Input placeholder="শিরোনাম" value={c.how.title} onChange={(e) => setC({ ...c, how: { ...c.how, title: e.target.value } })} />
              <Textarea rows={2} placeholder="সাব-টাইটেল" value={c.how.subtitle} onChange={(e) => setC({ ...c, how: { ...c.how, subtitle: e.target.value } })} />
              <ListEditor<LandingStep>
                label="ধাপ লিস্ট" items={c.how.steps}
                onChange={(steps) => setC({ ...c, how: { ...c.how, steps } })}
                blank={{ title: '', desc: '' }}
                render={(item, update) => (
                  <>
                    <Input placeholder="ধাপের শিরোনাম" value={item.title} onChange={(e) => update({ title: e.target.value })} />
                    <Textarea rows={2} placeholder="বর্ণনা" value={item.desc} onChange={(e) => update({ desc: e.target.value })} />
                  </>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* FEATURES */}
          <AccordionItem value="features">
            <AccordionTrigger>ফিচার সেকশন</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Input placeholder="ব্যাজ" value={c.features.badge} onChange={(e) => setC({ ...c, features: { ...c.features, badge: e.target.value } })} />
              <Input placeholder="শিরোনাম" value={c.features.title} onChange={(e) => setC({ ...c, features: { ...c.features, title: e.target.value } })} />
              <Textarea rows={2} placeholder="সাব-টাইটেল" value={c.features.subtitle} onChange={(e) => setC({ ...c, features: { ...c.features, subtitle: e.target.value } })} />
              <ListEditor<LandingFeature>
                label="ফিচার লিস্ট (আইকন স্বয়ংক্রিয়)" items={c.features.items}
                onChange={(items) => setC({ ...c, features: { ...c.features, items } })}
                blank={{ title: '', desc: '' }}
                render={(item, update) => (
                  <>
                    <Input placeholder="ফিচারের নাম" value={item.title} onChange={(e) => update({ title: e.target.value })} />
                    <Textarea rows={2} placeholder="সংক্ষিপ্ত বর্ণনা" value={item.desc} onChange={(e) => update({ desc: e.target.value })} />
                  </>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* WHY */}
          <AccordionItem value="why">
            <AccordionTrigger>কেন আমরা (Why us)</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Input placeholder="শিরোনাম" value={c.why.title} onChange={(e) => setC({ ...c, why: { ...c.why, title: e.target.value } })} />
              <Textarea rows={2} placeholder="সাব-টাইটেল" value={c.why.subtitle} onChange={(e) => setC({ ...c, why: { ...c.why, subtitle: e.target.value } })} />
              <ListEditor<string>
                label="বুলেট পয়েন্ট" items={c.why.bullets}
                onChange={(bullets) => setC({ ...c, why: { ...c.why, bullets } })}
                blank=""
                render={(item, update) => {
                  // string items need special handling — replace via index
                  const idx = c.why.bullets.indexOf(item);
                  return (
                    <Input placeholder="পয়েন্ট" value={item} onChange={(e) => {
                      const arr = [...c.why.bullets]; arr[idx] = e.target.value;
                      setC({ ...c, why: { ...c.why, bullets: arr } });
                    }} />
                  );
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* TESTIMONIALS */}
          <AccordionItem value="testimonials">
            <AccordionTrigger>ব্যবহারকারীদের কথা</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Input placeholder="ব্যাজ" value={c.testimonials.badge} onChange={(e) => setC({ ...c, testimonials: { ...c.testimonials, badge: e.target.value } })} />
              <Input placeholder="শিরোনাম" value={c.testimonials.title} onChange={(e) => setC({ ...c, testimonials: { ...c.testimonials, title: e.target.value } })} />
              <Textarea rows={2} placeholder="সাব-টাইটেল" value={c.testimonials.subtitle} onChange={(e) => setC({ ...c, testimonials: { ...c.testimonials, subtitle: e.target.value } })} />
              <ListEditor<LandingTestimonial>
                label="রিভিউ লিস্ট" items={c.testimonials.items}
                onChange={(items) => setC({ ...c, testimonials: { ...c.testimonials, items } })}
                blank={{ name: '', role: '', text: '' }}
                render={(item, update) => (
                  <>
                    <Input placeholder="নাম" value={item.name} onChange={(e) => update({ name: e.target.value })} />
                    <Input placeholder="পরিচয় (যেমন: শিক্ষার্থী, ঢাকা)" value={item.role} onChange={(e) => update({ role: e.target.value })} />
                    <Textarea rows={3} placeholder="রিভিউ টেক্সট" value={item.text} onChange={(e) => update({ text: e.target.value })} />
                  </>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* FAQ */}
          <AccordionItem value="faq">
            <AccordionTrigger>FAQ</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Input placeholder="ব্যাজ" value={c.faq.badge} onChange={(e) => setC({ ...c, faq: { ...c.faq, badge: e.target.value } })} />
              <Input placeholder="শিরোনাম" value={c.faq.title} onChange={(e) => setC({ ...c, faq: { ...c.faq, title: e.target.value } })} />
              <Textarea rows={2} placeholder="সাব-টাইটেল" value={c.faq.subtitle} onChange={(e) => setC({ ...c, faq: { ...c.faq, subtitle: e.target.value } })} />
              <ListEditor<LandingFaq>
                label="প্রশ্ন-উত্তর" items={c.faq.items}
                onChange={(items) => setC({ ...c, faq: { ...c.faq, items } })}
                blank={{ q: '', a: '' }}
                render={(item, update) => (
                  <>
                    <Input placeholder="প্রশ্ন" value={item.q} onChange={(e) => update({ q: e.target.value })} />
                    <Textarea rows={3} placeholder="উত্তর" value={item.a} onChange={(e) => update({ a: e.target.value })} />
                  </>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* FINAL CTA */}
          <AccordionItem value="cta">
            <AccordionTrigger>Final CTA সেকশন</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Input placeholder="শিরোনাম" value={c.final_cta.title} onChange={(e) => setC({ ...c, final_cta: { ...c.final_cta, title: e.target.value } })} />
              <Textarea rows={2} placeholder="সাব-টাইটেল" value={c.final_cta.subtitle} onChange={(e) => setC({ ...c, final_cta: { ...c.final_cta, subtitle: e.target.value } })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="প্রাইমারি বাটন" value={c.final_cta.cta_primary} onChange={(e) => setC({ ...c, final_cta: { ...c.final_cta, cta_primary: e.target.value } })} />
                <Input placeholder="সেকেন্ডারি বাটন" value={c.final_cta.cta_secondary} onChange={(e) => setC({ ...c, final_cta: { ...c.final_cta, cta_secondary: e.target.value } })} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FOOTER */}
          <AccordionItem value="footer">
            <AccordionTrigger>ফুটার</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Input placeholder="ট্যাগলাইন" value={c.footer.tagline} onChange={(e) => setC({ ...c, footer: { ...c.footer, tagline: e.target.value } })} />
              <Input placeholder="কপিরাইট" value={c.footer.copyright} onChange={(e) => setC({ ...c, footer: { ...c.footer, copyright: e.target.value } })} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
