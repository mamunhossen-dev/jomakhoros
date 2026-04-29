import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Send, Inbox, Clock, CheckCircle2, XCircle, AlertTriangle, Trash2, MessageCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const REQUEST_TYPES = [
  { value: 'user_delete', label: '🗑️ ইউজার ডিলিট' },
  { value: 'role_change', label: '👑 রোল পরিবর্তন' },
  { value: 'subscription_change', label: '📅 সাবস্ক্রিপশন এডিট' },
  { value: 'profile_edit', label: '👤 প্রোফাইল এডিট' },
  { value: 'content_remove', label: '🚫 কন্টেন্ট রিমুভ' },
  { value: 'settings_change', label: '⚙️ সিস্টেম সেটিংস পরিবর্তন' },
  { value: 'other', label: '📝 অন্যান্য' },
];

const PRIORITIES = [
  { value: 'low', label: 'নিম্ন', cls: 'bg-muted text-muted-foreground' },
  { value: 'normal', label: 'সাধারণ', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { value: 'high', label: 'উচ্চ', cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  { value: 'urgent', label: 'জরুরি', cls: 'bg-destructive/10 text-destructive' },
];

const STATUSES = [
  { value: 'pending', label: 'অপেক্ষমাণ', icon: Clock, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { value: 'in_progress', label: 'চলমান', icon: Clock, cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { value: 'approved', label: 'অনুমোদিত', icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { value: 'completed', label: 'সম্পন্ন', icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  { value: 'rejected', label: 'প্রত্যাখ্যাত', icon: XCircle, cls: 'bg-destructive/10 text-destructive' },
];

function statusMeta(s: string) {
  return STATUSES.find(x => x.value === s) || STATUSES[0];
}
function priorityMeta(p: string) {
  return PRIORITIES.find(x => x.value === p) || PRIORITIES[1];
}
function typeMeta(t: string) {
  return REQUEST_TYPES.find(x => x.value === t) || REQUEST_TYPES[REQUEST_TYPES.length - 1];
}

export function AdminRequestsPanel() {
  const { user } = useAuth();
  const { isAdmin, isModerator } = useSubscription();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [view, setView] = useState<'inbox' | 'mine'>(isAdmin ? 'inbox' : 'mine');

  // Compose form
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    request_type: 'other',
    title: '',
    description: '',
    target_user_id: '',
    priority: 'normal',
  });

  // Response dialog
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<string>('approved');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin_requests', view, statusFilter, user?.id],
    queryFn: async () => {
      let q = supabase.from('admin_requests').select('*').order('created_at', { ascending: false });
      if (view === 'mine' && user) q = q.eq('requester_id', user.id);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch requester names
  const requesterIds = useMemo(
    () => Array.from(new Set((requests || []).map(r => r.requester_id))),
    [requests]
  );
  const { data: requesterMap } = useQuery({
    queryKey: ['admin_request_requesters', requesterIds],
    queryFn: async () => {
      if (!requesterIds.length) return {};
      const { data } = await supabase
        .from('user_roles')
        .select('user_id, user_name, email, role')
        .in('user_id', requesterIds);
      const m: Record<string, { name: string; role: string }> = {};
      (data || []).forEach(r => {
        m[r.user_id] = { name: r.user_name || r.email || 'Unknown', role: r.role };
      });
      return m;
    },
    enabled: requesterIds.length > 0,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('লগইন প্রয়োজন');
      if (!form.title.trim() || !form.description.trim()) throw new Error('শিরোনাম ও বিস্তারিত আবশ্যক');
      const { error } = await supabase.from('admin_requests').insert({
        requester_id: user.id,
        request_type: form.request_type,
        title: form.title.trim(),
        description: form.description.trim(),
        target_user_id: form.target_user_id.trim() || null,
        priority: form.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('রিকোয়েস্ট পাঠানো হয়েছে');
      setOpen(false);
      setForm({ request_type: 'other', title: '', description: '', target_user_id: '', priority: 'normal' });
      qc.invalidateQueries({ queryKey: ['admin_requests'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const respond = useMutation({
    mutationFn: async () => {
      if (!respondingId || !user) return;
      const { error } = await supabase
        .from('admin_requests')
        .update({
          status: responseStatus,
          admin_response: responseText.trim() || null,
          resolved_by: user.id,
          resolved_at: ['approved', 'rejected', 'completed'].includes(responseStatus) ? new Date().toISOString() : null,
        })
        .eq('id', respondingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('রেসপন্স পাঠানো হয়েছে');
      setRespondingId(null);
      setResponseText('');
      qc.invalidateQueries({ queryKey: ['admin_requests'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('ডিলিট হয়েছে');
      qc.invalidateQueries({ queryKey: ['admin_requests'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, pending: 0, in_progress: 0, approved: 0, completed: 0, rejected: 0 };
    (requests || []).forEach(r => {
      c.all++;
      c[r.status] = (c[r.status] || 0) + 1;
    });
    return c;
  }, [requests]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5 text-primary" />
            অ্যাডমিন রিকোয়েস্ট
          </CardTitle>
          {(isModerator || isAdmin) && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> নতুন রিকোয়েস্ট
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>এডমিনকে রিকোয়েস্ট পাঠান</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>রিকোয়েস্টের ধরন</Label>
                    <Select value={form.request_type} onValueChange={v => setForm(f => ({ ...f, request_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REQUEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>প্রায়োরিটি</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>শিরোনাম *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="যেমন: ইউজার X কে ডিলিট করুন" />
                  </div>
                  <div>
                    <Label>বিস্তারিত কারণ *</Label>
                    <Textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="কেন এই কাজটি দরকার, প্রমাণ/বিবরণ লিখুন..."
                      rows={5}
                    />
                  </div>
                  <div>
                    <Label>সম্পর্কিত ইউজার ID (ঐচ্ছিক)</Label>
                    <Input
                      value={form.target_user_id}
                      onChange={e => setForm(f => ({ ...f, target_user_id: e.target.value }))}
                      placeholder="UUID"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
                  <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                    <Send className="mr-1 h-4 w-4" />
                    {submit.isPending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <Tabs value={view} onValueChange={(v: any) => setView(v)}>
            <TabsList>
              <TabsTrigger value="inbox">📥 ইনবক্স (সবার রিকোয়েস্ট)</TabsTrigger>
              <TabsTrigger value="mine">📤 আমার পাঠানো</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex flex-wrap gap-1.5">
          {[{ value: 'all', label: 'সব' }, ...STATUSES].map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                statusFilter === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
              )}
            >
              {s.label} {counts[s.value] !== undefined && `(${counts[s.value]})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">লোড হচ্ছে...</p>
        ) : !requests?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">কোনো রিকোয়েস্ট নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => {
              const sm = statusMeta(r.status);
              const pm = priorityMeta(r.priority);
              const tm = typeMeta(r.request_type);
              const requester = requesterMap?.[r.requester_id];
              const StatusIcon = sm.icon;
              const isMine = r.requester_id === user?.id;
              const canRespond = isAdmin && !isMine;
              const canDelete = isAdmin || (isMine && r.status === 'pending');

              return (
                <div key={r.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={sm.cls}><StatusIcon className="mr-1 h-3 w-3" />{sm.label}</Badge>
                        <Badge variant="outline" className={pm.cls}>{pm.label}</Badge>
                        <Badge variant="secondary" className="text-xs">{tm.label}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{r.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {requester?.name || 'Unknown'} ({requester?.role || '—'}) ·{' '}
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {canDelete && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (confirm('এই রিকোয়েস্ট ডিলিট করবেন?')) remove.mutate(r.id);
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <p className="text-sm whitespace-pre-wrap text-foreground/90">{r.description}</p>

                  {r.target_user_id && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                      🎯 Target: {r.target_user_id}
                    </p>
                  )}

                  {r.admin_response && (
                    <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                      <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> এডমিনের রেসপন্স
                        {r.resolved_at && (
                          <span className="text-muted-foreground font-normal ml-1">
                            · {format(new Date(r.resolved_at), 'PPp')}
                          </span>
                        )}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{r.admin_response}</p>
                    </div>
                  )}

                  {canRespond && r.status !== 'completed' && r.status !== 'rejected' && (
                    <div className="flex gap-2 pt-1 border-t">
                      <Button
                        size="sm"
                        onClick={() => {
                          setRespondingId(r.id);
                          setResponseStatus('approved');
                          setResponseText(r.admin_response || '');
                        }}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> রেসপন্ড করুন
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Response Dialog */}
        <Dialog open={!!respondingId} onOpenChange={o => !o && setRespondingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>রিকোয়েস্টে রেসপন্স দিন</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>স্ট্যাটাস</Label>
                <Select value={responseStatus} onValueChange={setResponseStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">⏳ চলমান</SelectItem>
                    <SelectItem value="approved">✅ অনুমোদিত</SelectItem>
                    <SelectItem value="completed">🎉 সম্পন্ন</SelectItem>
                    <SelectItem value="rejected">❌ প্রত্যাখ্যাত</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>মন্তব্য / ব্যাখ্যা</Label>
                <Textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="মডারেটরকে কী জানাতে চান..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRespondingId(null)}>বাতিল</Button>
              <Button onClick={() => respond.mutate()} disabled={respond.isPending}>
                <Send className="mr-1 h-4 w-4" /> পাঠান
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
