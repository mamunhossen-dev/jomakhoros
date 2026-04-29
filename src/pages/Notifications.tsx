import { useState, useEffect, useMemo } from 'react';
import { Copy, CheckCircle2, XCircle, Clock, Megaphone, ExternalLink, Search, Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type FeedItem = {
  id: string;
  rawId: string;
  title: string;
  body: string;
  created_at: string;
  source: 'global' | 'user';
  type?: string;
  link?: string | null;
  is_read: boolean;
};

const typeIcon = (type?: string) => {
  switch (type) {
    case 'payment_approved': return <CheckCircle2 className="h-5 w-5 text-success" />;
    case 'payment_rejected': return <XCircle className="h-5 w-5 text-destructive" />;
    case 'payment_submitted': return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'subscription_reminder': return <Clock className="h-5 w-5 text-yellow-600" />;
    default: return <Megaphone className="h-5 w-5 text-primary" />;
  }
};

export default function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'user' | 'global'>('all');

  const { data: globals } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    placeholderData: [],
  });

  const { data: reads } = useQuery({
    queryKey: ['notification_reads', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data?.map(r => r.notification_id) || [];
    },
    enabled: !!user,
    placeholderData: [],
  });

  const { data: userNotifs } = useQuery({
    queryKey: ['user_notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, type, title, body, link, created_at, is_read')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    placeholderData: [],
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`user-notifs-page-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ['user_notifications', user.id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const feed: FeedItem[] = useMemo(() => {
    const g: FeedItem[] = (globals || []).map(n => ({
      id: `g-${n.id}`,
      rawId: n.id,
      title: n.title,
      body: n.body,
      created_at: n.created_at,
      source: 'global',
      is_read: reads?.includes(n.id) ?? false,
    }));
    const u: FeedItem[] = (userNotifs || []).map(n => ({
      id: `u-${n.id}`,
      rawId: n.id,
      title: n.title,
      body: n.body,
      created_at: n.created_at,
      source: 'user',
      type: n.type,
      link: n.link,
      is_read: n.is_read,
    }));
    return [...u, ...g].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [globals, userNotifs, reads]);

  const filtered = useMemo(() => {
    let list = feed;
    if (filter === 'unread') list = list.filter(n => !n.is_read);
    if (filter === 'user') list = list.filter(n => n.source === 'user');
    if (filter === 'global') list = list.filter(n => n.source === 'global');
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s));
    }
    return list;
  }, [feed, filter, search]);

  const unreadCount = feed.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    const unreadGlobals = (globals || []).filter(n => !reads?.includes(n.id));
    if (unreadGlobals.length) {
      await supabase
        .from('notification_reads')
        .insert(unreadGlobals.map(n => ({ user_id: user.id, notification_id: n.id })));
      qc.invalidateQueries({ queryKey: ['notification_reads'] });
    }
    const unreadUser = (userNotifs || []).filter(n => !n.is_read).map(n => n.id);
    if (unreadUser.length) {
      await supabase.from('user_notifications').update({ is_read: true }).in('id', unreadUser);
      qc.invalidateQueries({ queryKey: ['user_notifications', user.id] });
    }
    toast.success('সব পঠিত হিসেবে চিহ্নিত হয়েছে');
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি হয়েছে');
  };

  const handleClick = (item: FeedItem) => {
    if (item.link) navigate(item.link);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">নোটিফিকেশন</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {unreadCount} নতুন
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="mr-1.5 h-4 w-4" />
            সব পঠিত করুন
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="নোটিফিকেশন খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">সব</TabsTrigger>
            <TabsTrigger value="unread">অপঠিত</TabsTrigger>
            <TabsTrigger value="user">ব্যক্তিগত</TabsTrigger>
            <TabsTrigger value="global">ঘোষণা</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!filtered.length ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Bell className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <p>কোনো নোটিফিকেশন নেই</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <Card
              key={n.id}
              className={cn(
                'p-4 transition-colors hover:bg-muted/50',
                !n.is_read && 'border-primary/40 bg-primary/5',
                n.link && 'cursor-pointer'
              )}
              onClick={() => handleClick(n)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {n.link && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); copyMessage(`${n.title}\n\n${n.body}`); }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm whitespace-pre-wrap text-muted-foreground select-text">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(n.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
