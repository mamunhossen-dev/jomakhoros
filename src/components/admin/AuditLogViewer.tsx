import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Search, Download, Eye, RefreshCw, Activity, User, AlertTriangle, X, Crown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

type AuditLog = {
  id: string;
  actor_id: string;
  actor_email: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  target_user_id: string | null;
  details: any;
  created_at: string;
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  user_blocked: { label: '🚫 ইউজার ব্লক', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  user_unblocked: { label: '✅ ইউজার আনব্লক', color: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  user_deleted: { label: '🗑️ ইউজার ডিলিট', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  payment_approved: { label: '💰 পেমেন্ট অনুমোদন', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  payment_rejected: { label: '❌ পেমেন্ট প্রত্যাখ্যান', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  plan_assigned: { label: '⭐ ম্যানুয়াল প্ল্যান', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  notification_sent: { label: '🔔 নোটিফিকেশন', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  announcement_created: { label: '📢 ঘোষণা তৈরি', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  settings_updated: { label: '⚙️ সেটিংস আপডেট', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-400' },
  role_changed: { label: '👑 রোল পরিবর্তন', color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400' },
  support_replied: { label: '💬 সাপোর্ট রিপ্লাই', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
};

const getActionMeta = (action: string) =>
  ACTION_LABELS[action] || { label: action, color: 'bg-muted text-muted-foreground' };

export function AuditLogViewer() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('30');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['admin_audit_logs', dayFilter],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - Number(dayFilter));
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as AuditLog[];
    },
    refetchInterval: 30000,
  });

  // All admins/moderators (so dropdown shows them even with zero logs in range)
  const { data: staffRoles = [] } = useQuery({
    queryKey: ['audit_staff_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, email, user_name, role')
        .in('role', ['admin', 'moderator']);
      if (error) throw error;
      return data as { user_id: string; email: string | null; user_name: string | null; role: 'admin' | 'moderator' }[];
    },
  });

  // Merge: staff roles + any actor that appears in logs (covers ex-staff)
  const actors = useMemo(() => {
    const map = new Map<string, { name: string; role: 'admin' | 'moderator' | 'former' }>();
    staffRoles.forEach(r => {
      map.set(r.user_id, {
        name: r.user_name || r.email || r.user_id.slice(0, 8),
        role: r.role,
      });
    });
    logs.forEach(l => {
      if (l.actor_id && !map.has(l.actor_id)) {
        map.set(l.actor_id, {
          name: l.actor_name || l.actor_email || l.actor_id.slice(0, 8),
          role: 'former',
        });
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [logs, staffRoles]);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.action)));
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(l => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (actorFilter !== 'all' && l.actor_id !== actorFilter) return false;
      if (q) {
        const hay = [
          l.action, l.entity_type, l.entity_id, l.actor_email, l.actor_name,
          JSON.stringify(l.details || {})
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, actionFilter, actorFilter]);

  const exportCSV = () => {
    const headers = ['তারিখ', 'অ্যাডমিন', 'ইমেইল', 'অ্যাকশন', 'এন্টিটি', 'এন্টিটি ID', 'টার্গেট ইউজার', 'বিস্তারিত'];
    const rows = filtered.map(l => [
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm:ss'),
      l.actor_name || '',
      l.actor_email || '',
      l.action,
      l.entity_type,
      l.entity_id || '',
      l.target_user_id || '',
      JSON.stringify(l.details || {}),
    ]);
    const csv = [headers, ...rows].map(r =>
      r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} টি লগ এক্সপোর্ট হয়েছে`);
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return {
      total: logs.length,
      today: logs.filter(l => new Date(l.created_at) >= today).length,
      uniqueActors: actors.length,
      criticalActions: logs.filter(l =>
        ['user_deleted', 'user_blocked', 'role_changed'].includes(l.action)
      ).length,
    };
  }, [logs, actors]);

  // Focused actor summary
  const focusedActor = useMemo(() => {
    if (actorFilter === 'all') return null;
    const info = actors.find(([id]) => id === actorFilter)?.[1];
    const myLogs = logs.filter(l => l.actor_id === actorFilter);
    if (myLogs.length === 0) return { info, total: 0, byAction: [], lastAt: null as string | null };
    const counts = new Map<string, number>();
    myLogs.forEach(l => counts.set(l.action, (counts.get(l.action) || 0) + 1));
    const byAction = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return { info, total: myLogs.length, byAction, lastAt: myLogs[0]?.created_at || null };
  }, [actorFilter, actors, logs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold">অডিট লগ</h2>
          <p className="text-xs text-muted-foreground">অ্যাডমিন ও মডারেটরদের সব কাজের রেকর্ড</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">মোট লগ</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">আজকের কাজ</p>
              <p className="text-lg font-bold">{stats.today}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">সক্রিয় অ্যাডমিন</p>
              <p className="text-lg font-bold">{stats.uniqueActors}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">গুরুত্বপূর্ণ কাজ</p>
              <p className="text-lg font-bold">{stats.criticalActions}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="অ্যাকশন, ইমেইল, ID খুঁজুন..."
                className="pl-8"
              />
            </div>
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">আজ</SelectItem>
                <SelectItem value="7">৭ দিন</SelectItem>
                <SelectItem value="30">৩০ দিন</SelectItem>
                <SelectItem value="90">৯০ দিন</SelectItem>
                <SelectItem value="365">১ বছর</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="অ্যাকশন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব অ্যাকশন</SelectItem>
                {actions.map(a => (
                  <SelectItem key={a} value={a}>{getActionMeta(a).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="অ্যাডমিন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব অ্যাডমিন</SelectItem>
                {actors.map(([id, info]) => (
                  <SelectItem key={id} value={id}>
                    <span className="flex items-center gap-1.5">
                      {info.role === 'admin' && <Crown className="h-3 w-3 text-amber-500" />}
                      {info.role === 'moderator' && <Shield className="h-3 w-3 text-blue-500" />}
                      {info.role === 'former' && <span className="text-muted-foreground text-[10px]">⊘</span>}
                      <span className="truncate">{info.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} / {logs.length} লগ দেখানো হচ্ছে
          </p>
        </CardContent>
      </Card>

      {/* Log list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">কার্যকলাপ ইতিহাস</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                কোনো লগ পাওয়া যায়নি
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map(log => {
                  const meta = getActionMeta(log.action);
                  return (
                    <button
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={meta.color} variant="secondary">{meta.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ''}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate">
                            {log.actor_name || log.actor_email || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: bn })}
                            {' · '}
                            {format(new Date(log.created_at), 'd MMM yyyy, HH:mm', { locale: bn })}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>লগ বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-muted-foreground">অ্যাকশন</p><p className="font-medium">{getActionMeta(selected.action).label}</p></div>
                <div><p className="text-xs text-muted-foreground">এন্টিটি টাইপ</p><p className="font-medium">{selected.entity_type}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">অ্যাডমিন</p><p className="font-medium">{selected.actor_name || '—'} ({selected.actor_email || '—'})</p></div>
                {selected.entity_id && <div className="col-span-2"><p className="text-xs text-muted-foreground">এন্টিটি ID</p><p className="font-mono text-xs break-all">{selected.entity_id}</p></div>}
                {selected.target_user_id && <div className="col-span-2"><p className="text-xs text-muted-foreground">টার্গেট ইউজার</p><p className="font-mono text-xs break-all">{selected.target_user_id}</p></div>}
                <div className="col-span-2"><p className="text-xs text-muted-foreground">সময়</p><p>{format(new Date(selected.created_at), 'd MMM yyyy, HH:mm:ss', { locale: bn })}</p></div>
              </div>
              {selected.details && Object.keys(selected.details).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">অতিরিক্ত তথ্য</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper to log admin actions from anywhere in the app
export async function logAdminAction(
  action: string,
  entity_type: string,
  options?: {
    entity_id?: string;
    target_user_id?: string;
    details?: Record<string, any>;
  }
) {
  try {
    await supabase.rpc('log_admin_action', {
      _action: action,
      _entity_type: entity_type,
      _entity_id: options?.entity_id ?? null,
      _target_user_id: options?.target_user_id ?? null,
      _details: (options?.details ?? {}) as any,
    });
  } catch (e) {
    console.error('audit log failed', e);
  }
}
