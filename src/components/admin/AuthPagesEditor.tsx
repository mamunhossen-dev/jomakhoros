import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export type AuthPagesContent = {
  // Login sidebar
  login_side_title: string;
  login_side_subtitle: string;
  // Login main
  login_heading: string;
  login_subheading: string;
  login_email_label: string;
  login_password_label: string;
  login_submit_label: string;
  login_submit_loading: string;
  login_google_label: string;
  login_no_account: string;
  login_register_link: string;
  // Register sidebar
  register_side_title: string;
  register_side_subtitle: string;
  // Register main
  register_heading: string;
  register_subheading: string;
  register_email_label: string;
  register_password_label: string;
  register_confirm_label: string;
  register_terms_text: string;
  register_terms_link_label: string;
  register_submit_label: string;
  register_submit_loading: string;
  register_google_label: string;
  register_have_account: string;
  register_login_link: string;
  // Shared
  divider_text: string;
  home_back_label: string;
  copyright_text: string;
};

export const DEFAULT_AUTH: AuthPagesContent = {
  login_side_title: 'আপনার আর্থিক\nনিয়ন্ত্রণ নিন',
  login_side_subtitle: 'আয়-ব্যয় ট্র্যাক করুন, বাজেট সেট করুন, সঞ্চয় বাড়ান — সব এক জায়গায়।',
  login_heading: 'স্বাগতম',
  login_subheading: 'আপনার অ্যাকাউন্টে সাইন ইন করুন',
  login_email_label: 'ইমেইল',
  login_password_label: 'পাসওয়ার্ড',
  login_submit_label: 'সাইন ইন',
  login_submit_loading: 'সাইন ইন হচ্ছে...',
  login_google_label: 'Google দিয়ে সাইন ইন',
  login_no_account: 'অ্যাকাউন্ট নেই?',
  login_register_link: 'রেজিস্টার করুন',

  register_side_title: 'আপনার আর্থিক\nযাত্রা শুরু করুন',
  register_side_subtitle: 'হাজারো মানুষ ইতোমধ্যে {brand} দিয়ে স্মার্টভাবে অর্থ পরিচালনা করছে।',
  register_heading: 'অ্যাকাউন্ট তৈরি করুন',
  register_subheading: 'বিনামূল্যে শুরু করুন — হিসাব রাখুন নিশ্চিন্তে!',
  register_email_label: 'ইমেইল',
  register_password_label: 'পাসওয়ার্ড',
  register_confirm_label: 'পাসওয়ার্ড নিশ্চিত করুন',
  register_terms_text: 'আমি {link} পড়েছি এবং সম্মত আছি',
  register_terms_link_label: 'শর্তাবলী',
  register_submit_label: 'রেজিস্টার করুন',
  register_submit_loading: 'অ্যাকাউন্ট তৈরি হচ্ছে...',
  register_google_label: 'Google দিয়ে রেজিস্টার',
  register_have_account: 'ইতোমধ্যে অ্যাকাউন্ট আছে?',
  register_login_link: 'সাইন ইন করুন',

  divider_text: 'অথবা',
  home_back_label: '← হোম',
  copyright_text: '© 2026 {brand}',
};

