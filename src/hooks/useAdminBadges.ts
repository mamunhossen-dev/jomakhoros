import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

const FEEDBACK_SEEN_KEY = 'admin_feedback_last_seen';
const USERS_SEEN_KEY = 'admin_users_last_seen';

function readSeen(key: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const v = localStorage.getItem(key);
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Safe, lightweight badge counts for admin tabs + sidebar dot.
 *
 * Hard requirements:
 * - NEVER block page render. All errors swallow and return 0.
 * - No state values inside queryKeys (avoids refetch loops).
 * - Polls every 60s; reacts to realtime inserts.
 */
export function useAdminBadges() {
  const { isAdmin, isModerator } = useSubscription();
  const enabled = isAdmin || isModerator;
  const qc = useQueryClient();

  // Keep "seen" timestamps in refs (no re-renders) plus a tiny tick state
  // we bump only when the user actively marks something as seen.
  const feedbackSeenRef = useRef<number>(readSeen(FEEDBACK_SEEN_KEY));
  const usersSeenRef = useRef<number>(readSeen(USERS_SEEN_KEY));
  const [, setSeenTick] = useState(0);

  // Sync from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === FEEDBACK_SEEN_KEY) {
        feedbackSeenRef.current = readSeen(FEEDBACK_SEEN_KEY);
        setSeenTick(t => t + 1);
      }
      if (e.key === USERS_SEEN_KEY) {
        usersSeenRef.current = readSeen(USERS_SEEN_KEY);
        setSeenTick(t => t + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const { data: pendingPaymentsCount = 0 } = useQuery({
    queryKey: ['admin_badge_pending_payments'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('payment_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (error) return 0;
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Newest feedback timestamp (used to know if any unread exists)
  const { data: newestFeedbackAt = 0 } = useQuery({
    queryKey: ['admin_badge_newest_feedback'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error || !data) return 0;
        return new Date(data.created_at).getTime();
      } catch {
        return 0;
      }
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const { data: feedbackTotalCount = 0 } = useQuery({
    queryKey: ['admin_badge_feedback_total'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('feedback')
          .select('id', { count: 'exact', head: true });
        if (error) return 0;
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    enabled: enabled && newestFeedbackAt > feedbackSeenRef.current,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const { data: newUsersCount = 0 } = useQuery({
    queryKey: ['admin_badge_new_users'],
    queryFn: async () => {
      try {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('created_at', since24h);
        if (error) return 0;
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    enabled: isAdmin,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Realtime channel — failures here must never break the page.
  useEffect(() => {
    if (!enabled) return;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase
        .channel('admin-badges')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, () => {
          qc.invalidateQueries({ queryKey: ['admin_badge_pending_payments'] });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, () => {
          qc.invalidateQueries({ queryKey: ['admin_badge_newest_feedback'] });
          qc.invalidateQueries({ queryKey: ['admin_badge_feedback_total'] });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
          qc.invalidateQueries({ queryKey: ['admin_badge_new_users'] });
        })
        .subscribe();
    } catch {
      // ignore — badges will still poll via staleTime/visibility
    }
    return () => {
      if (ch) {
        try { supabase.removeChannel(ch); } catch { /* noop */ }
      }
    };
  }, [enabled, qc]);

  // Derive "unread" counts from refs (NOT state) so they don't drive the queryKey.
  const feedbackUnreadCount = newestFeedbackAt > feedbackSeenRef.current
    ? Math.max(0, feedbackTotalCount)
    : 0;

  const newUsersUnseenCount = newUsersCount > 0 && Date.now() > usersSeenRef.current
    ? newUsersCount
    : 0;

  const markFeedbackSeen = () => {
    const now = Date.now();
    try { localStorage.setItem(FEEDBACK_SEEN_KEY, String(now)); } catch { /* noop */ }
    feedbackSeenRef.current = now;
    setSeenTick(t => t + 1);
  };

  const markUsersSeen = () => {
    const now = Date.now();
    try { localStorage.setItem(USERS_SEEN_KEY, String(now)); } catch { /* noop */ }
    usersSeenRef.current = now;
    setSeenTick(t => t + 1);
  };

  const hasAny =
    (pendingPaymentsCount || 0) > 0 ||
    feedbackUnreadCount > 0 ||
    newUsersUnseenCount > 0;

  return {
    pendingPaymentsCount: pendingPaymentsCount || 0,
    feedbackUnreadCount,
    newUsersCount: newUsersUnseenCount,
    hasAny,
    markFeedbackSeen,
    markUsersSeen,
  };
}
