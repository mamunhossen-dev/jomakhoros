import { useState, useMemo } from 'react';
import { Bell, Plus, Pencil, Trash2, AlertTriangle, Megaphone, Info, Eye, Calendar, Link as LinkIcon, BookmarkPlus, FileText, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logAdminAction } from '@/components/admin/AuditLogViewer';
import { format } from 'date-fns';

type Kind = 'normal' | 'emergency' | 'banner';

const KIND_LABELS: Record<Kind, { label: string; icon: any; cls: string }> = {
  normal: { label: 'সাধারণ', icon: Megaphone, cls: 'bg-muted text-foreground' },
  emergency: { label: 'ইমার্জেন্সি', icon: AlertTriangle, cls: 'bg-destructive/15 text-destructive' },
  banner: { label: 'টপ ব্যানার', icon: Info, cls: 'bg-primary/15 text-primary' },
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (s: string) => (s ? new Date(s).toISOString() : null);

export function GlobalAnnouncementManager() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<Kind>('normal');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState(0);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Templates state
  const [tplOpen, setTplOpen] = useState(false);
  const [tplName, setTplName] = useState('');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin_notifications_full'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Total user count for read-stats denominator
  const { data: userCount = 0 } = useQuery({
    queryKey: ['admin_user_count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Aggregate read counts per notification
  const { data: reads = [] } = useQuery({
    queryKey: ['admin_notification_reads_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_reads').select('notification_id');
      if (error) throw error;
      return data as { notification_id: string }[];
    },
  });

  const readMap = useMemo(() => {
    const m = new Map<string, number>();
    reads.forEach(r => m.set(r.notification_id, (m.get(r.notification_id) || 0) + 1));
    return m;
  }, [reads]);

  // Templates
  const { data: templates = [] } = useQuery({
    queryKey: ['notification_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_templates' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const reset = () => {
    setEditingId(null); setTitle(''); setBody(''); setKind('normal');
    setLink(''); setPriority(0); setStartsAt(''); setExpiresAt('');
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !body.trim()) throw new Error('শিরোনাম ও বার্তা প্রয়োজন');
      const payload: any = {
        title: title.trim(),
        body: body.trim(),
        kind,
        link: link.trim() || null,
        priority,
        starts_at: fromLocalInput(startsAt),
        expires_at: fromLocalInput(expiresAt),
      };
      if (editingId) {
        const { error } = await supabase.from('notifications').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notifications').insert({ ...payload, created_by: user?.id, is_active: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_notifications_full'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(editingId ? 'আপডেট হয়েছে' : 'ঘোষণা প্রকাশিত হয়েছে');
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'is_active' | 'is_default'; value: boolean }) => {
      const { error } = await supabase.from('notifications').update({ [field]: value }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_notifications_full'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_notifications_full'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('মুছে ফেলা হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (n: any) => {
    setEditingId(n.id);
    setTitle(n.title); setBody(n.body);
    setKind((n.kind as Kind) || 'normal');
    setLink(n.link || ''); setPriority(n.priority || 0);
    setStartsAt(toLocalInput(n.starts_at));
    setExpiresAt(toLocalInput(n.expires_at));
  };

  // Template ops
  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!tplName.trim() || !title.trim() || !body.trim()) throw new Error('টেমপ্লেট নাম, শিরোনাম ও বার্তা দিন');
      const { error } = await supabase.from('notification_templates' as any).insert({
        name: tplName.trim(), title: title.trim(), body: body.trim(), kind, link: link.trim() || null, created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification_templates'] });
      setTplOpen(false); setTplName('');
      toast.success('টেমপ্লেট সংরক্ষণ হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification_templates'] });
      toast.success('মুছে ফেলা হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const useTemplate = (t: any) => {
    setTitle(t.title); setBody(t.body);
    setKind((t.kind as Kind) || 'normal'); setLink(t.link || '');
    toast.info(`টেমপ্লেট লোড: ${t.name}`);
  };

  const isExpired = (n: any) => n.expires_at && new Date(n.expires_at) < new Date();
  const isScheduled = (n: any) => n.starts_at && new Date(n.starts_at) > new Date();

  return (
    <Tabs defaultValue="manage" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="manage"><Bell className="mr-1 h-3.5 w-3.5" />ম্যানেজ</TabsTrigger>
        <TabsTrigger value="templates"><FileText className="mr-1 h-3.5 w-3.5" />টেমপ্লেট ({templates.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="manage">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Composer */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'ঘোষণা এডিট' : 'নতুন ঘোষণা'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">ধরন</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KIND_LABELS) as Kind[]).map(k => {
                        const Icon = KIND_LABELS[k].icon;
                        return (
                          <SelectItem key={k} value={k}>
                            <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{KIND_LABELS[k].label}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">অগ্রাধিকার (০-১০)</Label>
                  <Input type="number" min={0} max={10} value={priority} onChange={e => setPriority(Number(e.target.value) || 0)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">শিরোনাম</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="সংক্ষিপ্ত শিরোনাম" maxLength={120} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">বার্তা</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="পূর্ণ বার্তা..." rows={5} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3" />লিঙ্ক (ঐচ্ছিক)</Label>
                <Input value={link} onChange={e => setLink(e.target.value)} placeholder="/subscription" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />শুরু</Label>
                  <Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />শেষ</Label>
                  <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">শুরু/শেষ ফাঁকা = সাথে সাথে ও অনির্দিষ্ট সময় পর্যন্ত সক্রিয়।</p>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1">
                  {editingId ? 'আপডেট' : 'প্রকাশ করুন'}
                </Button>
                <Dialog open={tplOpen} onOpenChange={setTplOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="টেমপ্লেট হিসেবে সংরক্ষণ" disabled={!title.trim() || !body.trim()}>
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>টেমপ্লেট হিসেবে সংরক্ষণ</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">টেমপ্লেট নাম</Label>
                        <Input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="যেমন: সার্ভার মেইনটেনেন্স" />
                      </div>
                      <Button onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending} className="w-full">
                        <Save className="mr-1 h-3.5 w-3.5" /> সংরক্ষণ
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {editingId && <Button variant="outline" onClick={reset}><X className="h-3.5 w-3.5" /></Button>}
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">সব ঘোষণা ({notifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
              ) : !notifications.length ? (
                <p className="text-center py-6 text-sm text-muted-foreground">কোনো ঘোষণা নেই</p>
              ) : (
                <ScrollArea className="h-[500px] pr-2">
                  <div className="space-y-2">
                    {notifications.map(n => {
                      const k = (n.kind as Kind) || 'normal';
                      const Icon = KIND_LABELS[k].icon;
                      const readCount = readMap.get(n.id) || 0;
                      const pct = userCount ? Math.round((readCount / userCount) * 100) : 0;
                      const expired = isExpired(n);
                      const scheduled = isScheduled(n);
                      return (
                        <div key={n.id} className={`rounded-lg border p-3 ${expired ? 'opacity-60' : ''}`}>
                          <div className="flex items-start gap-2">
                            <div className={`rounded-md p-1.5 ${KIND_LABELS[k].cls}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <p className="text-sm font-medium truncate">{n.title}</p>
                                {n.is_default && <Badge variant="outline" className="text-[9px]">ডিফল্ট</Badge>}
                                {expired && <Badge variant="destructive" className="text-[9px]">মেয়াদ শেষ</Badge>}
                                {scheduled && <Badge className="text-[9px] bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">নির্ধারিত</Badge>}
                                {n.priority > 0 && <Badge className="text-[9px]">P{n.priority}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{readCount}/{userCount} ({pct}%)</span>
                                {n.starts_at && <span>শুরু: {format(new Date(n.starts_at), 'dd MMM HH:mm')}</span>}
                                {n.expires_at && <span>শেষ: {format(new Date(n.expires_at), 'dd MMM HH:mm')}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Switch checked={n.is_active} onCheckedChange={(v) => toggle.mutate({ id: n.id, field: 'is_active', value: v })} />
                              <span className="text-xs text-muted-foreground">{n.is_active ? 'সক্রিয়' : 'বন্ধ'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant={n.is_default ? 'default' : 'outline'}
                                size="sm" className="h-7 text-[11px] px-2"
                                onClick={() => toggle.mutate({ id: n.id, field: 'is_default', value: !n.is_default })}
                                title="নতুন ইউজাররা এটি স্বয়ংক্রিয়ভাবে পাবে"
                              >
                                {n.is_default ? '✓ ডিফল্ট' : 'ডিফল্ট'}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(n)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(n.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="templates">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">সংরক্ষিত টেমপ্লেট</CardTitle>
          </CardHeader>
          <CardContent>
            {!templates.length ? (
              <p className="text-center py-6 text-sm text-muted-foreground">
                কোনো টেমপ্লেট নেই। নতুন ঘোষণা লিখে <BookmarkPlus className="inline h-3 w-3" /> বাটনে ক্লিক করে সংরক্ষণ করুন।
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((t: any) => {
                  const k = (t.kind as Kind) || 'normal';
                  const Icon = KIND_LABELS[k].icon;
                  return (
                    <div key={t.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className={`rounded-md p-1.5 ${KIND_LABELS[k].cls}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{t.name}</p>
                          <p className="text-xs font-medium truncate">{t.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{t.body}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px]" onClick={() => useTemplate(t)}>
                          ব্যবহার করুন
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
