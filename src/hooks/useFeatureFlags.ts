import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DisableMode = 'hide' | 'coming_soon' | 'pro_only';
export type MinPlan = 'none' | 'trial' | 'pro';
export type MinRole = 'user' | 'moderator' | 'admin';

export type FeatureFlag = {
  id: string;
  feature_key: string;
  enabled: boolean;
  label: string;
  description: string | null;
  config: Record<string, any>;
  disable_mode: DisableMode;
  min_plan: MinPlan;
  min_role: MinRole;
  disabled_message: string | null;
  category: string;
};

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature_flags'],
    queryFn: async (): Promise<FeatureFlag[]> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('category')
        .order('feature_key');
      if (error) throw error;
      return (data || []) as FeatureFlag[];
    },
    staleTime: 30_000,
  });
}

// Track which auto-registrations we've already attempted in this session to avoid spam
const autoRegisterAttempted = new Set<string>();

type AutoRegisterMeta = {
  label?: string;
  description?: string;
  category?: string;
  defaultEnabled?: boolean;
};

/**
 * Get the state of a single feature flag.
 * If the key doesn't exist in DB, attempts to auto-register it (so admins can manage it).
 * Returns `enabled: defaultEnabled` while loading or auto-registering.
 */
export function useFeatureFlag(key: string, metaOrDefault: AutoRegisterMeta | boolean = {}) {
  const meta: AutoRegisterMeta = typeof metaOrDefault === 'boolean'
    ? { defaultEnabled: metaOrDefault }
    : metaOrDefault;
  const { defaultEnabled = true, label, description, category = 'general' } = meta;
  const { data, isLoading } = useFeatureFlags();
  const flag = data?.find((f) => f.feature_key === key);
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Auto-register if missing — only once per session per key, only when authed
    if (isLoading) return;
    if (flag) return;
    if (autoRegisterAttempted.has(key) || attemptedRef.current) return;
    attemptedRef.current = true;
    autoRegisterAttempted.add(key);

    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return; // need to be authed to insert
      await supabase
        .from('feature_flags')
        .insert({
          feature_key: key,
          enabled: defaultEnabled,
          label: label || key,
          description: description ?? null,
          category,
        })
        .select()
        .maybeSingle();
    })().catch(() => {
      // Conflict (someone else registered first) is fine; ignore
    });
  }, [flag, isLoading, key, defaultEnabled, label, description, category]);

  return {
    enabled: flag ? flag.enabled : defaultEnabled,
    flag: flag ?? null,
    config: (flag?.config || {}) as Record<string, any>,
    isLoading,
  };
}
