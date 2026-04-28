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

export type AboutFeature = { title: string; description: string };
export type AboutContent = {
  title: string;
  subtitle: string;
  intro_md: string;
  features_heading: string;
  features: AboutFeature[];
};

export const DEFAULT_ABOUT: AboutContent = {
  title: 'JomaKhoros সম্পর্কে',
  subtitle: 'আপনার ব্যক্তিগত আর্থিক সঙ্গী',
  intro_md:
    'JomaKhoros একটি সহজ ও শক্তিশালী আর্থিক ব্যবস্থাপনা অ্যাপ, যা বাংলাদেশী ব্যবহারকারীদের জন্য বিশেষভাবে তৈরি। আয়, ব্যয়, ওয়ালেট, বাজেট ও দেনা-পাওনা — সবকিছু এক জায়গায় ট্র্যাক করুন।',
  features_heading: 'মূল ফিচার',
  features: [
    { title: 'লেনদেন ট্র্যাকিং', description: 'আয় ও ব্যয়ের সম্পূর্ণ হিসাব রাখুন।' },
    { title: 'ওয়ালেট ব্যবস্থাপনা', description: 'একাধিক ওয়ালেটের ব্যালেন্স পরিচালনা করুন।' },
    { title: 'বাজেট ও বিশ্লেষণ', description: 'ক্যাটাগরি অনুযায়ী বাজেট ও খরচ বিশ্লেষণ।' },
  ],
};

export function AboutPageEditor() {
  const qc = useQueryClient();
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT);
  const [preview, setPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'about_page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'about_page')
        .maybeSingle();
      if (error) throw error;
      return (data?.setting_value as AboutContent) ?? DEFAULT_ABOUT;
    },
  });

  useEffect(() => {
    if (data) setContent({ ...DEFAULT_ABOUT, ...data, features: data.features ?? DEFAULT_ABOUT.features });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async (value: AboutContent) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { setting_key: 'about_page', setting_value: value as any },
          { onConflict: 'setting_key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'about_page'] });
      toast.success('About পেইজ আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateFeature = (i: number, patch: Partial<AboutFeature>) => {
    setContent((c) => ({
      ...c,
      features: c.features.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    }));
  };

  const addFeature = () =>
    setContent((c) => ({ ...c, features: [...c.features, { title: '', description: '' }] }));

  const removeFeature = (i: number) =>
    setContent((c) => ({ ...c, features: c.features.filter((_, idx) => idx !== i) }));

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">About পেইজ কন্টেন্ট</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
          <Eye className="mr-1 h-3.5 w-3.5" />
          {preview ? 'এডিট' : 'প্রিভিউ'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {preview ? (
          <div className="rounded-lg border p-4">
            <h2 className="font-display text-2xl font-bold">{content.title}</h2>
            <p className="text-muted-foreground mt-1">{content.subtitle}</p>
            <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.intro_md}</ReactMarkdown>
            </div>
            <h3 className="font-display mt-6 text-lg font-semibold">{content.features_heading}</h3>
            <ul className="mt-2 space-y-2">
              {content.features.map((f, i) => (
                <li key={i} className="rounded-md border p-3">
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>শিরোনাম</Label>
              <Input
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>সাব-টাইটেল</Label>
              <Input
                value={content.subtitle}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>পরিচিতি (Markdown সাপোর্টেড — **bold**, *italic*, লিস্ট, লিঙ্ক)</Label>
              <Textarea
                rows={6}
                value={content.intro_md}
                onChange={(e) => setContent({ ...content, intro_md: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ফিচার সেকশনের শিরোনাম</Label>
              <Input
                value={content.features_heading}
                onChange={(e) => setContent({ ...content, features_heading: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>ফিচার লিস্ট</Label>
                <Button variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> ফিচার যোগ করুন
                </Button>
              </div>
              {content.features.map((f, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">ফিচার #{i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(i)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input
                    placeholder="ফিচারের নাম"
                    value={f.title}
                    onChange={(e) => updateFeature(i, { title: e.target.value })}
                  />
                  <Textarea
                    rows={2}
                    placeholder="সংক্ষিপ্ত বর্ণনা"
                    value={f.description}
                    onChange={(e) => updateFeature(i, { description: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <Button
          onClick={() => saveMut.mutate(content)}
          disabled={saveMut.isPending}
          className="w-full"
        >
          {saveMut.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
