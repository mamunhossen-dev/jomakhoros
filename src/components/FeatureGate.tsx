import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Crown, Lock } from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { useSubscription } from '@/contexts/SubscriptionContext';

type Props = {
  /** Feature key — auto-registered on first use if missing */
  feature: string;
  /** Default enabled if flag missing while loading */
  defaultEnabled?: boolean;
  /** Friendly label shown to admin in editor */
  label?: string;
  /** Description shown to admin in editor */
  description?: string;
  /** Group in admin editor */
  category?: string;
  /** What to render when feature is on (and user passes plan/role gates) */
  children: ReactNode;
  /** Optional fallback when blocked (else renders nothing for hide mode, or nice card for coming_soon/pro_only) */
  fallback?: ReactNode;
  /** When true, blocked state still renders the placeholder card; otherwise hidden completely. Default: based on disable_mode */
  showPlaceholder?: boolean;
};

const planRank: Record<string, number> = { none: 0, trial: 1, pro: 2 };
const roleRank: Record<string, number> = { user: 0, moderator: 1, admin: 2 };

export function FeatureGate({
  feature,
  defaultEnabled = true,
  label,
  description,
  category,
  children,
  fallback,
  showPlaceholder,
}: Props) {
  const { flag, enabled, isLoading } = useFeatureFlag(feature, {
    defaultEnabled,
    label,
    description,
    category,
  });
  const { accountType, isAdmin, isModerator } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) return null;

  // Determine effective access
  const userPlan = accountType === 'pro' ? 'pro' : accountType === 'trial' ? 'trial' : 'none';
  const userRole = isAdmin ? 'admin' : isModerator ? 'moderator' : 'user';

  const minPlan = flag?.min_plan ?? 'none';
  const minRole = flag?.min_role ?? 'user';
  const disableMode = flag?.disable_mode ?? 'hide';
  const customMsg = flag?.disabled_message;

  // Admins always bypass when feature is enabled (so they can preview)
  const planOk = planRank[userPlan] >= planRank[minPlan];
  const roleOk = roleRank[userRole] >= roleRank[minRole];

  // Allowed cases:
  // 1. Feature enabled AND plan/role gates pass
  // 2. User is admin (always preview)
  if (enabled && (isAdmin || (planOk && roleOk))) {
    return <>{children}</>;
  }

  // Blocked. Decide what to render.
  if (fallback !== undefined) return <>{fallback}</>;

  // Default placeholder behaviors
  const shouldShowPlaceholder = showPlaceholder ?? disableMode !== 'hide';
  if (!shouldShowPlaceholder && !(!enabled && disableMode === 'pro_only')) return null;

  // Render different placeholder cards based on mode
  if (!enabled && disableMode === 'coming_soon') {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="secondary">শীঘ্রই আসছে</Badge>
          <p className="text-sm text-muted-foreground max-w-xs">
            {customMsg || 'এই ফিচারটি শীঘ্রই চালু হবে। অপেক্ষার জন্য ধন্যবাদ!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if ((!enabled && disableMode === 'pro_only') || (enabled && !planOk)) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">প্রো ফিচার</Badge>
          <p className="text-sm text-muted-foreground max-w-xs">
            {customMsg || 'এই ফিচারটি ব্যবহার করতে প্রো প্ল্যান দরকার।'}
          </p>
          <Button size="sm" onClick={() => navigate('/subscription')}>
            প্ল্যান দেখুন
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (enabled && !roleOk) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-xs">
            {customMsg || 'এই ফিচার ব্যবহারের অনুমতি নেই।'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}

/**
 * Simpler boolean check — returns true only when feature is on AND user passes plan/role gates.
 * Use this for inline conditional rendering (links, buttons) without placeholder UI.
 */
export function useFeatureAvailable(feature: string, defaultEnabled = true): boolean {
  const { flag, enabled, isLoading } = useFeatureFlag(feature, { defaultEnabled });
  const { accountType, isAdmin, isModerator } = useSubscription();
  if (isLoading) return defaultEnabled;
  if (!enabled) return false;
  if (isAdmin) return true;
  const userPlan = accountType === 'pro' ? 'pro' : accountType === 'trial' ? 'trial' : 'none';
  const userRole = isAdmin ? 'admin' : isModerator ? 'moderator' : 'user';
  const minPlan = flag?.min_plan ?? 'none';
  const minRole = flag?.min_role ?? 'user';
  return planRank[userPlan] >= planRank[minPlan] && roleRank[userRole] >= roleRank[minRole];
}
