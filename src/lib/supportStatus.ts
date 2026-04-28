import { CircleDot, Flame, Hourglass, CheckCircle2, Lock, LucideIcon } from 'lucide-react';

export type SupportStatus = 'new' | 'open' | 'pending' | 'solved' | 'closed';

export interface StatusMeta {
  value: SupportStatus;
  label: string;
  icon: LucideIcon;
  // Tailwind classes for pill badge (bg + text + border)
  badgeClass: string;
  // Dot color for filter tabs
  dotClass: string;
}

export const STATUS_LIST: StatusMeta[] = [
  {
    value: 'new',
    label: 'নতুন',
    icon: CircleDot,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    dotClass: 'bg-blue-500',
  },
  {
    value: 'open',
    label: 'ওপেন',
    icon: Flame,
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
    dotClass: 'bg-orange-500',
  },
  {
    value: 'pending',
    label: 'অপেক্ষমান',
    icon: Hourglass,
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
    dotClass: 'bg-yellow-500',
  },
  {
    value: 'solved',
    label: 'সমাধান',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
    dotClass: 'bg-green-500',
  },
  {
    value: 'closed',
    label: 'বন্ধ',
    icon: Lock,
    badgeClass: 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30',
    dotClass: 'bg-gray-500',
  },
];

export const STATUS_MAP: Record<SupportStatus, StatusMeta> = STATUS_LIST.reduce((acc, s) => {
  acc[s.value] = s;
  return acc;
}, {} as Record<SupportStatus, StatusMeta>);

export const getStatusMeta = (status?: string | null): StatusMeta =>
  STATUS_MAP[(status as SupportStatus) || 'new'] || STATUS_MAP.new;
