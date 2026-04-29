import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Search, Lock, Unlock, AlertCircle, Trash2, KeyRound } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_BLOCK_MESSAGE, type BlockMessageContent } from '@/components/BlockedOverlay';
import { useAuth } from '@/contexts/AuthContext';

type FilterType = 'all' | 'inactive_30d' | 'expired' | 'blocked';

export function UserManagementEditor() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [days, setDays] = useState(30);
  const [blockTarget, setBlockTarget] = useState<{ user_id: string; name: string } | null>(null);
  const [reason, setReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ user_id: string; name: string } | null>(null);
  const [pwdTarget, setPwdTarget] = useState<{ user_id: string; name: string } | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin_users_full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, account_type, trial_end_date, subscription_end, last_login_at, is_blocked, block_reason, blocked_at, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin_user_roles_emails'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, email, user_name');
      if (error) throw error;
      return data;
    },
  });

  const emailByUser = new Map((roles || []).map(r => [r.user_id, r.email]));

  const setBlock = useMutation({
    mutationFn: async ({ user_id, blocked, reason }: { user_id: string; blocked: boolean; reason: string }) => {
      const { error } = await supabase.rpc('admin_set_user_block', {
        _user_id: user_id, _blocked: blocked, _reason: reason || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin_users_full'] });
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success(vars.blocked ? 'ইউজার ব্লক করা হয়েছে' : 'ব্লক তুলে নেওয়া হয়েছে');
      setBlockTarget(null); setReason('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (user_id: string) => {
      const token = session?.access_token;
      if (!token) throw new Error('সেশন পাওয়া যায়নি, আবার লগইন করুন');

      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { target_user_id: user_id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        const context = (error as { context?: unknown }).context;
        if (context instanceof Response) {
          const body = await context.json().catch(() => null);
          throw new Error(body?.error || error.message);
        }
        throw error;
      }
      const response = data as { error?: string } | null;
      if (response?.error) throw new Error(response.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_users_full'] });
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('ইউজার সম্পূর্ণভাবে মুছে ফেলা হয়েছে');
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message || 'ডিলিট ব্যর্থ হয়েছে'),
  });

  const resetPassword = useMutation({
    mutationFn: async ({ user_id, new_password }: { user_id: string; new_password: string }) => {
      const token = session?.access_token;
      if (!token) throw new Error('সেশন পাওয়া যায়নি, আবার লগইন করুন');
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: user_id, new_password },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        const context = (error as { context?: unknown }).context;
        if (context instanceof Response) {
          const body = await context.json().catch(() => null);
          throw new Error(body?.error || error.message);
        }
        throw error;
      }
      const response = data as { error?: string } | null;
      if (response?.error) throw new Error(response.error);
    },
    onSuccess: () => {
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
      setPwdTarget(null); setNewPwd(''); setConfirmPwd('');
    },
    onError: (e: any) => toast.error(e.message || 'পাসওয়ার্ড রিসেট ব্যর্থ'),
  });

  const now = Date.now();
  const filtered = (users || []).filter(u => {
    if (filter === 'blocked' && !u.is_blocked) return false;
    if (filter === 'inactive_30d') {
      const last = u.last_login_at ? new Date(u.last_login_at).getTime() : new Date(u.created_at).getTime();
      if ((now - last) / 86400000 < days) return false;
    }
    if (filter === 'expired') {
      const isTrialExpired = u.account_type === 'trial' && u.trial_end_date && new Date(u.trial_end_date).getTime() < now;
      const isProExpired = u.account_type === 'pro' && u.subscription_end && new Date(u.subscription_end).getTime() < now;
      const isFree = u.account_type === 'free';
      if (!(isTrialExpired || isProExpired || isFree)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const email = (emailByUser.get(u.user_id) || '').toLowerCase();
      const name = (u.display_name || '').toLowerCase();
      if (!email.includes(q) && !name.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <BlockMessageEditor />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">ইউজার ম্যানেজমেন্ট</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={(v: FilterType) => setFilter(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ইউজার</SelectItem>
                <SelectItem value="inactive_30d">যারা X দিন লগইন করেননি</SelectItem>
                <SelectItem value="expired">যাদের সাবস্ক্রিপশন/ট্রায়াল শেষ</SelectItem>
                <SelectItem value="blocked">ব্লক করা ইউজার</SelectItem>
              </SelectContent>
            </Select>
            {filter === 'inactive_30d' && (
              <Input type="number" min={1} value={days} onChange={e => setDays(Math.max(1, Number(e.target.value)))} placeholder="দিন" />
            )}
          </div>

          <p className="text-xs text-muted-foreground">মোট: {filtered.length} জন</p>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map(u => {
                const email = emailByUser.get(u.user_id);
                const lastLogin = u.last_login_at ? new Date(u.last_login_at) : null;
                const daysAgo = lastLogin ? differenceInDays(new Date(), lastLogin) : null;
                return (
                  <div key={u.user_id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{u.display_name || 'নামহীন'}</p>
                          <Badge variant="outline" className="text-xs">{u.account_type}</Badge>
                          {u.is_blocked && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Lock className="h-3 w-3" /> ব্লকড
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lastLogin
                            ? `শেষ লগইন: ${format(lastLogin, 'dd MMM, yyyy')} (${daysAgo} দিন আগে)`
                            : 'কখনো লগইন করেননি'}
                        </p>
                        {u.is_blocked && u.block_reason && (
                          <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{u.block_reason}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {u.is_blocked ? (
                          <Button size="sm" variant="outline" onClick={() => setBlock.mutate({ user_id: u.user_id, blocked: false, reason: '' })}>
                            <Unlock className="h-3.5 w-3.5 mr-1" /> আনব্লক
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => { setBlockTarget({ user_id: u.user_id, name: u.display_name || email || '' }); setReason(''); }}>
                            <Lock className="h-3.5 w-3.5 mr-1" /> ব্লক
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={() => { setPwdTarget({ user_id: u.user_id, name: u.display_name || email || '' }); setNewPwd(''); setConfirmPwd(''); }}
                        >
                          <KeyRound className="h-3.5 w-3.5 mr-1" /> পাসওয়ার্ড
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setDeleteTarget({ user_id: u.user_id, name: u.display_name || email || '' })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> ডিলিট
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">কোনো ইউজার নেই</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!blockTarget} onOpenChange={o => !o && setBlockTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ইউজার ব্লক করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{blockTarget?.name}</strong> কে সাময়িকভাবে ব্লক করতে চান?
            </p>
            <div className="space-y-2">
              <Label>ব্লকের কারণ (ইউজার এটি দেখতে পাবে)</Label>
              <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="যেমন: পেমেন্ট সংক্রান্ত সমস্যা, অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>বাতিল</Button>
            <Button
              variant="destructive"
              disabled={setBlock.isPending}
              onClick={() => blockTarget && setBlock.mutate({ user_id: blockTarget.user_id, blocked: true, reason })}
            >
              ব্লক নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ইউজার সম্পূর্ণভাবে ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> এর অ্যাকাউন্ট, লেনদেন, ওয়ালেট, বাজেট, লোন, ক্যাটাগরি, সাপোর্ট মেসেজ সহ <strong>সব ডেটা স্থায়ীভাবে মুছে যাবে</strong>। এই কাজটি আর ফিরিয়ে আনা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteUser.isPending}
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BlockMessageEditor() {
  const qc = useQueryClient();
  const { data } = useAppSetting<BlockMessageContent>('block_message', DEFAULT_BLOCK_MESSAGE);
  const [c, setC] = useState<BlockMessageContent>(DEFAULT_BLOCK_MESSAGE);

  useEffect(() => { if (data) setC({ ...DEFAULT_BLOCK_MESSAGE, ...data }); }, [data]);

  const save = useMutation({
    mutationFn: async (value: BlockMessageContent) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ setting_key: 'block_message', setting_value: value as any }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_setting', 'block_message'] });
      toast.success('ব্লক মেসেজ আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">গ্লোবাল ব্লক মেসেজ</CardTitle>
        <p className="text-xs text-muted-foreground">যখন ইউজার ব্লকড থাকে, এই মেসেজটি তারা প্রতিটি পেইজে দেখবে।</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>শিরোনাম</Label>
          <Input value={c.title} onChange={e => setC({ ...c, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>মেসেজ</Label>
          <Textarea rows={4} value={c.body} onChange={e => setC({ ...c, body: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>সাপোর্ট বাটন লেবেল</Label>
          <Input value={c.support_button_label} onChange={e => setC({ ...c, support_button_label: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={c.show_logout_button} onCheckedChange={v => setC({ ...c, show_logout_button: v })} />
          লগআউট বাটন দেখান
        </label>
        <Button onClick={() => save.mutate(c)} disabled={save.isPending} className="w-full">
          {save.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </CardContent>
    </Card>
  );
}
