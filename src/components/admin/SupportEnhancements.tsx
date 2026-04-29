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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Pencil, Trash2, Zap, AlertTriangle, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInHours, formatDistanceToNow } from 'date-fns';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'নিম্ন', normal: 'সাধারণ', high: 'উচ্চ', urgent: 'জরুরি',
};
const PRIORITY_CLASS: Record<Priority, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
};

/* ---------------- Stats ---------------- */
export function SupportStatsBar() {
  const { data: threads } = useQuery({
    queryKey: ['admin_support_threads_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('support_threads').select('id, status, priority, created_at, updated_at');
      if (error) throw error;
      return data as any[];
    },
  });

  const stats = useMemo(() => {
    const list = threads || [];
    const open = list.filter(t => t.status !== 'closed').length;
    const urgent = list.filter(t => t.priority === 'urgent' && t.status !== 'closed').length;
    const stale = list.filter(t => t.status !== 'closed' && differenceInHours(new Date(), new Date(t.updated_at || t.created_at)) > 24).length;
    const closed = list.filter(t => t.status === 'closed').length;
    return { open, urgent, stale, closed, total: list.length };
  }, [threads]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      <StatBox icon={<MessageCircle className="h-4 w-4" />} label="খোলা টিকিট" value={stats.open} accent="primary" />
      <StatBox icon={<AlertTriangle className="h-4 w-4" />} label="জরুরি" value={stats.urgent} accent="destructive" />
      <StatBox icon={<Clock className="h-4 w-4" />} label="২৪ঘ+ অপেক্ষমাণ" value={stats.stale} accent="warning" />
      <StatBox icon={<CheckCircle2 className="h-4 w-4" />} label="বন্ধ করা" value={stats.closed} accent="success" />
    </div>
  );
}

function StatBox({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: any; accent: 'success' | 'warning' | 'destructive' | 'primary' }) {
  const cls =
    accent === 'success' ? 'bg-success/10 text-success border-success/20' :
    accent === 'warning' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' :
    accent === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' :
    'bg-primary/10 text-primary border-primary/20';
  return (
    <div className={`rounded-lg border p-2.5 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[11px] opacity-80">{icon}<span>{label}</span></div>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

/* ---------------- Priority selector for a thread ---------------- */
export function ThreadPriorityBadge({ ticketId, priority }: { ticketId: string; priority: Priority }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: async (p: Priority) => {
      const { error } = await supabase.from('support_threads').update({ priority: p }).eq('ticket_id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_support_threads'] });
      qc.invalidateQueries({ queryKey: ['admin_support_threads_stats'] });
      toast.success('প্রায়োরিটি আপডেট হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Select value={priority} onValueChange={(v: Priority) => update.mutate(v)}>
      <SelectTrigger className={`h-6 px-2 text-[10px] gap-1 border ${PRIORITY_CLASS[priority]}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(['low', 'normal', 'high', 'urgent'] as Priority[]).map(p => (
          <SelectItem key={p} value={p} className="text-xs">{PRIORITY_LABEL[p]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------------- Quick reply popover ---------------- */
export function QuickReplyButton({ onPick }: { onPick: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const { data: templates } = useQuery({
    queryKey: ['support_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('support_templates').select('*').order('category').order('name');
      if (error) throw error;
      return data as any[];
    },
  });

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const t of templates || []) {
      const cat = t.category || 'general';
      (g[cat] ||= []).push(t);
    }
    return g;
  }, [templates]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1">
          <Zap className="h-3.5 w-3.5" /> দ্রুত উত্তর
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2 max-h-80 overflow-y-auto">
        {!templates?.length ? (
          <p className="text-xs text-muted-foreground p-3 text-center">কোনো টেমপ্লেট নেই। সেটিংস থেকে যোগ করুন।</p>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-2">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground px-2 mb-1">{cat}</p>
              {items.map(t => (
                <button key={t.id} type="button"
                  onClick={() => { onPick(t.content); setOpen(false); }}
                  className="w-full text-left p-2 rounded hover:bg-muted text-xs">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-muted-foreground line-clamp-2 mt-0.5">{t.content}</p>
                </button>
              ))}
            </div>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Templates manager (settings panel) ---------------- */
export function SupportTemplatesManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', content: '', category: 'general' });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['support_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('support_templates').select('*').order('category').order('name');
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    if (editing) setForm({ name: editing.name, content: editing.content, category: editing.category });
    else setForm({ name: '', content: '', category: 'general' });
  }, [editing, open]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.content.trim()) throw new Error('নাম ও কন্টেন্ট প্রয়োজন');
      if (editing) {
        const { error } = await supabase.from('support_templates').update({
          name: form.name, content: form.content, category: form.category,
        }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('support_templates').insert({
          name: form.name, content: form.content, category: form.category,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support_templates'] });
      toast.success(editing ? 'টেমপ্লেট আপডেট হয়েছে' : 'টেমপ্লেট যোগ হয়েছে');
      setOpen(false); setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('support_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support_templates'] });
      toast.success('মুছে ফেলা হয়েছে');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">সাপোর্ট কুইক রিপ্লাই টেমপ্লেট</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">সাপোর্ট চ্যাটে এক ক্লিকে ব্যবহারের জন্য।</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> নতুন
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : !templates?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">কোনো টেমপ্লেট নেই</p>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{t.name}</p>
                      <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(t); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del.mutate(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'টেমপ্লেট সম্পাদনা' : 'নতুন টেমপ্লেট'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>নাম</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="যেমন: পেমেন্ট যাচাই হচ্ছে" />
            </div>
            <div className="space-y-2">
              <Label>ক্যাটাগরি</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">সাধারণ</SelectItem>
                  <SelectItem value="greeting">শুভেচ্ছা</SelectItem>
                  <SelectItem value="payment">পেমেন্ট</SelectItem>
                  <SelectItem value="technical">টেকনিক্যাল</SelectItem>
                  <SelectItem value="closing">সমাপ্তি</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>কন্টেন্ট (ইউজারকে যা পাঠানো হবে)</Label>
              <Textarea rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
