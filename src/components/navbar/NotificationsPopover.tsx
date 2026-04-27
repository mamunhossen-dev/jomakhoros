import { useState, useEffect } from 'react';
import { Bell, Copy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function NotificationsPopover() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
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
  });

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel('notifications-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const unreadCount = (notifications || []).filter(n => !reads?.includes(n.id)).length;

  const markAllRead = async () => {
    if (!user || !notifications?.length) return;
    const toMark = notifications
      .filter(n => !reads?.includes(n.id))
      .map(n => ({ user_id: user.id, notification_id: n.id }));
    if (!toMark.length) return;
    await supabase.from('notification_reads').insert(toMark);
    qc.invalidateQueries({ queryKey: ['notification_reads'] });
  };

  useEffect(() => {
    if (open) markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি হয়েছে');
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
        <div className="border-b px-4 py-3">
          <h3 className="font-display text-sm font-semibold">নোটিফিকেশন</h3>
        </div>
        <ScrollArea className="max-h-96">
          {!notifications?.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <div key={n.id} className="p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => copyMessage(`${n.title}\n\n${n.body}`)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground select-text">{n.body}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{format(new Date(n.created_at), 'dd MMM yyyy')}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
