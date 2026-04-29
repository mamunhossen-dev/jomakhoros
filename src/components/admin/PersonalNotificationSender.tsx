import { useState, useMemo } from 'react';
import { Send, Search, X, Users, User as UserIcon, AlertCircle, Info, CheckCircle2, Megaphone, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAdminAction } from '@/components/admin/AuditLogViewer';

type Profile = {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  account_type: string;
  is_blocked: boolean;
  subscription_end: string | null;
  trial_end_date: string | null;
};

type RoleRow = { user_id: string; email: string | null };

type Mode = 'specific' | 'multi' | 'group';
type Group = 'all' | 'trial' | 'free' | 'pro' | 'blocked' | 'expiring';
type NotifType = 'announcement' | 'info' | 'success' | 'warning';

const TYPE_OPTIONS: { value: NotifType; label: string; icon: any }[] = [
  { value: 'announcement', label: 'ঘোষণা', icon: Megaphone },
  { value: 'info', label: 'তথ্য', icon: Info },
  { value: 'success', label: 'সফল', icon: CheckCircle2 },
  { value: 'warning', label: 'সতর্কতা', icon: AlertCircle },
];

const GROUP_LABELS: Record<Group, string> = {
  all: 'সব ইউজার',
  trial: 'Trial ইউজার',
  free: 'Free ইউজার',
  pro: 'Pro ইউজার',
  blocked: 'ব্লকড ইউজার',
  expiring: '৭ দিনে মেয়াদ শেষ',
};

