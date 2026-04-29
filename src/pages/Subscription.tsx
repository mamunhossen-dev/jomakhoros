import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CreditCard, CheckCircle2, Clock, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_SUBSCRIPTION, type SubscriptionContent } from '@/components/admin/SubscriptionEditor';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { downloadReceiptPdf, buildReceiptNumber } from '@/lib/exportReceiptPdf';
import { useBrand } from '@/hooks/useBrand';

export default function Subscription() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const brand = useBrand();
  const { data: settings } = useAppSetting<SubscriptionContent>('subscription_page', DEFAULT_SUBSCRIPTION);
  const content: SubscriptionContent = {
    ...DEFAULT_SUBSCRIPTION,
    ...(settings ?? {}),
    plans: settings?.plans ?? DEFAULT_SUBSCRIPTION.plans,
    payment_methods: settings?.payment_methods ?? DEFAULT_SUBSCRIPTION.payment_methods,
  };

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
    if (!selectedPlan) return toast.error('অনুগ্রহ করে একটি প্ল্যান নির্বাচন করুন।');
    if (!paymentMethod) return toast.error('অনুগ্রহ করে পেমেন্ট পদ্ধতি নির্বাচন করুন।');
    if (!transactionId.trim()) return toast.error('অনুগ্রহ করে ট্রানজেকশন আইডি লিখুন।');
    const plan = content.plans.find(p => p.id === selectedPlan);
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
  const pmLabel = (val: string) => content.payment_methods.find(m => m.value === val)?.label ?? val;
  const isBank = paymentMethod === 'bank';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{content.page_title}</h1>
        <p className="text-muted-foreground">{content.page_subtitle}</p>
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
      {content.plans.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">প্ল্যান নির্বাচন করুন</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {content.plans.map(plan => (
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
      )}

      {/* Payment form */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> পেমেন্ট জমা দিন
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content.show_mobile_section && content.mobile_number && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-4">
              <p className="text-sm font-medium text-destructive">⚠️ মোবাইল পেমেন্ট নম্বর: {content.mobile_number}</p>
              {content.mobile_warning && (
                <p className="text-xs text-destructive/80 mt-1">{content.mobile_warning}</p>
              )}
            </div>
          )}

          {content.show_bank_section && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-4">
              <p className="text-sm font-medium text-primary">🏦 ব্যাংক একাউন্টের তথ্য</p>
              <div className="text-xs text-foreground/80 mt-1.5 space-y-0.5">
                {content.bank_name && <p><strong>ব্যাংক:</strong> {content.bank_name}</p>}
                {content.bank_account_name && <p><strong>নাম:</strong> {content.bank_account_name}</p>}
                {content.bank_account_number && <p><strong>একাউন্ট নম্বর:</strong> {content.bank_account_number}</p>}
                {content.bank_branch && <p><strong>শাখা:</strong> {content.bank_branch}</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>পেমেন্ট পদ্ধতি</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="পদ্ধতি নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {content.payment_methods.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isBank ? 'ট্রানজেকশন / রেফারেন্স আইডি' : 'ট্রানজেকশন আইডি'}</Label>
              <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder={isBank ? 'যেমন: REF123456789' : 'যেমন: TXN123456789'} required />
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
              {paymentHistory.map(p => {
                const isApproved = p.status === 'approved';
                const handleDownload = async () => {
                  try {
                    await downloadReceiptPdf({
                      receiptNumber: buildReceiptNumber(p.id, p.created_at),
                      paidOn: p.updated_at || p.created_at,
                      customerName: profile?.display_name || user?.email?.split('@')[0] || 'Customer',
                      customerEmail: user?.email || '',
                      plan: p.plan,
                      paymentMethod: pmLabel(p.payment_method),
                      transactionId: p.transaction_id,
                      amount: Number(p.amount),
                      brandName: brand?.brand_name,
                      brandTagline: brand?.tagline,
                    });
                    toast.success('রসিদ ডাউনলোড হয়েছে');
                  } catch (err: any) {
                    toast.error(err?.message || 'রসিদ তৈরি করা যায়নি');
                  }
                };
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.plan} — ৳{Number(p.amount).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{pmLabel(p.payment_method)} • {p.transaction_id}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), 'dd MMM, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          isApproved ? 'border-success/30 bg-success/10 text-success'
                          : p.status === 'rejected' ? 'border-destructive/30 bg-destructive/10 text-destructive'
                          : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600'
                        }
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        {isApproved ? 'অনুমোদিত' : p.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমান'}
                      </Badge>
                      {isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={handleDownload}
                        >
                          <Download className="h-3 w-3" /> রসিদ
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
