import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeatureFlag = {
  id: string;
  feature_key: string;
  enabled: boolean;
  label: string;
  description: string | null;
  config: Record<string, any>;
};

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature_flags'],
    queryFn: async (): Promise<FeatureFlag[]> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('feature_key');
      if (error) throw error;
      return (data || []) as FeatureFlag[];
    },
    staleTime: 30_000,
  });
}

export function useFeatureFlag(key: string, defaultEnabled = true) {
  const { data, isLoading } = useFeatureFlags();
  const flag = data?.find((f) => f.feature_key === key);
  return {
    enabled: flag ? flag.enabled : defaultEnabled,
    config: (flag?.config || {}) as Record<string, any>,
    isLoading,
  };
}
