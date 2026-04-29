import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserPlus, ShieldCheck, Mail, BellRing, Lock, Info } from 'lucide-react';

export type SignupRules = {
  signup_enabled: boolean;
  default_account_type: 'trial' | 'free' | 'pro';
  trial_days: number;
  pro_days: number;
  default_role: 'user' | 'moderator' | 'admin';
  require_email_verification: boolean;
  send_welcome_notification: boolean;
};

export const DEFAULT_RULES: SignupRules = {
  signup_enabled: true,
  default_account_type: 'trial',
  trial_days: 30,
  pro_days: 30,
  default_role: 'user',
  require_email_verification: true,
  send_welcome_notification: true,
};

export function SignupRulesEditor() {
  const qc = useQueryClient();
  const [r, setR] = useState<SignupRules>(DEFAULT_RULES);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'signup_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'signup_rules')
        .maybeSingle();
      if (error) throw error;
      return (data?.setting_value as SignupRules) ?? DEFAULT_RULES;
    },
  });

  useEffect(() => {
    if (data) setR({ ...DEFAULT_RULES, ...data });
  }, [data]);

  const save = useMutation({
    mutationFn: async (v: SignupRules) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { setting_key: 'signup_rules', setting_value: v as any },
          { onConflict: 'setting_key' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'signup_rules'] });
      toast.success('রেজিস্ট্রেশন নিয়ম আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message ?? 'সংরক্ষণ ব্যর্থ হয়েছে'),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;
  }

  const num = (val: string, fallback: number) => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>
          এখানে সেট করা নিয়ম <strong>নতুন ইউজার রেজিস্ট্রেশনের সময়</strong> স্বয়ংক্রিয়ভাবে প্রয়োগ হবে।
          বিদ্যমান ইউজারদের তথ্য পরিবর্তন করতে নিচের <strong>"ব্যবহারকারী"</strong> ট্যাব ব্যবহার করুন।
        </span>
      </div>

      {/* Registration toggle */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" /> রেজিস্ট্রেশন কন্ট্রোল
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label className="text-base font-medium">নতুন রেজিস্ট্রেশন চালু</Label>
              <p className="text-sm text-muted-foreground">
                বন্ধ থাকলে কেউ নতুন অ্যাকাউন্ট খুলতে পারবে না।
              </p>
            </div>
            <Switch
              checked={r.signup_enabled}
              onCheckedChange={(v) => setR({ ...r, signup_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Default account type & duration */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" /> ডিফল্ট অ্যাকাউন্ট
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">অ্যাকাউন্ট টাইপ</Label>
              <Select
                value={r.default_account_type}
                onValueChange={(v: any) => setR({ ...r, default_account_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (ট্রায়াল)</SelectItem>
                  <SelectItem value="free">Free (ফ্রি)</SelectItem>
                  <SelectItem value="pro">Pro (প্রো)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">ডিফল্ট রোল</Label>
              <Select
                value={r.default_role}
                onValueChange={(v: any) => setR({ ...r, default_role: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (সাধারণ)</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Trial মেয়াদ (দিন)
              </Label>
              <Input
                type="number"
                min={1}
                value={r.trial_days}
                onChange={(e) => setR({ ...r, trial_days: num(e.target.value, 30) })}
                disabled={r.default_account_type !== 'trial'}
              />
              <p className="text-[11px] text-muted-foreground">
                শুধু Trial টাইপে প্রযোজ্য।
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Pro মেয়াদ (দিন)
              </Label>
              <Input
                type="number"
                min={1}
                value={r.pro_days}
                onChange={(e) => setR({ ...r, pro_days: num(e.target.value, 30) })}
                disabled={r.default_account_type !== 'pro'}
              />
              <p className="text-[11px] text-muted-foreground">
                শুধু Pro টাইপে প্রযোজ্য (প্রমোশনাল)।
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & welcome */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> নিরাপত্তা ও স্বাগতম
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="flex gap-3">
              <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <Label className="font-medium">ইমেইল ভেরিফিকেশন বাধ্যতামূলক</Label>
                <p className="text-sm text-muted-foreground">
                  চালু থাকলে ইমেইল ভেরিফাই না করে লগইন করা যাবে না।
                </p>
              </div>
            </div>
            <Switch
              checked={r.require_email_verification}
              onCheckedChange={(v) => setR({ ...r, require_email_verification: v })}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="flex gap-3">
              <BellRing className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <Label className="font-medium">ওয়েলকাম নোটিফিকেশন পাঠাও</Label>
                <p className="text-sm text-muted-foreground">
                  নতুন ইউজার সাইনআপ করলে স্বাগত নোটিফিকেশন দেখানো হবে।
                </p>
              </div>
            </div>
            <Switch
              checked={r.send_welcome_notification}
              onCheckedChange={(v) => setR({ ...r, send_welcome_notification: v })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => save.mutate(r)}
          disabled={save.isPending}
          className="flex-1"
        >
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setR(DEFAULT_RULES)}
          disabled={save.isPending}
        >
          ডিফল্টে ফিরে যান
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        টিপ: কোনো নির্দিষ্ট ইউজারের রোল, অ্যাকাউন্ট টাইপ বা মেয়াদ পরিবর্তন করতে চাইলে
        উপরের <strong>"ব্যবহারকারী"</strong> ট্যাবে গিয়ে সেই ইউজারের পাশের অপশনগুলো ব্যবহার করুন।
      </p>
    </div>
  );
}
