import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function MessagesPopover() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ['support_messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`support-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages', filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ['support_messages', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  // Auto scroll
  useEffect(() => {
    if (open && scrollRef.current) {
      setTimeout(() => { scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight; }, 50);
    }
  }, [open, messages]);

  const unread = (messages || []).filter(m => m.is_from_admin && !m.is_read).length;

  // Mark admin messages as read when opened
  useEffect(() => {
    if (!open || !user || !messages?.length) return;
    const ids = messages.filter(m => m.is_from_admin && !m.is_read).map(m => m.id);
    if (!ids.length) return;
    supabase.from('support_messages').update({ is_read: true }).in('id', ids).then(() => {
      qc.invalidateQueries({ queryKey: ['support_messages', user.id] });
    });
  }, [open, messages, user, qc]);

  const send = async () => {
    if (!text.trim() || !user) return;
    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      sender_id: user.id,
      is_from_admin: false,
      message: text.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setText('');
  };

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
        <ScrollArea className="h-72" ref={scrollRef as any}>
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
      </PopoverContent>
    </Popover>
  );
}
