import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageSquare, CreditCard, Shield, CheckCircle2, XCircle, Trash2, Copy, RotateCcw, Bell, Send, Pencil, Plus, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { STATUS_LIST, getStatusMeta, type SupportStatus } from '@/lib/supportStatus';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { isAdmin, isModerator } = useSubscription();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Notifications state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [editingNotif, setEditingNotif] = useState<string | null>(null);

  // Support state
  const [selectedConvUser, setSelectedConvUser] = useState<string | null>(null);
  const [supportText, setSupportText] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'all'>('all');
  const supportEndRef = useRef<HTMLDivElement>(null);

  // App settings: terms checkbox toggle
  const { data: termsSetting } = useQuery({
    queryKey: ['app_setting', 'terms_checkbox_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'terms_checkbox_enabled')
        .maybeSingle();
      if (error) throw error;
      return (data?.setting_value as boolean) ?? true;
    },
    enabled: isAdmin,
  });

  const updateTermsSetting = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ setting_key: 'terms_checkbox_enabled', setting_value: enabled as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'terms_checkbox_enabled'] });
      toast.success('সেটিংস আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

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

  // Fetch all user roles
  const { data: allRoles } = useQuery({
    queryKey: ['admin_all_roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
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
      const { error: payError } = await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
      if (payError) throw payError;

      let months = 1;
      if (plan.includes('৬')) months = 6;
      else if (plan.includes('১ বছর')) months = 12;

      const subEnd = new Date();
      subEnd.setMonth(subEnd.getMonth() + months);

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

  // Role change: delete all existing roles, then insert new one
  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Delete all existing roles for this user
      const { error: delError } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (delError) throw delError;
      // Insert new role
      const { error: insError } = await supabase.from('user_roles').insert([{ user_id: userId, role: role as any }]);
      if (insError) throw insError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_all_roles'] });
      toast.success('ভূমিকা আপডেট হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ============== NOTIFICATIONS ==============
  const { data: notifications, isLoading: notifLoading } = useQuery({
    queryKey: ['admin_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const saveNotification = useMutation({
    mutationFn: async () => {
      if (!notifTitle.trim() || !notifBody.trim()) throw new Error('শিরোনাম ও বার্তা প্রয়োজন');
      if (editingNotif) {
        const { error } = await supabase.from('notifications').update({
          title: notifTitle, body: notifBody,
        }).eq('id', editingNotif);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notifications').insert({
          title: notifTitle, body: notifBody, created_by: user?.id, is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setNotifTitle(''); setNotifBody(''); setEditingNotif(null);
      toast.success(editingNotif ? 'নোটিফিকেশন আপডেট হয়েছে' : 'নোটিফিকেশন পাঠানো হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleNotif = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('notifications').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('মুছে ফেলা হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEditNotif = (n: any) => {
    setEditingNotif(n.id);
    setNotifTitle(n.title);
    setNotifBody(n.body);
  };

  // ============== SUPPORT MESSAGES ==============
  const { data: allMessages } = useQuery({
    queryKey: ['admin_support_messages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('support_messages').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin || isModerator,
  });

  useEffect(() => {
    if (!isAdmin && !isModerator) return;
    const ch = supabase
      .channel('admin-support-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_support_messages'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, isModerator, qc]);

  // Support thread statuses
  const { data: threads } = useQuery({
    queryKey: ['admin_support_threads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('support_threads').select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin || isModerator,
  });

  useEffect(() => {
    if (!isAdmin && !isModerator) return;
    const ch = supabase
      .channel('admin-support-threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_support_threads'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, isModerator, qc]);

  const threadByUser: Record<string, any> = {};
  (threads || []).forEach(t => { threadByUser[t.user_id] = t; });

  const getThreadStatus = (uid: string): SupportStatus =>
    (threadByUser[uid]?.status as SupportStatus) || 'new';

  const updateThreadStatus = useMutation({
    mutationFn: async ({ uid, status }: { uid: string; status: SupportStatus }) => {
      // upsert by user_id (unique)
      const { error } = await supabase
        .from('support_threads')
        .upsert({ user_id: uid, status }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_support_threads'] });
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const conversations: Record<string, any[]> = {};
  (allMessages || []).forEach(m => {
    if (!conversations[m.user_id]) conversations[m.user_id] = [];
    conversations[m.user_id].push(m);
  });
  const conversationUserIds = Object.keys(conversations);

  const sendSupportReply = async () => {
    if (!supportText.trim() || !selectedConvUser || !user) return;
    if (getThreadStatus(selectedConvUser) === 'closed') {
      toast.error('এই টিকেটটি বন্ধ। উত্তর দিতে স্ট্যাটাস "ওপেন" করুন।');
      return;
    }
    const { error } = await supabase.from('support_messages').insert({
      user_id: selectedConvUser,
      sender_id: user.id,
      is_from_admin: true,
      message: supportText.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setSupportText('');
  };

  useEffect(() => {
    if (supportEndRef.current) supportEndRef.current.scrollTop = supportEndRef.current.scrollHeight;
  }, [selectedConvUser, allMessages]);

  const copyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    toast.success('UID কপি হয়েছে');
  };

  // Helper to get role for a user
  const getUserRole = (userId: string) => {
    const role = allRoles?.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const filteredUsers = users?.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (u.display_name || '').toLowerCase().includes(term) ||
      u.user_id.toLowerCase().includes(term) ||
      (u.phone || '').toLowerCase().includes(term);
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
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="payments"><CreditCard className="mr-1 h-3.5 w-3.5" /> পেমেন্ট</TabsTrigger>
          <TabsTrigger value="feedback"><MessageSquare className="mr-1 h-3.5 w-3.5" /> ফিডব্যাক</TabsTrigger>
          <TabsTrigger value="support"><Send className="mr-1 h-3.5 w-3.5" /> সাপোর্ট</TabsTrigger>
          {isAdmin && <TabsTrigger value="notifications"><Bell className="mr-1 h-3.5 w-3.5" /> নোটিফিকেশন</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users"><Users className="mr-1 h-3.5 w-3.5" /> ব্যবহারকারী</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings"><SettingsIcon className="mr-1 h-3.5 w-3.5" /> সেটিংস</TabsTrigger>}
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
              <CardHeader>
                <CardTitle className="font-display text-lg">ব্যবহারকারী তালিকা ({users?.length || 0})</CardTitle>
                <Input
                  placeholder="নাম, UID বা ফোন দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="mt-2"
                />
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers?.map(u => {
                      const role = getUserRole(u.user_id);
                      return (
                        <div key={u.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                          {/* Row 1: Name & badges */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{u.display_name || 'নাম নেই'}</p>
                              <p className="text-xs text-muted-foreground">{u.phone || 'ফোন নেই'}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                              {!u.onboarding_completed && (
                                <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">অনবোর্ডিং</Badge>
                              )}
                              <Badge variant="outline" className="text-[10px]">
                                {role === 'admin' ? 'অ্যাডমিন' : role === 'moderator' ? 'মডারেটর' : 'ইউজার'}
                              </Badge>
                              {u.account_type === 'pro' && (
                                <Badge variant="outline" className="text-[10px] text-success border-success/30">
                                  {u.subscription_end && new Date(u.subscription_end).getFullYear() >= 2099 
                                    ? 'লাইফটাইম' 
                                    : 'প্রো'}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Row 2: UID with copy */}
                          <div className="flex items-center gap-1">
                            <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono truncate">{u.user_id}</code>
                            <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => copyUid(u.user_id)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Row 3: Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Account type */}
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
                              <SelectTrigger className="h-7 w-[80px] text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">ট্রায়াল</SelectItem>
                                <SelectItem value="free">ফ্রি</SelectItem>
                                <SelectItem value="pro">প্রো</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Role */}
                            <Select
                              value={role}
                              onValueChange={(val) => changeRole.mutate({ userId: u.user_id, role: val })}
                            >
                              <SelectTrigger className="h-7 w-[90px] text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">ইউজার</SelectItem>
                                <SelectItem value="moderator">মডারেটর</SelectItem>
                                <SelectItem value="admin">অ্যাডমিন</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Reset onboarding */}
                            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={async () => {
                              const { error } = await supabase.from('profiles').update({ onboarding_completed: false }).eq('user_id', u.user_id);
                              if (error) { toast.error(error.message); return; }
                              qc.invalidateQueries({ queryKey: ['admin_users'] });
                              toast.success('অনবোর্ডিং রিসেট হয়েছে');
                            }}>
                              <RotateCcw className="h-3 w-3 mr-1" /> রিসেট
                            </Button>
                          </div>

                          {/* Row 3b: Pro subscription end date editor */}
                          {u.account_type === 'pro' && (
                            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/30">
                              <Label className="text-[11px] text-muted-foreground">প্রো মেয়াদ শেষ:</Label>
                              <Input
                                type="date"
                                className="h-7 w-[150px] text-[11px]"
                                defaultValue={u.subscription_end ? new Date(u.subscription_end).toISOString().slice(0, 10) : ''}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const { error } = await supabase.from('profiles').update({
                                    subscription_end: new Date(val + 'T23:59:59').toISOString(),
                                    subscription_start: u.subscription_start || new Date().toISOString(),
                                    payment_status: 'paid',
                                  }).eq('user_id', u.user_id);
                                  if (error) { toast.error(error.message); return; }
                                  qc.invalidateQueries({ queryKey: ['admin_users'] });
                                  toast.success('মেয়াদ আপডেট হয়েছে');
                                }}
                              />
                              {[1, 3, 6, 12].map(m => (
                                <Button key={m} variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={async () => {
                                  const base = u.subscription_end && new Date(u.subscription_end) > new Date()
                                    ? new Date(u.subscription_end)
                                    : new Date();
                                  base.setMonth(base.getMonth() + m);
                                  const { error } = await supabase.from('profiles').update({
                                    account_type: 'pro',
                                    subscription_start: u.subscription_start || new Date().toISOString(),
                                    subscription_end: base.toISOString(),
                                    payment_status: 'paid',
                                  }).eq('user_id', u.user_id);
                                  if (error) { toast.error(error.message); return; }
                                  qc.invalidateQueries({ queryKey: ['admin_users'] });
                                  toast.success(`+${m} মাস যোগ হয়েছে`);
                                }}>
                                  +{m}মা
                                </Button>
                              ))}
                              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 border-primary/40 text-primary" onClick={async () => {
                                const lifetimeEnd = new Date('2099-12-31T23:59:59').toISOString();
                                const { error } = await supabase.from('profiles').update({
                                  account_type: 'pro',
                                  subscription_start: u.subscription_start || new Date().toISOString(),
                                  subscription_end: lifetimeEnd,
                                  payment_status: 'paid',
                                }).eq('user_id', u.user_id);
                                if (error) { toast.error(error.message); return; }
                                qc.invalidateQueries({ queryKey: ['admin_users'] });
                                toast.success('লাইফটাইম প্রো সক্রিয়');
                              }}>
                                ♾ লাইফটাইম
                              </Button>
                            </div>
                          )}

                          {/* Row 4: Join date + sub end */}
                          <p className="text-[10px] text-muted-foreground">
                            যোগদান: {format(new Date(u.created_at), 'dd MMM yyyy')}
                            {u.account_type === 'pro' && u.subscription_end && ` • প্রো শেষ: ${new Date(u.subscription_end).getFullYear() >= 2099 ? 'লাইফটাইম' : format(new Date(u.subscription_end), 'dd MMM yyyy')}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Support Tab */}
        <TabsContent value="support">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">সাপোর্ট কথোপকথন</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Status filter bar */}
              {(() => {
                const counts: Record<string, number> = { all: conversationUserIds.length };
                STATUS_LIST.forEach(s => { counts[s.value] = 0; });
                conversationUserIds.forEach(uid => {
                  const st = getThreadStatus(uid);
                  counts[st] = (counts[st] || 0) + 1;
                });
                const COUNT_STYLES: Record<string, { active: string; idle: string }> = {
                  all:     { active: 'bg-primary-foreground/20 text-primary-foreground', idle: 'bg-primary/15 text-primary' },
                  new:     { active: 'bg-primary-foreground/20 text-primary-foreground', idle: 'bg-blue-500 text-white shadow-sm' },
                  open:    { active: 'bg-primary-foreground/20 text-primary-foreground', idle: 'bg-orange-500 text-white shadow-sm' },
                  pending: { active: 'bg-primary-foreground/20 text-primary-foreground', idle: 'bg-yellow-400 text-yellow-950 shadow-sm' },
                  solved:  { active: 'bg-primary-foreground/20 text-primary-foreground', idle: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' },
                  closed:  { active: 'bg-primary-foreground/20 text-primary-foreground', idle: 'bg-gray-200 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' },
                };
                const tabs: Array<{ key: SupportStatus | 'all'; label: string; dotClass?: string }> = [
                  { key: 'all', label: 'সব' },
                  ...STATUS_LIST.map(s => ({ key: s.value, label: s.label, dotClass: s.dotClass })),
                ];
                return (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {tabs.map(t => {
                      const active = statusFilter === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setStatusFilter(t.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all',
                            active
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background hover:bg-muted border-border'
                          )}
                        >
                          {t.dotClass && <span className={cn('h-2 w-2 rounded-full', t.dotClass)} />}
                          <span>{t.label}</span>
                          <span className={cn(
                            'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {counts[t.key] ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="grid gap-3 md:grid-cols-[280px_1fr]">
                {/* Conversations list */}
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[420px]">
                    {(() => {
                      const visible = conversationUserIds.filter(uid =>
                        statusFilter === 'all' ? true : getThreadStatus(uid) === statusFilter
                      );
                      if (!visible.length) {
                        return <p className="p-4 text-center text-xs text-muted-foreground">কোনো কথোপকথন নেই</p>;
                      }
                      return (
                        <div className="divide-y">
                          {visible.map(uid => {
                            const u = users?.find(x => x.user_id === uid);
                            const msgs = conversations[uid];
                            const last = msgs[msgs.length - 1];
                            const unread = msgs.filter(m => !m.is_from_admin && !m.is_read).length;
                            const meta = getStatusMeta(getThreadStatus(uid));
                            const StatusIcon = meta.icon;
                            return (
                              <button
                                key={uid}
                                onClick={() => setSelectedConvUser(uid)}
                                className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${selectedConvUser === uid ? 'bg-muted' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium truncate">{u?.display_name || uid.substring(0, 8)}</p>
                                  {unread > 0 && <Badge className="text-[10px] h-4 px-1.5">{unread}</Badge>}
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <p className="text-[11px] text-muted-foreground truncate flex-1">{last?.message}</p>
                                  <span className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all duration-300',
                                    meta.badgeClass
                                  )}>
                                    <StatusIcon className="h-2.5 w-2.5" />
                                    {meta.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </ScrollArea>
                </div>

                {/* Active conversation */}
                <div className="border rounded-lg flex flex-col h-[420px]">
                  {!selectedConvUser ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                      বামে একটি কথোপকথন বেছে নিন
                    </div>
                  ) : (
                    <>
                      <div className="border-b p-2 flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">
                          {users?.find(u => u.user_id === selectedConvUser)?.display_name || selectedConvUser.substring(0, 12)}
                        </div>
                        {(() => {
                          const current = getStatusMeta(getThreadStatus(selectedConvUser));
                          const CurIcon = current.icon;
                          return (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild disabled={!isAdmin && !isModerator}>
                                <button
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-300 hover:opacity-80',
                                    current.badgeClass
                                  )}
                                >
                                  <CurIcon className="h-3 w-3" />
                                  <span>{current.label}</span>
                                  <ChevronDown className="h-3 w-3 opacity-70" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                {STATUS_LIST.map(s => {
                                  const Icon = s.icon;
                                  return (
                                    <DropdownMenuItem
                                      key={s.value}
                                      onClick={() => updateThreadStatus.mutate({ uid: selectedConvUser, status: s.value })}
                                      className="gap-2 text-sm"
                                    >
                                      <span className={cn('h-2 w-2 rounded-full', s.dotClass)} />
                                      <Icon className="h-3.5 w-3.5" />
                                      <span>{s.label}</span>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          );
                        })()}
                      </div>
                      <div ref={supportEndRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                        {conversations[selectedConvUser]?.map(m => (
                          <div key={m.id} className={`flex ${m.is_from_admin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${m.is_from_admin ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                              <p className={`mt-1 text-[10px] ${m.is_from_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {format(new Date(m.created_at), 'dd MMM, hh:mm a')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t p-2 flex gap-1">
                        <Textarea
                          value={supportText}
                          onChange={e => setSupportText(e.target.value)}
                          placeholder={selectedConvUser && getThreadStatus(selectedConvUser) === 'closed' ? 'টিকেটটি বন্ধ। স্ট্যাটাস "ওপেন" করুন।' : 'উত্তর লিখুন...'}
                          rows={1}
                          disabled={!!selectedConvUser && getThreadStatus(selectedConvUser) === 'closed'}
                          className="min-h-9 resize-none text-sm"
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupportReply(); } }}
                        />
                        <Button size="icon" onClick={sendSupportReply} disabled={!supportText.trim() || (!!selectedConvUser && getThreadStatus(selectedConvUser) === 'closed')}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="notifications">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    {editingNotif ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingNotif ? 'নোটিফিকেশন এডিট' : 'নতুন নোটিফিকেশন'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">শিরোনাম</Label>
                    <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="সংক্ষিপ্ত শিরোনাম" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">বার্তা</Label>
                    <Textarea value={notifBody} onChange={e => setNotifBody(e.target.value)} placeholder="পূর্ণ বার্তা লিখুন..." rows={8} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveNotification.mutate()} disabled={saveNotification.isPending} className="flex-1">
                      {editingNotif ? 'আপডেট' : 'সবার কাছে পাঠান'}
                    </Button>
                    {editingNotif && (
                      <Button variant="outline" onClick={() => { setEditingNotif(null); setNotifTitle(''); setNotifBody(''); }}>বাতিল</Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="font-display text-lg">সব নোটিফিকেশন ({notifications?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                  {notifLoading ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                  ) : !notifications?.length ? (
                    <p className="text-center py-6 text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
                  ) : (
                    <ScrollArea className="h-[400px] pr-2">
                      <div className="space-y-2">
                        {notifications.map(n => (
                          <div key={n.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <p className="text-sm font-medium truncate">{n.title}</p>
                                  {n.is_default && <Badge variant="outline" className="text-[10px]">ডিফল্ট</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), 'dd MMM yyyy')}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <Switch checked={n.is_active} onCheckedChange={(v) => toggleNotif.mutate({ id: n.id, is_active: v })} />
                                <span className="text-xs text-muted-foreground">{n.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditNotif(n)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNotif.mutate(n.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Settings Tab */}
        {isAdmin && (
          <TabsContent value="settings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">অ্যাপ সেটিংস</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <Label htmlFor="terms-toggle" className="text-base font-medium">
                      রেজিস্ট্রেশনে শর্তাবলী চেকবক্স
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      চালু থাকলে রেজিস্ট্রেশন পেইজে ব্যবহারকারীকে শর্তাবলীতে সম্মতি দিতে হবে।
                      বন্ধ করলে চেকবক্সটি দেখানো হবে না।
                    </p>
                  </div>
                  <Switch
                    id="terms-toggle"
                    checked={termsSetting ?? true}
                    onCheckedChange={(checked) => updateTermsSetting.mutate(checked)}
                    disabled={updateTermsSetting.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
