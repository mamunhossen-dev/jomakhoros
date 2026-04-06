import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, CreditCard, Shield, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { isAdmin, isModerator } = useSubscription();
  const qc = useQueryClient();

  // Fetch all users (profiles)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all feedback
  const { data: feedbacks, isLoading: feedbackLoading } = useQuery({
    queryKey: ['admin_feedback'],
    queryFn: async () => {
      const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin || isModerator,
  });

  // Fetch payment requests
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin_payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payment_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin || isModerator,
  });

  // Approve payment mutation
  const approvePayment = useMutation({
    mutationFn: async ({ paymentId, userId, plan }: { paymentId: string; userId: string; plan: string }) => {
      // Update payment status
      const { error: payError } = await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
      if (payError) throw payError;

      // Calculate subscription end
      let months = 1;
      if (plan.includes('৬')) months = 6;
      else if (plan.includes('১ বছর')) months = 12;

      const subEnd = new Date();
      subEnd.setMonth(subEnd.getMonth() + months);

      // Update profile to pro
      const { error: profError } = await supabase.from('profiles').update({
        account_type: 'pro',
        subscription_start: new Date().toISOString(),
        subscription_end: subEnd.toISOString(),
        payment_status: 'paid',
      }).eq('user_id', userId);
      if (profError) throw profError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_payments'] });
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('পেমেন্ট অনুমোদিত ও প্রো সক্রিয়!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin_payments'] }); toast.success('পেমেন্ট প্রত্যাখ্যাত'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin_feedback'] }); toast.success('ফিডব্যাক মুছে ফেলা হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });

  // Role management
  const [roleUserId, setRoleUserId] = useState('');
  const [newRole, setNewRole] = useState('');

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from('user_roles').insert([{ user_id: userId, role: role as any }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('ভূমিকা যোগ হয়েছে'); setRoleUserId(''); setNewRole(''); },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isAdmin && !isModerator) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium">অ্যাক্সেস নেই</p>
          <p className="text-muted-foreground text-sm">আপনার এই পেজে অ্যাক্সেস নেই।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">অ্যাডমিন প্যানেল</h1>
        <p className="text-muted-foreground">সাইট ও ব্যবহারকারী পরিচালনা করুন।</p>
      </div>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments"><CreditCard className="mr-1 h-3.5 w-3.5" /> পেমেন্ট</TabsTrigger>
          <TabsTrigger value="feedback"><MessageSquare className="mr-1 h-3.5 w-3.5" /> ফিডব্যাক</TabsTrigger>
          {isAdmin && <TabsTrigger value="users"><Users className="mr-1 h-3.5 w-3.5" /> ব্যবহারকারী</TabsTrigger>}
          {isAdmin && <TabsTrigger value="roles"><Shield className="mr-1 h-3.5 w-3.5" /> ভূমিকা</TabsTrigger>}
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="font-display text-lg">পেমেন্ট রিকোয়েস্ট</CardTitle></CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : !payments?.length ? (
                <p className="text-center py-8 text-muted-foreground text-sm">কোনো পেমেন্ট রিকোয়েস্ট নেই</p>
              ) : (
                <div className="space-y-3">
                  {payments.map(p => (
                    <div key={p.id} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{p.plan} — ৳{Number(p.amount).toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">{p.payment_method} • TxID: {p.transaction_id}</p>
                          <p className="text-xs text-muted-foreground">UID: {p.user_id.substring(0, 8)}... • {format(new Date(p.created_at), 'dd MMM yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.status === 'pending' ? (
                            <>
                              <Button size="sm" className="h-7 bg-success hover:bg-success/90" onClick={() => approvePayment.mutate({ paymentId: p.id, userId: p.user_id, plan: p.plan })}>
                                <CheckCircle2 className="mr-1 h-3 w-3" /> অনুমোদন
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7" onClick={() => rejectPayment.mutate(p.id)}>
                                <XCircle className="mr-1 h-3 w-3" /> প্রত্যাখ্যান
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className={p.status === 'approved' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}>
                              {p.status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="font-display text-lg">ফিডব্যাক তালিকা</CardTitle></CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : !feedbacks?.length ? (
                <p className="text-center py-8 text-muted-foreground text-sm">কোনো ফিডব্যাক নেই</p>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map(f => (
                    <div key={f.id} className="rounded-lg border border-border/50 p-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium">{f.name || 'অজ্ঞাত'} {f.email ? `(${f.email})` : ''}</p>
                          <p className="text-sm mt-1">{f.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(f.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                        </div>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteFeedback.mutate(f.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="users">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="font-display text-lg">ব্যবহারকারী তালিকা</CardTitle></CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {users?.map(u => (
                      <div key={u.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{u.display_name || 'নাম নেই'}</p>
                          <p className="text-xs text-muted-foreground">UID: {u.user_id.substring(0, 12)}...</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!u.onboarding_completed && (
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">অনবোর্ডিং</Badge>
                          )}
                          <Select
                            value={u.account_type}
                            onValueChange={async (val) => {
                              const updateData: Record<string, any> = { account_type: val };
                              if (val === 'pro') {
                                const subEnd = new Date();
                                subEnd.setMonth(subEnd.getMonth() + 1);
                                updateData.subscription_start = new Date().toISOString();
                                updateData.subscription_end = subEnd.toISOString();
                                updateData.payment_status = 'paid';
                              }
                              const { error } = await supabase.from('profiles').update(updateData).eq('user_id', u.user_id);
                              if (error) { toast.error(error.message); return; }
                              qc.invalidateQueries({ queryKey: ['admin_users'] });
                              toast.success('স্ট্যাটাস আপডেট হয়েছে');
                            }}
                          >
                            <SelectTrigger className="h-7 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trial">ট্রায়াল</SelectItem>
                              <SelectItem value="free">ফ্রি</SelectItem>
                              <SelectItem value="pro">প্রো</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={async () => {
                            const { error } = await supabase.from('profiles').update({ onboarding_completed: false }).eq('user_id', u.user_id);
                            if (error) { toast.error(error.message); return; }
                            qc.invalidateQueries({ queryKey: ['admin_users'] });
                            toast.success('অনবোর্ডিং রিসেট হয়েছে');
                          }}>
                            রিসেট
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Roles Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="roles">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="font-display text-lg">ভূমিকা নির্ধারণ</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input value={roleUserId} onChange={e => setRoleUserId(e.target.value)} placeholder="ব্যবহারকারীর User ID পেস্ট করুন" />
                </div>
                <div className="space-y-2">
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger><SelectValue placeholder="ভূমিকা নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">অ্যাডমিন</SelectItem>
                      <SelectItem value="moderator">মডারেটর</SelectItem>
                      <SelectItem value="user">সাধারণ ব্যবহারকারী</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => roleUserId && newRole && assignRole.mutate({ userId: roleUserId, role: newRole })} disabled={!roleUserId || !newRole}>
                  ভূমিকা যোগ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
