import { useState, useEffect, useMemo } from 'react';
import { Bell, Copy, CheckCircle2, XCircle, Clock, Megaphone, ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type FeedItem = {
  id: string;
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
    case 'payment_approved': return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'payment_rejected': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'payment_submitted': return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'subscription_reminder': return <Clock className="h-4 w-4 text-yellow-600" />;
    default: return <Megaphone className="h-4 w-4 text-primary" />;
  }
};

export function NotificationsPopover() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: globals } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 0,
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
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 0,
    placeholderData: [],
  });

  const { data: userNotifs } = useQuery({
    queryKey: ['user_notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, type, title, body, link, created_at, is_read')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    retry: 0,
    placeholderData: [],
  });

  // Realtime: invalidate on changes
  useEffect(() => {
    const ch = supabase
      .channel('notifications-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`user-notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['user_notifications', user.id] });
          if (payload.eventType === 'INSERT' && payload.new) {
            const n = payload.new as { title?: string };
            if (n.title) toast.success(n.title);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const feed: FeedItem[] = useMemo(() => {
    const g: FeedItem[] = (globals || []).map(n => ({
      id: `g-${n.id}`,
      title: n.title,
      body: n.body,
      created_at: n.created_at,
      source: 'global',
      is_read: reads?.includes(n.id) ?? false,
    }));
    const u: FeedItem[] = (userNotifs || []).map(n => ({
      id: `u-${n.id}`,
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

  const unreadCount = feed.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    // Global ones via notification_reads
    const unreadGlobals = (globals || []).filter(n => !reads?.includes(n.id));
    if (unreadGlobals.length) {
      await supabase
        .from('notification_reads')
        .insert(unreadGlobals.map(n => ({ user_id: user.id, notification_id: n.id })));
      qc.invalidateQueries({ queryKey: ['notification_reads'] });
    }
    // Per-user: update is_read
    const unreadUser = (userNotifs || []).filter(n => !n.is_read).map(n => n.id);
    if (unreadUser.length) {
      await supabase.from('user_notifications').update({ is_read: true }).in('id', unreadUser);
      qc.invalidateQueries({ queryKey: ['user_notifications', user.id] });
    }
  };

  useEffect(() => {
    if (open) markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি হয়েছে');
  };

  const handleClick = (item: FeedItem) => {
    if (item.link) {
      navigate(item.link);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-display text-sm font-semibold">নোটিফিকেশন</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {unreadCount} নতুন
            </span>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {!feed.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
          ) : (
            <div className="divide-y">
              {feed.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'p-3 hover:bg-muted/50 transition-colors',
                    !n.is_read && 'bg-primary/5',
                    n.link && 'cursor-pointer'
                  )}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {n.link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); copyMessage(`${n.title}\n\n${n.body}`); }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground select-text">{n.body}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {format(new Date(n.created_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t px-4 py-2 text-center">
          <button
            onClick={() => { setOpen(false); navigate('/notifications'); }}
            className="text-xs font-medium text-primary hover:underline"
          >
            সব নোটিফিকেশন দেখুন →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
