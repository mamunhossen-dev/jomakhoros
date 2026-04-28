import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PLANS = [
  { id: '1month', label: '১ মাস', price: 10, duration: '1 month' },
  { id: '6months', label: '৬ মাস', price: 50, duration: '6 months' },
  { id: '1year', label: '১ বছর', price: 100, duration: '1 year' },
];

export default function Subscription() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: paymentHistory } = useQuery({
    queryKey: ['payment_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('অনুগ্রহ করে একটি প্ল্যান নির্বাচন করুন।');
      return;
    }
    if (!paymentMethod) {
      toast.error('অনুগ্রহ করে পেমেন্ট পদ্ধতি নির্বাচন করুন।');
      return;
    }
    if (!transactionId.trim()) {
      toast.error('অনুগ্রহ করে ট্রানজেকশন আইডি লিখুন।');
      return;
    }
    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;
    setLoading(true);
    const { error } = await supabase.from('payment_requests').insert({
      user_id: user!.id,
      plan: plan.label,
      amount: plan.price,
      payment_method: paymentMethod,
      transaction_id: transactionId.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে। অ্যাডমিন যাচাই করবেন।');
      setTransactionId('');
    }
  };

  const { accountType } = useSubscription();
  const isActive = accountType === 'pro' || accountType === 'trial';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">সাবস্ক্রিপশন</h1>
        <p className="text-muted-foreground">আপনার প্ল্যান এবং পেমেন্ট পরিচালনা করুন।</p>
      </div>

      {/* Current status */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            {isActive ? <CheckCircle2 className="h-6 w-6 text-success" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
            <div>
              <p className="font-medium">
                বর্তমান স্ট্যাটাস:{' '}
                <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-success' : ''}>
                  {accountType === 'trial' ? 'ট্রায়াল' : accountType === 'pro' ? 'প্রো' : 'ফ্রি'}
                </Badge>
              </p>
              {accountType === 'trial' && profile?.trial_end_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  ট্রায়াল শেষ: {format(new Date(profile.trial_end_date), 'dd MMM, yyyy')}
                </p>
              )}
              {accountType === 'pro' && profile?.subscription_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  সাবস্ক্রিপশন শেষ: {new Date(profile.subscription_end).getFullYear() >= 2099 ? 'লাইফটাইম ♾' : format(new Date(profile.subscription_end), 'dd MMM, yyyy')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">প্ল্যান নির্বাচন করুন</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map(plan => (
            <Card
              key={plan.id}
              className={`border cursor-pointer transition-colors ${selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border/50'} shadow-sm`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardContent className="pt-5 text-center">
                <p className="text-sm font-medium">{plan.label}</p>
                <p className="text-2xl font-bold font-display text-primary mt-1">৳{plan.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment form */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> পেমেন্ট জমা দিন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-4">
            <p className="text-sm font-medium text-destructive">⚠️ মোবাইল পেমেন্ট নম্বর: 01770025816</p>
            <p className="text-xs text-destructive/80 mt-1">
              এটি একটি ব্যক্তিগত নম্বর, মার্চেন্ট অ্যাকাউন্ট নয়। শুধুমাত্র <strong>সেন্ড মানি</strong> করুন। পেমেন্ট প্রসেসর হিসেবে ব্যবহার করবেন না।
            </p>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-4">
            <p className="text-sm font-medium text-primary">🏦 ব্যাংক একাউন্টের তথ্য</p>
            <div className="text-xs text-foreground/80 mt-1.5 space-y-0.5">
              <p><strong>ব্যাংক:</strong> Dutch Bangla Bank Limited</p>
              <p><strong>একাউন্ট নম্বর:</strong> 1151580002115</p>
              <p><strong>শাখা:</strong> Mirpur</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>পেমেন্ট পদ্ধতি</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="পদ্ধতি নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">বিকাশ</SelectItem>
                  <SelectItem value="nagad">নগদ</SelectItem>
                  <SelectItem value="rocket">রকেট</SelectItem>
                  <SelectItem value="bank">ব্যাংক ট্রান্সফার (DBBL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{paymentMethod === 'bank' ? 'ট্রানজেকশন / রেফারেন্স আইডি' : 'ট্রানজেকশন আইডি'}</Label>
              <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder={paymentMethod === 'bank' ? 'যেমন: REF123456789' : 'যেমন: TXN123456789'} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'পাঠানো হচ্ছে...' : 'পেমেন্ট জমা দিন'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment history */}
      {paymentHistory?.length ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">পেমেন্ট ইতিহাস</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{p.plan} — ৳{Number(p.amount).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">{p.payment_method === 'bkash' ? 'বিকাশ' : p.payment_method === 'nagad' ? 'নগদ' : p.payment_method === 'rocket' ? 'রকেট' : p.payment_method === 'bank' ? 'ব্যাংক (DBBL)' : p.payment_method} • {p.transaction_id}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), 'dd MMM, yyyy')}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      p.status === 'approved' ? 'border-success/30 bg-success/10 text-success'
                      : p.status === 'rejected' ? 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600'
                    }
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {p.status === 'approved' ? 'অনুমোদিত' : p.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমান'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
