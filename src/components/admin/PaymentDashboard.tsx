import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Download, Search, UserPlus, TrendingUp, Wallet, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, startOfMonth, endOfMonth, subDays, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { logAdminAction } from '@/components/admin/AuditLogViewer';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

type PaymentStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
  monthRevenue: number;
  todayCount: number;
  weekCount: number;
};

export function PaymentDashboard() {
  const qc = useQueryClient();
  const { isAdmin, isModerator } = useSubscription();
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectNote, setBulkRejectNote] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignUser, setAssignUser] = useState<{ user_id: string; name: string } | null>(null);
  const [assignPlan, setAssignPlan] = useState<'1m' | '6m' | '1y' | 'lifetime'>('1m');
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; mode: 'single' | 'bulk' | 'all_test' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { data: payments } = useQuery({
    queryKey: ['admin_payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payment_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin_users_full'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, display_name, account_type, subscription_end, phone');
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

  const adminUserIds = useMemo(
    () => new Set((roles || []).filter((r: any) => r.role === 'admin' || r.role === 'moderator').map((r: any) => r.user_id)),
    [roles]
  );

  const emailByUser = new Map((roles || []).map(r => [r.user_id, r.email]));

  const stats = useMemo<PaymentStats>(() => {
    const list = payments || [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekAgo = subDays(now, 7);
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    let totalRevenue = 0, monthRevenue = 0, todayCount = 0, weekCount = 0;
    let pending = 0, approved = 0, rejected = 0;

    for (const p of list) {
      const created = new Date(p.created_at);
      if (p.status === 'pending') pending++;
      if (p.status === 'approved') {
        approved++;
        totalRevenue += Number(p.amount);
        if (created >= monthStart && created <= monthEnd) monthRevenue += Number(p.amount);
      }
      if (p.status === 'rejected') rejected++;
      if (created >= todayStart) todayCount++;
      if (isAfter(created, weekAgo)) weekCount++;
    }
    return { total: list.length, pending, approved, rejected, totalRevenue, monthRevenue, todayCount, weekCount };
  }, [payments]);

  const pendingPayments = useMemo(
    () => (payments || []).filter(p => p.status === 'pending'),
    [payments]
  );

  // Bulk approve
  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      const list = (payments || []).filter(p => ids.includes(p.id) && p.status === 'pending');
      let success = 0, failed = 0;
      for (const p of list) {
        try {
          const { error: payErr } = await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', p.id);
          if (payErr) throw payErr;
          let months = 1;
          if (String(p.plan).includes('৬')) months = 6;
          else if (String(p.plan).includes('১ বছর')) months = 12;
          const subEnd = new Date();
          subEnd.setMonth(subEnd.getMonth() + months);
          const { error: profErr } = await supabase.from('profiles').update({
            account_type: 'pro',
            subscription_start: new Date().toISOString(),
            subscription_end: subEnd.toISOString(),
            payment_status: 'paid',
          }).eq('user_id', p.user_id);
          if (profErr) throw profErr;
          success++;
          await logAdminAction('payment_approved', 'payment_request', {
            entity_id: p.id, target_user_id: p.user_id,
            details: { amount: p.amount, plan: p.plan, mode: 'bulk' },
          });
        } catch { failed++; }
      }
      return { success, failed };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin_payments'] });
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      qc.invalidateQueries({ queryKey: ['admin_users_full'] });
      toast.success(`${r.success} টি অনুমোদিত${r.failed ? `, ${r.failed} টি ব্যর্থ` : ''}`);
      setSelectedIds(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Bulk reject
  const bulkReject = useMutation({
    mutationFn: async ({ ids, note }: { ids: string[]; note: string }) => {
      const update: Record<string, any> = { status: 'rejected' };
      if (note.trim()) update.admin_note = note.trim();
      const { error } = await supabase.from('payment_requests').update(update).in('id', ids);
      if (error) throw error;
      await logAdminAction('payment_rejected', 'payment_request', {
        details: { count: ids.length, ids: ids.slice(0, 50), note: note.trim() || null, mode: 'bulk' },
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin_payments'] });
      toast.success(`${vars.ids.length} টি প্রত্যাখ্যাত`);
      setBulkRejectOpen(false); setBulkRejectNote(''); setSelectedIds(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Manual plan assignment
  // - Admin: applies directly to profile
  // - Moderator: creates an admin_request that, once approved by an admin, auto-applies
  const assignPlanMut = useMutation({
    mutationFn: async ({ user_id, plan }: { user_id: string; plan: '1m' | '6m' | '1y' | 'lifetime' }) => {
      const planLabel = plan === 'lifetime' ? 'লাইফটাইম' : plan === '1m' ? '১ মাস' : plan === '6m' ? '৬ মাস' : '১ বছর';
      const months = plan === '1m' ? 1 : plan === '6m' ? 6 : plan === '1y' ? 12 : 0;
      const lifetime = plan === 'lifetime';

      // Moderator path → admin_request flow
      if (!isAdmin && isModerator) {
        if (!user) throw new Error('লগইন প্রয়োজন');
        const target = (profiles || []).find((p: any) => p.user_id === user_id);
        const displayName = target?.display_name || emailByUser.get(user_id) || user_id.slice(0, 8);
        const { error: reqErr } = await supabase.from('admin_requests').insert({
          requester_id: user.id,
          request_type: 'manual_pro_grant',
          title: `ম্যানুয়াল প্রো প্ল্যান (${planLabel}) — ${displayName}`,
          description: `মডারেটর ম্যানুয়ালি ${planLabel} প্রো প্ল্যান সক্রিয় করার অনুরোধ করেছেন। অ্যাডমিন অনুমোদন করলে স্বয়ংক্রিয়ভাবে কার্যকর হবে।`,
          target_user_id: user_id,
          priority: 'high',
          meta: { target_user_id: user_id, months, lifetime },
        });
        if (reqErr) throw reqErr;

        await supabase.from('user_notifications').insert({
          user_id,
          type: 'pro_grant_requested',
          title: '⏳ প্রো প্ল্যান অনুমোদনের অপেক্ষায়',
          body: `একজন মডারেটর আপনার অ্যাকাউন্টে ${planLabel} প্রো প্ল্যান সক্রিয় করার জন্য অ্যাডমিনকে অনুরোধ পাঠিয়েছেন। অ্যাডমিন অনুমোদন করলে প্ল্যানটি কার্যকর হবে এবং আপনি আরেকটি নোটিফিকেশন পাবেন।`,
          link: '/subscription',
          meta: { months, lifetime },
        });
        return { mode: 'request' as const };
      }

      // Admin path → direct apply
      const subStart = new Date();
      const subEnd = new Date();
      if (plan === '1m') subEnd.setMonth(subEnd.getMonth() + 1);
      else if (plan === '6m') subEnd.setMonth(subEnd.getMonth() + 6);
      else if (plan === '1y') subEnd.setFullYear(subEnd.getFullYear() + 1);
      else subEnd.setFullYear(2099, 11, 31);

      const { error } = await supabase.from('profiles').update({
        account_type: 'pro',
        subscription_start: subStart.toISOString(),
        subscription_end: subEnd.toISOString(),
        payment_status: 'paid',
      }).eq('user_id', user_id);
      if (error) throw error;

      await logAdminAction('plan_assigned', 'profile', {
        target_user_id: user_id,
        details: { plan, subscription_end: subEnd.toISOString() },
      });
      return { mode: 'applied' as const };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin_users_full'] });
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      qc.invalidateQueries({ queryKey: ['admin_requests'] });
      toast.success(r?.mode === 'request' ? 'অ্যাডমিনের কাছে রিকোয়েস্ট পাঠানো হয়েছে' : 'প্ল্যান অ্যাসাইন হয়েছে');
      setAssignOpen(false); setAssignUser(null); setAssignSearch('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete payment requests (single / bulk / all-test)
  const deletePayments = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return { count: 0 };
      const { error } = await supabase.from('payment_requests').delete().in('id', ids);
      if (error) throw error;
      await logAdminAction('payment_deleted', 'payment_request', {
        details: { count: ids.length, ids: ids.slice(0, 50) },
      });
      return { count: ids.length };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin_payments'] });
      toast.success(`${r.count} টি পেমেন্ট ডিলিট হয়েছে`);
      setDeleteConfirm(null);
      setSelectedIds(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });


  const exportCsv = () => {
    const list = payments || [];
    if (!list.length) { toast.error('কোনো পেমেন্ট নেই'); return; }
    const headers = ['id', 'created_at', 'user_id', 'name', 'email', 'plan', 'amount', 'method', 'transaction_id', 'status', 'admin_note'];
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const lines = [headers.join(',')];
    for (const p of list) {
      const prof: any = profileMap.get(p.user_id);
      const vals = [
        p.id, p.created_at, p.user_id,
        prof?.display_name || '',
        emailByUser.get(p.user_id) || '',
        p.plan, p.amount, p.payment_method, p.transaction_id, p.status,
        (p.admin_note || '').replace(/[\r\n]+/g, ' '),
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`);
      lines.push(vals.join(','));
    }
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV এক্সপোর্ট হয়েছে');
  };

  const toggleAll = () => {
    if (pendingPayments.every(p => selectedIds.has(p.id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(pendingPayments.map(p => p.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  // Search users for assign dialog
  const userSearchResults = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return (profiles || []).filter(p => {
      const email = (emailByUser.get(p.user_id) || '').toLowerCase();
      const name = (p.display_name || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return email.includes(q) || name.includes(q) || phone.includes(q);
    }).slice(0, 8);
  }, [assignSearch, profiles, emailByUser]);

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBox icon={<Clock className="h-4 w-4" />} label="অপেক্ষমাণ" value={stats.pending} accent="warning" />
        <StatBox icon={<CheckCircle2 className="h-4 w-4" />} label="অনুমোদিত" value={stats.approved} accent="success" />
        <StatBox icon={<XCircle className="h-4 w-4" />} label="প্রত্যাখ্যাত" value={stats.rejected} accent="destructive" />
        <StatBox icon={<TrendingUp className="h-4 w-4" />} label="মোট" value={stats.total} accent="muted" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatBox icon={<Wallet className="h-4 w-4" />} label="মোট আয় (অনুমোদিত)" value={`৳${stats.totalRevenue.toLocaleString()}`} accent="primary" />
        <StatBox icon={<Wallet className="h-4 w-4" />} label="এই মাসের আয়" value={`৳${stats.monthRevenue.toLocaleString()}`} accent="primary" />
        <StatBox icon={<Clock className="h-4 w-4" />} label="আজ / ৭ দিন" value={`${stats.todayCount} / ${stats.weekCount}`} accent="muted" />
      </div>

      {/* Action toolbar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            {isAdmin ? 'ম্যানুয়ালি প্ল্যান দিন' : 'প্ল্যানের জন্য রিকোয়েস্ট করুন'}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5 mr-1" /> CSV এক্সপোর্ট
          </Button>
          {(() => {
            const adminPayments = (payments || []).filter(p => adminUserIds.has(p.user_id));
            if (adminPayments.length === 0) return null;
            return (
              <Button size="sm" variant="destructive"
                onClick={() => setDeleteConfirm({ ids: adminPayments.map(p => p.id), mode: 'all_test' })}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> অ্যাডমিন/মডের টেস্ট পেমেন্ট মুছুন ({adminPayments.length})
              </Button>
            );
          })()}
          {stats.pending > 5 && (
            <Badge variant="outline" className="gap-1 text-yellow-700 border-yellow-500/40">
              <AlertTriangle className="h-3 w-3" /> {stats.pending} টি অপেক্ষমাণ
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Bulk panel for pending */}
      {pendingPayments.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">অপেক্ষমাণ পেমেন্ট — বাল্ক অ্যাকশন</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={pendingPayments.length > 0 && pendingPayments.every(p => selectedIds.has(p.id))}
                onCheckedChange={toggleAll}
              />
              <span className="text-xs text-muted-foreground">সব অপেক্ষমাণ নির্বাচন ({pendingPayments.length})</span>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-primary/5">
                <span className="text-xs font-medium self-center">নির্বাচিত: {selectedIds.size}</span>
                <Button size="sm" className="bg-success hover:bg-success/90"
                  disabled={bulkApprove.isPending}
                  onClick={() => bulkApprove.mutate(Array.from(selectedIds))}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> সব অনুমোদন
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setBulkRejectOpen(true)}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> সব প্রত্যাখ্যান
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>বাতিল</Button>
              </div>
            )}

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {pendingPayments.map(p => {
                const prof: any = (profiles || []).find(x => x.user_id === p.user_id);
                return (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-xs">
                    <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                    <span className="flex-1 truncate">{prof?.display_name || emailByUser.get(p.user_id) || p.user_id.slice(0, 8)}</span>
                    <span className="text-muted-foreground">{p.plan}</span>
                    <span className="font-medium">৳{p.amount}</span>
                    <span className="text-muted-foreground">{format(new Date(p.created_at), 'dd MMM')}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All payments list with delete */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">সব পেমেন্ট ({(payments || []).length})</CardTitle>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
              <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
              <SelectItem value="approved">অনুমোদিত</SelectItem>
              <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-1 max-h-96 overflow-y-auto">
          {(payments || [])
            .filter(p => statusFilter === 'all' || p.status === statusFilter)
            .map(p => {
              const prof: any = (profiles || []).find(x => x.user_id === p.user_id);
              const isAdminPayment = adminUserIds.has(p.user_id);
              return (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-xs border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{prof?.display_name || emailByUser.get(p.user_id) || p.user_id.slice(0, 8)}</span>
                      {isAdminPayment && <Badge variant="outline" className="text-[9px] py-0 h-4 border-destructive/40 text-destructive">টেস্ট</Badge>}
                    </div>
                    <div className="text-muted-foreground text-[10px]">{p.plan} • ৳{p.amount} • {p.payment_method} • {format(new Date(p.created_at), 'dd MMM yy')}</div>
                  </div>
                  <Badge variant="outline" className={
                    p.status === 'approved' ? 'border-success/40 text-success' :
                    p.status === 'rejected' ? 'border-destructive/40 text-destructive' :
                    'border-yellow-500/40 text-yellow-700'
                  }>{p.status}</Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirm({ ids: [p.id], mode: 'single' })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          {(payments || []).filter(p => statusFilter === 'all' || p.status === statusFilter).length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">কোনো পেমেন্ট নেই</p>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পেমেন্ট ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.mode === 'all_test'
                ? `অ্যাডমিন/মডারেটর অ্যাকাউন্ট থেকে করা ${deleteConfirm.ids.length} টি টেস্ট পেমেন্ট স্থায়ীভাবে মুছে যাবে। এটি রিভেনিউ স্ট্যাট থেকেও বাদ পড়বে।`
                : `${deleteConfirm?.ids.length || 0} টি পেমেন্ট রিকোয়েস্ট স্থায়ীভাবে ডিলিট হবে। এই কাজটি ফিরিয়ে আনা যাবে না।`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePayments.isPending}
              onClick={() => deleteConfirm && deletePayments.mutate(deleteConfirm.ids)}>
              {deletePayments.isPending ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Dialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>বাল্ক প্রত্যাখ্যান ({selectedIds.size} টি)</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>প্রত্যাখ্যানের কারণ (ইউজাররা দেখতে পাবেন)</Label>
            <Textarea rows={3} value={bulkRejectNote} onChange={e => setBulkRejectNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectOpen(false)}>বাতিল</Button>
            <Button variant="destructive" disabled={bulkReject.isPending}
              onClick={() => bulkReject.mutate({ ids: Array.from(selectedIds), note: bulkRejectNote })}>
              {bulkReject.isPending ? 'প্রসেস হচ্ছে...' : 'প্রত্যাখ্যান করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ম্যানুয়ালি প্রো প্ল্যান অ্যাসাইন</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>ইউজার খুঁজুন (নাম/ইমেইল/ফোন)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={assignSearch} onChange={e => { setAssignSearch(e.target.value); setAssignUser(null); }} placeholder="কমপক্ষে ২ অক্ষর..." />
              </div>
              {!assignUser && userSearchResults.length > 0 && (
                <div className="border rounded-lg max-h-44 overflow-y-auto">
                  {userSearchResults.map(u => (
                    <button key={u.user_id} type="button" className="w-full text-left p-2 hover:bg-muted text-xs flex justify-between gap-2"
                      onClick={() => { setAssignUser({ user_id: u.user_id, name: u.display_name || emailByUser.get(u.user_id) || '' }); setAssignSearch(u.display_name || ''); }}>
                      <span className="truncate">{u.display_name || 'নামহীন'}</span>
                      <span className="text-muted-foreground truncate">{emailByUser.get(u.user_id)}</span>
                    </button>
                  ))}
                </div>
              )}
              {assignUser && (
                <p className="text-xs p-2 bg-primary/10 rounded">নির্বাচিত: <strong>{assignUser.name}</strong></p>
              )}
            </div>
            <div className="space-y-2">
              <Label>প্ল্যান সময়সীমা</Label>
              <Select value={assignPlan} onValueChange={(v: any) => setAssignPlan(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">১ মাস</SelectItem>
                  <SelectItem value="6m">৬ মাস</SelectItem>
                  <SelectItem value="1y">১ বছর</SelectItem>
                  <SelectItem value="lifetime">লাইফটাইম ♾</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>বাতিল</Button>
            <Button disabled={!assignUser || assignPlanMut.isPending}
              onClick={() => assignUser && assignPlanMut.mutate({ user_id: assignUser.user_id, plan: assignPlan })}>
              {assignPlanMut.isPending ? 'অ্যাসাইন হচ্ছে...' : 'অ্যাসাইন করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: any; accent: 'success' | 'warning' | 'destructive' | 'primary' | 'muted' }) {
  const cls =
    accent === 'success' ? 'bg-success/10 text-success border-success/20' :
    accent === 'warning' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' :
    accent === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' :
    accent === 'primary' ? 'bg-primary/10 text-primary border-primary/20' :
    'bg-muted/40 text-foreground border-border';
  return (
    <div className={`rounded-lg border p-2.5 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[11px] opacity-80">{icon}<span>{label}</span></div>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
