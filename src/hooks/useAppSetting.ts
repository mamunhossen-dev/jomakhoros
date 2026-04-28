import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAppSetting<T = any>(key: string, defaultValue: T) {
  return useQuery({
    queryKey: ['app_setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .maybeSingle();
      if (error) throw error;
      return (data?.setting_value as T) ?? defaultValue;
    },
  });
}
