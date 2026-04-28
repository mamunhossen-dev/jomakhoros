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

export type SubPlan = { id: string; label: string; price: number; duration_months: number };
export type SubPaymentMethod = { value: string; label: string };
export type SubscriptionContent = {
  page_title: string;
  page_subtitle: string;
  plans: SubPlan[];
  payment_methods: SubPaymentMethod[];
  mobile_number: string;
  mobile_warning: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  show_mobile_section: boolean;
  show_bank_section: boolean;
};

export const DEFAULT_SUBSCRIPTION: SubscriptionContent = {
  page_title: 'সাবস্ক্রিপশন',
  page_subtitle: 'আপনার প্ল্যান এবং পেমেন্ট পরিচালনা করুন।',
  plans: [
    { id: '1month', label: '১ মাস', price: 10, duration_months: 1 },
    { id: '6months', label: '৬ মাস', price: 50, duration_months: 6 },
    { id: '1year', label: '১ বছর', price: 100, duration_months: 12 },
  ],
  payment_methods: [
    { value: 'bkash', label: 'বিকাশ' },
    { value: 'nagad', label: 'নগদ' },
    { value: 'rocket', label: 'রকেট' },
    { value: 'bank', label: 'ব্যাংক ট্রান্সফার (DBBL)' },
  ],
  mobile_number: '01770025816',
  mobile_warning:
    'এটি একটি ব্যক্তিগত নম্বর, মার্চেন্ট অ্যাকাউন্ট নয়। শুধুমাত্র সেন্ড মানি করুন। পেমেন্ট প্রসেসর হিসেবে ব্যবহার করবেন না।',
  bank_name: 'Dutch Bangla Bank Limited',
  bank_account_name: 'Md Mamun Hossen',
  bank_account_number: '1151580002115',
  bank_branch: 'Mirpur',
  show_mobile_section: true,
  show_bank_section: true,
};

export function SubscriptionEditor() {
  const qc = useQueryClient();
  const [c, setC] = useState<SubscriptionContent>(DEFAULT_SUBSCRIPTION);

  const { data, isLoading } = useQuery({
    queryKey: ['app_setting', 'subscription_page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'subscription_page')
        .maybeSingle();
      if (error) throw error;
      return (data?.setting_value as SubscriptionContent) ?? DEFAULT_SUBSCRIPTION;
    },
  });

  useEffect(() => {
    if (data)
      setC({
        ...DEFAULT_SUBSCRIPTION,
        ...data,
        plans: data.plans ?? DEFAULT_SUBSCRIPTION.plans,
        payment_methods: data.payment_methods ?? DEFAULT_SUBSCRIPTION.payment_methods,
      });
  }, [data]);

  const save = useMutation({
    mutationFn: async (value: SubscriptionContent) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { setting_key: 'subscription_page', setting_value: value as any },
          { onConflict: 'setting_key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'subscription_page'] });
      toast.success('সাবস্ক্রিপশন পেইজ আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePlan = (i: number, p: Partial<SubPlan>) =>
    setC({ ...c, plans: c.plans.map((x, idx) => (idx === i ? { ...x, ...p } : x)) });
  const addPlan = () =>
    setC({ ...c, plans: [...c.plans, { id: `plan_${Date.now()}`, label: '', price: 0, duration_months: 1 }] });
  const removePlan = (i: number) => setC({ ...c, plans: c.plans.filter((_, idx) => idx !== i) });

  const updatePM = (i: number, p: Partial<SubPaymentMethod>) =>
    setC({ ...c, payment_methods: c.payment_methods.map((x, idx) => (idx === i ? { ...x, ...p } : x)) });
  const addPM = () => setC({ ...c, payment_methods: [...c.payment_methods, { value: '', label: '' }] });
  const removePM = (i: number) =>
    setC({ ...c, payment_methods: c.payment_methods.filter((_, idx) => idx !== i) });

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">সাবস্ক্রিপশন পেইজ কন্টেন্ট</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>পেইজ শিরোনাম</Label>
            <Input value={c.page_title} onChange={(e) => setC({ ...c, page_title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>পেইজ সাব-টাইটেল</Label>
            <Input value={c.page_subtitle} onChange={(e) => setC({ ...c, page_subtitle: e.target.value })} />
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>প্ল্যান লিস্ট</Label>
            <Button variant="outline" size="sm" onClick={addPlan}>
              <Plus className="mr-1 h-3.5 w-3.5" /> প্ল্যান যোগ
            </Button>
          </div>
          {c.plans.map((p, i) => (
            <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_120px_120px_auto]">
              <Input placeholder="ID (e.g. 1month)" value={p.id} onChange={(e) => updatePlan(i, { id: e.target.value })} />
              <Input placeholder="লেবেল" value={p.label} onChange={(e) => updatePlan(i, { label: e.target.value })} />
              <Input type="number" placeholder="মূল্য (৳)" value={p.price} onChange={(e) => updatePlan(i, { price: Number(e.target.value) })} />
              <Input type="number" placeholder="মাস" value={p.duration_months} onChange={(e) => updatePlan(i, { duration_months: Number(e.target.value) })} />
              <Button variant="ghost" size="sm" onClick={() => removePlan(i)} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>পেমেন্ট মেথড</Label>
            <Button variant="outline" size="sm" onClick={addPM}>
              <Plus className="mr-1 h-3.5 w-3.5" /> মেথড যোগ
            </Button>
          </div>
          {c.payment_methods.map((m, i) => (
            <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder="value (e.g. bkash)" value={m.value} onChange={(e) => updatePM(i, { value: e.target.value })} />
              <Input placeholder="লেবেল" value={m.label} onChange={(e) => updatePM(i, { label: e.target.value })} />
              <Button variant="ghost" size="sm" onClick={() => removePM(i)} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Mobile section */}
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label>মোবাইল পেমেন্ট সেকশন</Label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={c.show_mobile_section} onChange={(e) => setC({ ...c, show_mobile_section: e.target.checked })} />
              দেখান
            </label>
          </div>
          <Input placeholder="মোবাইল নম্বর" value={c.mobile_number} onChange={(e) => setC({ ...c, mobile_number: e.target.value })} />
          <Textarea rows={2} placeholder="সতর্কবার্তা" value={c.mobile_warning} onChange={(e) => setC({ ...c, mobile_warning: e.target.value })} />
        </div>

        {/* Bank section */}
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label>ব্যাংক একাউন্ট সেকশন</Label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={c.show_bank_section} onChange={(e) => setC({ ...c, show_bank_section: e.target.checked })} />
              দেখান
            </label>
          </div>
          <Input placeholder="ব্যাংকের নাম" value={c.bank_name} onChange={(e) => setC({ ...c, bank_name: e.target.value })} />
          <Input placeholder="একাউন্ট হোল্ডারের নাম" value={c.bank_account_name} onChange={(e) => setC({ ...c, bank_account_name: e.target.value })} />
          <Input placeholder="একাউন্ট নম্বর" value={c.bank_account_number} onChange={(e) => setC({ ...c, bank_account_number: e.target.value })} />
          <Input placeholder="শাখা" value={c.bank_branch} onChange={(e) => setC({ ...c, bank_branch: e.target.value })} />
        </div>

        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
