export type ForumCategory =
  | 'general'
  | 'tips'
  | 'question'
  | 'savings'
  | 'investment'
  | 'loan';

export const FORUM_CATEGORIES: { value: ForumCategory; label: string; emoji: string; color: string }[] = [
  { value: 'general', label: 'সাধারণ', emoji: '💬', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  { value: 'tips', label: 'টিপস', emoji: '💡', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' },
  { value: 'question', label: 'প্রশ্ন', emoji: '❓', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' },
  { value: 'savings', label: 'সঞ্চয়', emoji: '💰', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' },
  { value: 'investment', label: 'বিনিয়োগ', emoji: '📈', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200' },
  { value: 'loan', label: 'ঋণ', emoji: '🏦', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' },
];

export function getCategoryMeta(value: string) {
  return FORUM_CATEGORIES.find((c) => c.value === value) || FORUM_CATEGORIES[0];
}

export function timeAgoBn(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'এখনই';
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(dateStr).toLocaleDateString('bn-BD');
}
