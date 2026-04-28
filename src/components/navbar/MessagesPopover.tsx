import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SupportStatus } from '@/lib/supportStatus';

const STATUS_BANNER: Record<SupportStatus, { text: string; cls: string }> = {
  new: {
    text: 'আপনার মেসেজ পাওয়া গেছে, শীঘ্রই উত্তর দেওয়া হবে',
    cls: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/30',
  },
  open: {
    text: 'আমাদের টিম আপনার বিষয়টি দেখছে',
    cls: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:border-orange-500/30',
  },
  pending: {
    text: 'আপনার উত্তরের অপেক্ষায় আছি',
    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:border-yellow-500/30',
  },
  solved: {
    text: 'আপনার সমস্যাটি সমাধান করা হয়েছে',
    cls: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-200 dark:border-green-500/30',
  },
  closed: {
    text: 'এই টিকেটটি বন্ধ করা হয়েছে',
    cls: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/30',
  },
};

export function MessagesPopover() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Active (non-closed) ticket for this user — most recent one.
  // If none exists, fall back to the latest ticket (likely closed) so we still show last conversation context.
  const { data: activeThread } = useQuery({
    queryKey: ['support_active_thread', user?.id],
    queryFn: async () => {
      const { data: openOnes, error } = await supabase
        .from('support_threads')
        .select('*')
        .eq('user_id', user!.id)
        .neq('status', 'closed')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      if (openOnes && openOnes.length) return openOnes[0];

      const { data: latest, error: e2 } = await supabase
        .from('support_threads')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (e2) throw e2;
      return latest?.[0] || null;
    },
    enabled: !!user,
  });

  const activeTicketId: string | null = activeThread?.ticket_id ?? null;
  const status: SupportStatus = (activeThread?.status as SupportStatus) || 'new';
  const isClosed = status === 'closed';
  const banner = STATUS_BANNER[status];

  // Messages for the active ticket only
  const { data: messages } = useQuery({
    queryKey: ['support_messages_ticket', activeTicketId],
    queryFn: async () => {
      if (!activeTicketId) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', activeTicketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!activeTicketId,
  });

  // Unread count across ALL admin->user messages of this user (so badge still works even if no active ticket cached)
  const { data: unreadCount } = useQuery({
    queryKey: ['support_unread', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_from_admin', true)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Realtime: refresh on any change for this user
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`support-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages', filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ['support_messages_ticket', activeTicketId] });
        qc.invalidateQueries({ queryKey: ['support_unread', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads', filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ['support_active_thread', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc, activeTicketId]);

  // Auto scroll
  useEffect(() => {
    if (open && scrollRef.current) {
      setTimeout(() => { scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight; }, 50);
    }
  }, [open, messages]);

  // Mark admin messages in active ticket as read
  useEffect(() => {
    if (!open || !user || !messages?.length) return;
    const ids = messages.filter(m => m.is_from_admin && !m.is_read).map(m => m.id);
    if (!ids.length) return;
    supabase.from('support_messages').update({ is_read: true }).in('id', ids).then(() => {
      qc.invalidateQueries({ queryKey: ['support_messages_ticket', activeTicketId] });
      qc.invalidateQueries({ queryKey: ['support_unread', user.id] });
    });
  }, [open, messages, user, qc, activeTicketId]);

  const send = async () => {
    if (!text.trim() || !user || isClosed) return;

    // Ensure we have an active ticket; if none, create one first.
    let ticketId = activeTicketId;
    if (!ticketId) {
      const { data: newThread, error: tErr } = await supabase
        .from('support_threads')
        .insert({ user_id: user.id, status: 'new' })
        .select()
        .single();
      if (tErr) { toast.error(tErr.message); return; }
      ticketId = newThread.ticket_id;
      qc.invalidateQueries({ queryKey: ['support_active_thread', user.id] });
    }

    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      sender_id: user.id,
      is_from_admin: false,
      message: text.trim(),
      ticket_id: ticketId!,
    });
    if (error) { toast.error(error.message); return; }
    setText('');
  };

  const openNewTicket = async () => {
    if (!user) return;
    // Insert a brand new ticket. Old closed ticket stays archived.
    const { data: newThread, error } = await supabase
      .from('support_threads')
      .insert({ user_id: user.id, status: 'new' })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    qc.setQueryData(['support_active_thread', user.id], newThread);
    qc.invalidateQueries({ queryKey: ['support_active_thread', user.id] });
    toast.success('নতুন টিকেট খোলা হয়েছে');
  };

  const unread = unreadCount || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <MessageCircle className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <h3 className="font-display text-sm font-semibold">সাপোর্ট মেসেজ</h3>
          <p className="text-xs text-muted-foreground">আমাদের টিমের সাথে যোগাযোগ করুন</p>
        </div>
        {activeThread && (messages?.length ?? 0) > 0 ? (
          <div className={`mx-3 mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${banner.cls}`}>
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-relaxed">{banner.text}</span>
          </div>
        ) : null}
        <ScrollArea className="h-64" ref={scrollRef as any}>
          <div ref={scrollRef} className="p-3 space-y-2">
            {!messages?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">এখনো কোনো মেসেজ নেই। নিচে লিখে শুরু করুন।</p>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.is_from_admin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${m.is_from_admin ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                    <p className={`mt-1 text-[10px] ${m.is_from_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                      {format(new Date(m.created_at), 'dd MMM, hh:mm a')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {isClosed ? (
          <div className="border-t p-2 space-y-2">
            <Textarea
              value=""
              disabled
              placeholder="এই টিকেটটি বন্ধ করা হয়েছে..."
              className="min-h-9 resize-none text-sm opacity-60"
              rows={1}
            />
            <Button onClick={openNewTicket} className="w-full" size="sm">
              নতুন টিকেট খুলুন
            </Button>
          </div>
        ) : (
          <div className="border-t p-2 flex gap-1">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="মেসেজ লিখুন..."
              className="min-h-9 resize-none text-sm"
              rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button size="icon" onClick={send} disabled={!text.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
