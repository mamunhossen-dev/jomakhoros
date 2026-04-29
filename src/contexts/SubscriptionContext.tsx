import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  accountType: 'trial' | 'free' | 'pro';
  isProOrTrial: boolean;
  isFree: boolean;
  trialEndDate: string | null;
  subscriptionEndDate: string | null;
  loading: boolean;
  userRole: 'admin' | 'moderator' | 'user';
  isAdmin: boolean;
  isModerator: boolean;
  isBlocked: boolean;
  blockReason: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  accountType: 'trial',
  isProOrTrial: true,
  isFree: false,
  trialEndDate: null,
  subscriptionEndDate: null,
  loading: true,
  userRole: 'user',
  isAdmin: false,
  isModerator: false,
  isBlocked: false,
  blockReason: null,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user_roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });

  const value = useMemo(() => {
    const now = new Date();
    let accountType: 'trial' | 'free' | 'pro' = (profile?.account_type as any) || 'trial';

    // Auto-check trial expiry
    if (accountType === 'trial' && profile?.trial_end_date) {
      if (new Date(profile.trial_end_date) < now) {
        accountType = 'free';
      }
    }

    // Auto-check subscription expiry
    if (accountType === 'pro' && profile?.subscription_end) {
      if (new Date(profile.subscription_end) < now) {
        accountType = 'free';
      }
    }

    const isAdmin = roles?.includes('admin') || false;
    const isModerator = roles?.includes('moderator') || false;

    // Admins and moderators always get pro access
    const effectiveType = (isAdmin || isModerator) ? 'pro' : accountType;

    return {
      accountType: effectiveType,
      isProOrTrial: effectiveType === 'pro' || effectiveType === 'trial',
      isFree: effectiveType === 'free',
      trialEndDate: profile?.trial_end_date || null,
      subscriptionEndDate: profile?.subscription_end || null,
      loading: profileLoading || rolesLoading,
      userRole: isAdmin ? 'admin' as const : isModerator ? 'moderator' as const : 'user' as const,
      isAdmin,
      isModerator,
    };
  }, [profile, roles, profileLoading, rolesLoading]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
