import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

const FEEDBACK_SEEN_KEY = 'admin_feedback_last_seen';
const USERS_SEEN_KEY = 'admin_users_last_seen';

function readSeen(key: string): number {
  if (typeof window === 'undefined') return 0;
  const v = localStorage.getItem(key);
  return v ? Number(v) : 0;
}

/**
 * Lightweight badge counts for admin tabs + sidebar dot.
 * Uses HEAD count queries (no row payloads) and long staleTime so it
 * doesn't compete with the heavier AdminPanel queries on mount.
 */
export function useAdminBadges() {
  const { isAdmin, isModerator } = useSubscription();
  const enabled = isAdmin || isModerator;
  const qc = useQueryClient();

  const [feedbackLastSeen, setFeedbackLastSeen] = useState<number>(() => readSeen(FEEDBACK_SEEN_KEY));
  const [usersLastSeen, setUsersLastSeen] = useState<number>(() => readSeen(USERS_SEEN_KEY));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === FEEDBACK_SEEN_KEY) setFeedbackLastSeen(readSeen(FEEDBACK_SEEN_KEY));
      if (e.key === USERS_SEEN_KEY) setUsersLastSeen(readSeen(USERS_SEEN_KEY));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const { data: pendingPaymentsCount = 0 } = useQuery({
    queryKey: ['admin_badge_pending_payments'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('payment_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Newest feedback timestamp only — used to compute unread badge.
  const { data: newestFeedbackAt = 0 } = useQuery({
    queryKey: ['admin_badge_newest_feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? new Date(data.created_at).getTime() : 0;
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Count of feedback rows newer than last-seen (server-side count)
  const { data: feedbackUnreadCount = 0 } = useQuery({
    queryKey: ['admin_badge_feedback_unread', feedbackLastSeen],
    queryFn: async () => {
      const since = new Date(feedbackLastSeen || 0).toISOString();
      const { count, error } = await supabase
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', since);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: enabled && newestFeedbackAt > feedbackLastSeen,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: newUsersCount = 0 } = useQuery({
    queryKey: ['admin_badge_new_users', usersLastSeen],
    queryFn: async () => {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const sinceSeen = new Date(usersLastSeen || 0).toISOString();
      const cutoff = sinceSeen > since24h ? sinceSeen : since24h;
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', cutoff);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isAdmin,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Realtime: invalidate only the small badge queries
  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel('admin-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_badge_pending_payments'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_badge_newest_feedback'] });
        qc.invalidateQueries({ queryKey: ['admin_badge_feedback_unread'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_badge_new_users'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [enabled, qc]);

  const markFeedbackSeen = () => {
    const now = Date.now();
    localStorage.setItem(FEEDBACK_SEEN_KEY, String(now));
    setFeedbackLastSeen(now);
  };

  const markUsersSeen = () => {
    const now = Date.now();
    localStorage.setItem(USERS_SEEN_KEY, String(now));
    setUsersLastSeen(now);
  };

  const hasAny =
    (pendingPaymentsCount || 0) > 0 ||
    (feedbackUnreadCount || 0) > 0 ||
    (newUsersCount || 0) > 0;

  return {
    pendingPaymentsCount: pendingPaymentsCount || 0,
    feedbackUnreadCount: feedbackUnreadCount || 0,
    newUsersCount: newUsersCount || 0,
    hasAny,
    markFeedbackSeen,
    markUsersSeen,
  };
}