export function AuthPagesEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<AuthPagesContent>(DEFAULT_AUTH);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'auth_pages_content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings').select('setting_value')
        .eq('setting_key', 'auth_pages_content').maybeSingle();
      if (error) throw error;
      return (data?.setting_value as AuthPagesContent) ?? DEFAULT_AUTH;
    },
  });

  useEffect(() => {
    if (data) setC({ ...DEFAULT_AUTH, ...data });
  }, [data]);

  const save = useMutation({
    mutationFn: async (v: AuthPagesContent) => {
      const { error } = await supabase.from('app_settings')
        .upsert({ setting_key: 'auth_pages_content', setting_value: v as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'auth_pages_content'] });
      toast.success('Login/Register আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: keyof AuthPagesContent) => (e: any) => setC({ ...c, [k]: e.target.value });

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Login + Register পেইজ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">
          টিপ: <code>{'{brand}'}</code> ব্যবহার করলে স্বয়ংক্রিয়ভাবে ব্র্যান্ড নাম বসবে।
          শর্তাবলী টেক্সটে <code>{'{link}'}</code> ব্যবহার করলে সেখানে শর্তাবলী লিংক বসবে।
          সাইডবার টাইটেলে <code>\n</code> দিলে নতুন লাইন হবে।
        </p>

        {/* Login */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">Login পেইজ</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">সাইডবার টাইটেল</Label>
            <Textarea rows={2} value={c.login_side_title} onChange={set('login_side_title')} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">সাইডবার সাব-টেক্সট</Label>
            <Textarea rows={2} value={c.login_side_subtitle} onChange={set('login_side_subtitle')} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="হেডিং" value={c.login_heading} onChange={set('login_heading')} />
            <Input placeholder="সাব-হেডিং" value={c.login_subheading} onChange={set('login_subheading')} />
            <Input placeholder="ইমেইল লেবেল" value={c.login_email_label} onChange={set('login_email_label')} />
            <Input placeholder="পাসওয়ার্ড লেবেল" value={c.login_password_label} onChange={set('login_password_label')} />
            <Input placeholder="সাবমিট বাটন" value={c.login_submit_label} onChange={set('login_submit_label')} />
            <Input placeholder="সাবমিট লোডিং টেক্সট" value={c.login_submit_loading} onChange={set('login_submit_loading')} />
            <Input placeholder="Google বাটন" value={c.login_google_label} onChange={set('login_google_label')} />
            <Input placeholder='"অ্যাকাউন্ট নেই?" টেক্সট' value={c.login_no_account} onChange={set('login_no_account')} />
            <Input placeholder="রেজিস্টার লিংক টেক্সট" value={c.login_register_link} onChange={set('login_register_link')} />
          </div>
        </div>

        {/* Register */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">Register পেইজ</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">সাইডবার টাইটেল</Label>
            <Textarea rows={2} value={c.register_side_title} onChange={set('register_side_title')} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">সাইডবার সাব-টেক্সট</Label>
            <Textarea rows={2} value={c.register_side_subtitle} onChange={set('register_side_subtitle')} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="হেডিং" value={c.register_heading} onChange={set('register_heading')} />
            <Input placeholder="সাব-হেডিং" value={c.register_subheading} onChange={set('register_subheading')} />
            <Input placeholder="ইমেইল লেবেল" value={c.register_email_label} onChange={set('register_email_label')} />
            <Input placeholder="পাসওয়ার্ড লেবেল" value={c.register_password_label} onChange={set('register_password_label')} />
            <Input placeholder="কনফার্ম পাসওয়ার্ড লেবেল" value={c.register_confirm_label} onChange={set('register_confirm_label')} />
            <Input placeholder="সাবমিট বাটন" value={c.register_submit_label} onChange={set('register_submit_label')} />
            <Input placeholder="সাবমিট লোডিং" value={c.register_submit_loading} onChange={set('register_submit_loading')} />
            <Input placeholder="Google বাটন" value={c.register_google_label} onChange={set('register_google_label')} />
            <Input placeholder='"অ্যাকাউন্ট আছে?" টেক্সট' value={c.register_have_account} onChange={set('register_have_account')} />
            <Input placeholder="লগইন লিংক টেক্সট" value={c.register_login_link} onChange={set('register_login_link')} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">শর্তাবলী টেক্সট ({'{link}'} = লিংক)</Label>
            <Input value={c.register_terms_text} onChange={set('register_terms_text')} />
          </div>
          <Input placeholder="শর্তাবলী লিংক লেবেল" value={c.register_terms_link_label} onChange={set('register_terms_link_label')} />
        </div>

        {/* Shared */}
        <div className="space-y-3 rounded-lg border p-3">
          <Label className="text-sm font-semibold">শেয়ারড টেক্সট</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder='"অথবা" ডিভাইডার' value={c.divider_text} onChange={set('divider_text')} />
            <Input placeholder="হোম ব্যাক লেবেল" value={c.home_back_label} onChange={set('home_back_label')} />
            <Input placeholder="কপিরাইট ({brand})" value={c.copyright_text} onChange={set('copyright_text')} />
          </div>
        </div>

        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
