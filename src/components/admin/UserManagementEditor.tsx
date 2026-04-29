import { useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Lock, Unlock, AlertCircle, Trash2, KeyRound, Download, Send, Eye, Filter as FilterIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_BLOCK_MESSAGE, type BlockMessageContent } from '@/components/BlockedOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/components/admin/AuditLogViewer';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'inactive_30d' | 'expired' | 'blocked';
type AccountFilter = 'all' | 'trial' | 'free' | 'pro';

const PAGE_SIZE = 25;

export function UserManagementEditor({ initialSearch }: { initialSearch?: string } = {}) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [search, setSearch] = useState(initialSearch ?? '');
  const [signupFrom, setSignupFrom] = useState<string>('');
  const [signupTo, setSignupTo] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialSearch]);
  const [days, setDays] = useState(30);
  const [blockTarget, setBlockTarget] = useState<{ user_id: string; name: string } | null>(null);
  const [reason, setReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ user_id: string; name: string } | null>(null);
  const [pwdTarget, setPwdTarget] = useState<{ user_id: string; name: string } | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [detailsTarget, setDetailsTarget] = useState<any | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBlockOpen, setBulkBlockOpen] = useState(false);
  const [bulkBlockReason, setBulkBlockReason] = useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkNotifOpen, setBulkNotifOpen] = useState(false);
  const [bulkNotifTitle, setBulkNotifTitle] = useState('');
  const [bulkNotifBody, setBulkNotifBody] = useState('');
  const [bulkNotifLink, setBulkNotifLink] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin_users_full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, account_type, trial_end_date, subscription_end, last_login_at, is_blocked, block_reason, blocked_at, created_at, phone, address, payment_status, onboarding_completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin_user_roles_emails'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, email, user_name, role');
      if (error) throw error;
      return data;
    },
  });

  const emailByUser = new Map((roles || []).map(r => [r.user_id, r.email]));
  const roleByUser = new Map((roles || []).map(r => [r.user_id, r.role]));

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

  // Bulk: block / unblock
  const bulkBlock = useMutation({
    mutationFn: async ({ ids, blocked, reason }: { ids: string[]; blocked: boolean; reason: string }) => {
      for (const id of ids) {
        const { error } = await supabase.rpc('admin_set_user_block', {
          _user_id: id, _blocked: blocked, _reason: reason || null,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin_users_full'] });
      toast.success(`${vars.ids.length} জন ইউজার ${vars.blocked ? 'ব্লক' : 'আনব্লক'} হয়েছে`);
      setBulkBlockOpen(false); setBulkBlockReason(''); setSelectedIds(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Bulk: delete
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const token = session?.access_token;
      if (!token) throw new Error('সেশন পাওয়া যায়নি');
      let success = 0; let failed = 0;
      for (const id of ids) {
        try {
          const { data, error } = await supabase.functions.invoke('admin-delete-user', {
            body: { target_user_id: id },
            headers: { Authorization: `Bearer ${token}` },
          });
          if (error) throw error;
          if ((data as any)?.error) throw new Error((data as any).error);
          success++;
        } catch { failed++; }
      }
      return { success, failed };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin_users_full'] });
      toast.success(`${r.success} জন ডিলিট হয়েছে${r.failed ? `, ${r.failed} জন ব্যর্থ` : ''}`);
      setBulkDeleteOpen(false); setSelectedIds(new Set());
    },
    onError: (e: any) => toast.error(e.message || 'বাল্ক ডিলিট ব্যর্থ'),
  });

  // Bulk: send notification
  const bulkNotify = useMutation({
    mutationFn: async ({ ids, title, body, link }: { ids: string[]; title: string; body: string; link: string }) => {
      const rows = ids.map(uid => ({
        user_id: uid, type: 'announcement', title, body,
        link: link || null,
      }));
      // batch in chunks of 500
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase.from('user_notifications').insert(chunk);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(`${vars.ids.length} জনকে নোটিফিকেশন পাঠানো হয়েছে`);
      setBulkNotifOpen(false);
      setBulkNotifTitle(''); setBulkNotifBody(''); setBulkNotifLink('');
      setSelectedIds(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  const now = Date.now();
  const filtered = useMemo(() => (users || []).filter(u => {
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
    if (accountFilter !== 'all' && u.account_type !== accountFilter) return false;
    if (signupFrom) {
      if (new Date(u.created_at).getTime() < new Date(signupFrom).getTime()) return false;
    }
    if (signupTo) {
      if (new Date(u.created_at).getTime() > new Date(signupTo).getTime() + 86400000) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const email = (emailByUser.get(u.user_id) || '').toLowerCase();
      const name = (u.display_name || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const uid = u.user_id.toLowerCase();
      if (!email.includes(q) && !name.includes(q) && !phone.includes(q) && !uid.includes(q)) return false;
    }
    return true;
  }), [users, filter, accountFilter, signupFrom, signupTo, search, days, emailByUser, now]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allOnPageSelected = paged.length > 0 && paged.every(u => selectedIds.has(u.user_id));
  const togglePage = () => {
    const next = new Set(selectedIds);
    if (allOnPageSelected) paged.forEach(u => next.delete(u.user_id));
    else paged.forEach(u => next.add(u.user_id));
    setSelectedIds(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  // CSV Export
  const exportCsv = (rows: any[], fname: string) => {
    if (!rows.length) { toast.error('কোনো ডেটা নেই'); return; }
    const headers = ['user_id', 'display_name', 'email', 'phone', 'account_type', 'role', 'is_blocked', 'block_reason', 'created_at', 'last_login_at', 'trial_end_date', 'subscription_end'];
    const lines = [headers.join(',')];
    for (const u of rows) {
      const vals = [
        u.user_id,
        u.display_name || '',
        emailByUser.get(u.user_id) || '',
        u.phone || '',
        u.account_type || '',
        roleByUser.get(u.user_id) || '',
        u.is_blocked ? 'yes' : 'no',
        (u.block_reason || '').replace(/[\r\n]+/g, ' '),
        u.created_at || '',
        u.last_login_at || '',
        u.trial_end_date || '',
        u.subscription_end || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(','));
    }
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} জনের ডেটা এক্সপোর্ট হয়েছে`);
  };

  return (
    <div className="space-y-6">
      <BlockMessageEditor />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">ইউজার ম্যানেজমেন্ট</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="নাম, ইমেইল, ফোন বা UID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={filter} onValueChange={(v: FilterType) => { setFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ইউজার</SelectItem>
                <SelectItem value="inactive_30d">যারা X দিন লগইন করেননি</SelectItem>
                <SelectItem value="expired">সাবস্ক্রিপশন/ট্রায়াল শেষ</SelectItem>
                <SelectItem value="blocked">ব্লক করা ইউজার</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accountFilter} onValueChange={(v: AccountFilter) => { setAccountFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব প্ল্যান</SelectItem>
                <SelectItem value="trial">ট্রায়াল</SelectItem>
                <SelectItem value="free">ফ্রি</SelectItem>
                <SelectItem value="pro">প্রো</SelectItem>
              </SelectContent>
            </Select>
            {filter === 'inactive_30d' ? (
              <Input type="number" min={1} value={days} onChange={e => setDays(Math.max(1, Number(e.target.value)))} placeholder="দিন" />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAdvanced(v => !v)}>
                <FilterIcon className="h-3.5 w-3.5 mr-1" /> {showAdvanced ? 'কম' : 'আরও'}
              </Button>
            )}
          </div>

          {showAdvanced && (
            <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-lg bg-muted/40">
              <div className="space-y-1">
                <Label className="text-xs">যোগদান (থেকে)</Label>
                <Input type="date" value={signupFrom} onChange={e => { setSignupFrom(e.target.value); setPage(1); }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">যোগদান (পর্যন্ত)</Label>
                <Input type="date" value={signupTo} onChange={e => { setSignupTo(e.target.value); setPage(1); }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              মোট: {filtered.length} জন • নির্বাচিত: {selectedIds.size}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => exportCsv(filtered, `users-${format(new Date(), 'yyyy-MM-dd')}.csv`)}>
                <Download className="h-3.5 w-3.5 mr-1" /> CSV (সব ফিল্টার্ড)
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={() => exportCsv((users || []).filter(u => selectedIds.has(u.user_id)), `selected-users.csv`)}>
                    <Download className="h-3.5 w-3.5 mr-1" /> নির্বাচিত CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setBulkNotifOpen(true)}>
                    <Send className="h-3.5 w-3.5 mr-1" /> নোটিফিকেশন
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setBulkBlockOpen(true)}>
                    <Lock className="h-3.5 w-3.5 mr-1" /> ব্লক
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => bulkBlock.mutate({ ids: Array.from(selectedIds), blocked: false, reason: '' })} disabled={bulkBlock.isPending}>
                    <Unlock className="h-3.5 w-3.5 mr-1" /> আনব্লক
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> ডিলিট
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>বাতিল</Button>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
          ) : (
            <>
              <div className="flex items-center gap-2 px-1">
                <Checkbox checked={allOnPageSelected} onCheckedChange={togglePage} />
                <span className="text-xs text-muted-foreground">এই পেইজের সব নির্বাচন করুন ({paged.length})</span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {paged.map(u => {
                  const email = emailByUser.get(u.user_id);
                  const role = roleByUser.get(u.user_id);
                  const lastLogin = u.last_login_at ? new Date(u.last_login_at) : null;
                  const daysAgo = lastLogin ? differenceInDays(new Date(), lastLogin) : null;
                  const checked = selectedIds.has(u.user_id);
                  return (
                    <div key={u.user_id} className="rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox className="mt-1" checked={checked} onCheckedChange={() => toggleOne(u.user_id)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{u.display_name || 'নামহীন'}</p>
                                <Badge variant="outline" className="text-xs">{u.account_type}</Badge>
                                {role && role !== 'user' && <Badge className="text-xs">{role}</Badge>}
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
                              <Button size="sm" variant="outline" onClick={() => setDetailsTarget(u)}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> বিস্তারিত
                              </Button>
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
                      </div>
                    </div>
                  );
                })}
                {paged.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">কোনো ইউজার নেই</p>}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>আগের</Button>
                  <span className="text-xs text-muted-foreground">পেইজ {page} / {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>পরের</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Single block dialog */}
      <Dialog open={!!blockTarget} onOpenChange={o => !o && setBlockTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ইউজার ব্লক করুন</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm"><strong>{blockTarget?.name}</strong> কে সাময়িকভাবে ব্লক করতে চান?</p>
            <div className="space-y-2">
              <Label>ব্লকের কারণ (ইউজার এটি দেখতে পাবে)</Label>
              <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="যেমন: পেমেন্ট সংক্রান্ত সমস্যা..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>বাতিল</Button>
            <Button variant="destructive" disabled={setBlock.isPending} onClick={() => blockTarget && setBlock.mutate({ user_id: blockTarget.user_id, blocked: true, reason })}>
              ব্লক নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password dialog */}
      <Dialog open={!!pwdTarget} onOpenChange={o => { if (!o) { setPwdTarget(null); setNewPwd(''); setConfirmPwd(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>পাসওয়ার্ড রিসেট করুন</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm"><strong>{pwdTarget?.name}</strong> এর জন্য নতুন পাসওয়ার্ড সেট করুন।</p>
            <div className="space-y-2">
              <Label>নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</Label>
              <Input type="text" autoComplete="off" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input type="text" autoComplete="off" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwdTarget(null); setNewPwd(''); setConfirmPwd(''); }}>বাতিল</Button>
            <Button disabled={resetPassword.isPending || newPwd.length < 6 || newPwd !== confirmPwd}
              onClick={() => pwdTarget && resetPassword.mutate({ user_id: pwdTarget.user_id, new_password: newPwd })}>
              {resetPassword.isPending ? 'পরিবর্তন হচ্ছে...' : 'নিশ্চিত করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ইউজার সম্পূর্ণভাবে ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> এর সব ডেটা স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>বাতিল</AlertDialogCancel>
            <AlertDialogAction disabled={deleteUser.isPending}
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUser.isPending ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk block */}
      <Dialog open={bulkBlockOpen} onOpenChange={setBulkBlockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>বাল্ক ব্লক ({selectedIds.size} জন)</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>ব্লকের কারণ (সবার জন্য একই)</Label>
            <Textarea rows={3} value={bulkBlockReason} onChange={e => setBulkBlockReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkBlockOpen(false)}>বাতিল</Button>
            <Button variant="destructive" disabled={bulkBlock.isPending}
              onClick={() => bulkBlock.mutate({ ids: Array.from(selectedIds), blocked: true, reason: bulkBlockReason })}>
              {bulkBlock.isPending ? 'প্রসেস হচ্ছে...' : 'ব্লক করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedIds.size} জন ইউজার ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              নির্বাচিত সবার অ্যাকাউন্ট ও সব ডেটা স্থায়ীভাবে মুছে যাবে। এটি আর ফিরিয়ে আনা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDelete.isPending}>বাতিল</AlertDialogCancel>
            <AlertDialogAction disabled={bulkDelete.isPending}
              onClick={() => bulkDelete.mutate(Array.from(selectedIds))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDelete.isPending ? 'ডিলিট হচ্ছে...' : 'সব ডিলিট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk notification */}
      <Dialog open={bulkNotifOpen} onOpenChange={setBulkNotifOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>নোটিফিকেশন পাঠান ({selectedIds.size} জন)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>শিরোনাম</Label>
              <Input value={bulkNotifTitle} onChange={e => setBulkNotifTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>মেসেজ</Label>
              <Textarea rows={4} value={bulkNotifBody} onChange={e => setBulkNotifBody(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>লিঙ্ক (ঐচ্ছিক)</Label>
              <Input value={bulkNotifLink} onChange={e => setBulkNotifLink(e.target.value)} placeholder="/subscription" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkNotifOpen(false)}>বাতিল</Button>
            <Button disabled={bulkNotify.isPending || !bulkNotifTitle.trim() || !bulkNotifBody.trim()}
              onClick={() => bulkNotify.mutate({ ids: Array.from(selectedIds), title: bulkNotifTitle, body: bulkNotifBody, link: bulkNotifLink })}>
              {bulkNotify.isPending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details */}
      <UserDetailsDialog
        user={detailsTarget}
        email={detailsTarget ? emailByUser.get(detailsTarget.user_id) : undefined}
        role={detailsTarget ? roleByUser.get(detailsTarget.user_id) : undefined}
        onClose={() => setDetailsTarget(null)}
      />
    </div>
  );
}

function UserDetailsDialog({ user, email, role, onClose }: { user: any | null; email?: string; role?: string; onClose: () => void }) {
  const enabled = !!user;
  const uid = user?.user_id;

  const { data: stats } = useQuery({
    queryKey: ['admin_user_stats', uid],
    enabled,
    queryFn: async () => {
      const [tx, wallets, payments, support] = await Promise.all([
        supabase.from('transactions').select('id, type, amount', { count: 'exact', head: false }).eq('user_id', uid),
        supabase.from('wallets').select('id, name, balance').eq('user_id', uid),
        supabase.from('payment_requests').select('id, plan, amount, status, created_at').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('support_threads').select('id, ticket_number, status').eq('user_id', uid),
      ]);
      const txs = tx.data || [];
      const income = txs.filter((t: any) => t.type === 'income').reduce((s, t: any) => s + Number(t.amount), 0);
      const expense = txs.filter((t: any) => t.type === 'expense').reduce((s, t: any) => s + Number(t.amount), 0);
      return {
        txCount: txs.length,
        income, expense,
        wallets: wallets.data || [],
        payments: payments.data || [],
        support: support.data || [],
      };
    },
  });

  return (
    <Dialog open={!!user} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>ইউজার বিস্তারিত</DialogTitle></DialogHeader>
        {user && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="নাম" value={user.display_name || '—'} />
              <Field label="ইমেইল" value={email || '—'} />
              <Field label="ফোন" value={user.phone || '—'} />
              <Field label="ঠিকানা" value={user.address || '—'} />
              <Field label="UID" value={user.user_id} mono />
              <Field label="রোল" value={role || 'user'} />
              <Field label="প্ল্যান" value={user.account_type} />
              <Field label="পেমেন্ট স্ট্যাটাস" value={user.payment_status || '—'} />
              <Field label="ট্রায়াল শেষ" value={user.trial_end_date ? format(new Date(user.trial_end_date), 'dd MMM yyyy') : '—'} />
              <Field label="সাবস্ক্রিপশন শেষ" value={user.subscription_end ? format(new Date(user.subscription_end), 'dd MMM yyyy') : '—'} />
              <Field label="যোগদান" value={format(new Date(user.created_at), 'dd MMM yyyy')} />
              <Field label="শেষ লগইন" value={user.last_login_at ? format(new Date(user.last_login_at), 'dd MMM yyyy HH:mm') : 'কখনো না'} />
              <Field label="অনবোর্ডিং সম্পন্ন" value={user.onboarding_completed ? 'হ্যাঁ' : 'না'} />
              <Field label="ব্লকড" value={user.is_blocked ? `হ্যাঁ${user.block_reason ? ' — ' + user.block_reason : ''}` : 'না'} />
            </div>

            {stats && (
              <>
                <div className="grid gap-2 grid-cols-3 pt-2 border-t">
                  <Stat label="লেনদেন" value={stats.txCount} />
                  <Stat label="মোট আয়" value={`৳${stats.income.toLocaleString()}`} />
                  <Stat label="মোট ব্যয়" value={`৳${stats.expense.toLocaleString()}`} />
                </div>

                <div>
                  <p className="font-medium mb-1">ওয়ালেট ({stats.wallets.length})</p>
                  <div className="space-y-1">
                    {stats.wallets.map((w: any) => (
                      <div key={w.id} className="flex justify-between text-xs p-2 bg-muted/40 rounded">
                        <span>{w.name}</span>
                        <span>৳{Number(w.balance).toLocaleString()}</span>
                      </div>
                    ))}
                    {stats.wallets.length === 0 && <p className="text-xs text-muted-foreground">কোনো ওয়ালেট নেই</p>}
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-1">পেমেন্ট হিস্ট্রি ({stats.payments.length})</p>
                  <div className="space-y-1">
                    {stats.payments.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex justify-between text-xs p-2 bg-muted/40 rounded">
                        <span>{p.plan} — ৳{p.amount}</span>
                        <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                      </div>
                    ))}
                    {stats.payments.length === 0 && <p className="text-xs text-muted-foreground">কোনো পেমেন্ট নেই</p>}
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-1">সাপোর্ট টিকিট ({stats.support.length})</p>
                  <div className="space-y-1">
                    {stats.support.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="flex justify-between text-xs p-2 bg-muted/40 rounded">
                        <span>{s.ticket_number}</span>
                        <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                      </div>
                    ))}
                    {stats.support.length === 0 && <p className="text-xs text-muted-foreground">কোনো টিকিট নেই</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm break-all", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-center p-2 rounded-lg bg-primary/5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-primary">{value}</p>
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
