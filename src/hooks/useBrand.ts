import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_BRAND, type Brand } from '@/components/admin/BrandingEditor';

/**
 * Single source of truth for brand settings. Returns merged values with defaults
 * so consumers can use them safely while data loads.
 */
export function useBrand(): Brand {
  const { data } = useAppSetting<Brand>('brand', DEFAULT_BRAND);
  return { ...DEFAULT_BRAND, ...(data ?? {}) };
}
