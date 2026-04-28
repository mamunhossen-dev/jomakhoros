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
 * Shared admin badge counts used by the Admin Panel tabs and the sidebar dot.
 * - pendingPaymentsCount: payment_requests with status = 'pending'
 * - feedbackUnreadCount: feedback rows newer than last-seen timestamp
 * - newUsersCount: profiles created within the last 24h AND newer than last-seen
 * - hasAny: true if any of the above > 0 (drives the sidebar red dot)
 */
export function useAdminBadges() {
  const { isAdmin, isModerator } = useSubscription();
  const enabled = isAdmin || isModerator;
  const qc = useQueryClient();

  const [feedbackLastSeen, setFeedbackLastSeen] = useState<number>(() => readSeen(FEEDBACK_SEEN_KEY));
  const [usersLastSeen, setUsersLastSeen] = useState<number>(() => readSeen(USERS_SEEN_KEY));

  // Sync across tabs / when other components update the seen timestamps
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
    refetchInterval: 30000,
  });

  const { data: feedbackList = [] } = useQuery({
    queryKey: ['admin_badge_feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ['admin_badge_users'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Realtime: keep counts fresh
  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel('admin-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_badge_pending_payments'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_badge_feedback'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        qc.invalidateQueries({ queryKey: ['admin_badge_users'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [enabled, qc]);

  const feedbackUnreadCount = (feedbackList || []).filter(
    f => new Date(f.created_at).getTime() > feedbackLastSeen
  ).length;

  const newUsersCount = (usersList || []).filter(
    u => new Date(u.created_at).getTime() > usersLastSeen
  ).length;

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
    feedbackUnreadCount > 0 ||
    newUsersCount > 0;

  return {
    pendingPaymentsCount: pendingPaymentsCount || 0,
    feedbackUnreadCount,
    newUsersCount,
    hasAny,
    markFeedbackSeen,
    markUsersSeen,
  };
}