export function PersonalNotificationSender() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>('specific');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [group, setGroup] = useState<Group>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState<NotifType>('announcement');

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin_all_profiles_compact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone, account_type, is_blocked, subscription_end, trial_end_date')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['admin_roles_for_email'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, email');
      if (error) throw error;
      return data as RoleRow[];
    },
  });

  const emailByUser = useMemo(() => {
    const m = new Map<string, string>();
    roles.forEach(r => { if (r.email) m.set(r.user_id, r.email); });
    return m;
  }, [roles]);

  const filteredProfiles = useMemo(() => {
    if (!search.trim()) return profiles.slice(0, 50);
    const s = search.toLowerCase();
    return profiles
      .filter(p =>
        (p.display_name || '').toLowerCase().includes(s) ||
        (p.phone || '').toLowerCase().includes(s) ||
        (emailByUser.get(p.user_id) || '').toLowerCase().includes(s) ||
        p.user_id.toLowerCase().includes(s)
      )
      .slice(0, 50);
  }, [profiles, search, emailByUser]);

  const targetUsersForGroup = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return profiles.filter(p => {
      switch (group) {
        case 'all': return true;
        case 'trial': return p.account_type === 'trial' && !p.is_blocked;
        case 'free': return p.account_type === 'free' && !p.is_blocked;
        case 'pro': return p.account_type === 'pro' && !p.is_blocked;
        case 'blocked': return p.is_blocked;
        case 'expiring': {
          const end = p.subscription_end || p.trial_end_date;
          if (!end) return false;
          const diff = new Date(end).getTime() - now;
          return diff > 0 && diff <= sevenDaysMs;
        }
      }
    });
  }, [profiles, group]);

  const targetCount = mode === 'specific'
    ? (selected.size === 1 ? 1 : 0)
    : mode === 'multi'
      ? selected.size
      : targetUsersForGroup.length;

  const send = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !body.trim()) throw new Error('শিরোনাম ও বার্তা প্রয়োজন');
      let targetIds: string[] = [];
      if (mode === 'group') targetIds = targetUsersForGroup.map(p => p.user_id);
      else targetIds = Array.from(selected);
      if (mode === 'specific' && targetIds.length !== 1) throw new Error('একজন ইউজার বেছে নিন');
      if (!targetIds.length) throw new Error('কোনো লক্ষ্য ইউজার নেই');

      const rows = targetIds.map(uid => ({
        user_id: uid,
        type,
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || null,
      }));

      // Insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from('user_notifications').insert(chunk);
        if (error) throw error;
      }
      await logAdminAction('notification_sent', 'user_notifications', {
        target_user_id: targetIds.length === 1 ? targetIds[0] : undefined,
        details: { count: targetIds.length, mode, type, title: title.trim() },
      });
      return targetIds.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} জন ইউজারকে নোটিফিকেশন পাঠানো হয়েছে`);
      setTitle(''); setBody(''); setLink(''); setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['user_notifications'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleUser = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else {
        if (mode === 'specific') next.clear();
        next.add(uid);
      }
      return next;
    });
  };

  const planBadge = (p: Profile) => {
    if (p.is_blocked) return <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Blocked</Badge>;
    const cls = p.account_type === 'pro' ? 'bg-primary text-primary-foreground'
      : p.account_type === 'trial' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
      : 'bg-muted text-muted-foreground';
    return <span className={`text-[9px] px-1.5 py-0.5 rounded ${cls}`}>{p.account_type}</span>;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Composer */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Send className="h-4 w-4" /> ব্যক্তিগত নোটিফিকেশন পাঠান
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setSelected(new Set()); }}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="specific" className="text-xs"><UserIcon className="mr-1 h-3 w-3" />একজন</TabsTrigger>
              <TabsTrigger value="multi" className="text-xs"><Users className="mr-1 h-3 w-3" />একাধিক</TabsTrigger>
              <TabsTrigger value="group" className="text-xs"><Users className="mr-1 h-3 w-3" />গ্রুপ</TabsTrigger>
            </TabsList>

            <TabsContent value="group" className="mt-3">
              <Label className="text-xs">গ্রুপ বেছে নিন</Label>
              <Select value={group} onValueChange={(v) => setGroup(v as Group)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                লক্ষ্য: <span className="font-semibold text-foreground">{targetUsersForGroup.length}</span> জন
              </p>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">টাইপ</Label>
              <Select value={type} onValueChange={(v) => setType(v as NotifType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2"><t.icon className="h-3.5 w-3.5" />{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3" />লিঙ্ক (ঐচ্ছিক)</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="/subscription" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">শিরোনাম</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="সংক্ষিপ্ত শিরোনাম" maxLength={120} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">বার্তা</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="পূর্ণ বার্তা..." rows={6} />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {targetCount > 0 ? <>লক্ষ্য: <span className="font-semibold text-foreground">{targetCount}</span> জন</> : 'কোনো লক্ষ্য নেই'}
            </p>
            <Button onClick={() => send.mutate()} disabled={send.isPending || targetCount === 0}>
              <Send className="mr-1 h-3.5 w-3.5" />
              {send.isPending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User picker */}
      {mode !== 'group' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Search className="h-4 w-4" /> ইউজার বাছাই
              {selected.size > 0 && <Badge>{selected.size} নির্বাচিত</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম, ইমেইল, ফোন বা UID..." className="pl-9" />
              {selected.size > 0 && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7" onClick={() => setSelected(new Set())}>
                  <X className="h-3 w-3 mr-1" />সরান
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px] pr-2">
              {!filteredProfiles.length ? (
                <p className="text-center py-6 text-sm text-muted-foreground">কোনো ইউজার পাওয়া যায়নি</p>
              ) : (
                <div className="space-y-1">
                  {filteredProfiles.map(p => {
                    const isSel = selected.has(p.user_id);
                    return (
                      <button
                        type="button"
                        key={p.user_id}
                        onClick={() => toggleUser(p.user_id)}
                        className={`w-full text-left rounded-lg border p-2 transition-colors flex items-start gap-2 ${isSel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      >
                        {mode === 'multi' && (
                          <Checkbox checked={isSel} className="mt-0.5 pointer-events-none" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{p.display_name || 'নামহীন'}</p>
                            {planBadge(p)}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {emailByUser.get(p.user_id) || p.phone || p.user_id.slice(0, 8)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
