import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Sparkles, Repeat, Download, KeyRound, Smartphone, Compass,
  Settings2, ChevronDown, MessageSquare, Bell, LifeBuoy, UserPlus, LogIn, Users,
  EyeOff, Clock, Crown,
} from 'lucide-react';
import { useFeatureFlags, type FeatureFlag, type DisableMode, type MinPlan, type MinRole } from '@/hooks/useFeatureFlags';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  dashboard_tour: Compass,
  recurring_transactions: Repeat,
  data_export: Download,
  forgot_password: KeyRound,
  pwa_install: Smartphone,
  onboarding_flow: Sparkles,
  feedback_form: MessageSquare,
  support_chat: LifeBuoy,
  user_notifications: Bell,
  google_signup: LogIn,
  user_registration: UserPlus,
  community_forum: Users,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'সাধারণ',
  engagement: 'এনগেজমেন্ট',
  auth: 'অথেন্টিকেশন',
};

const DISABLE_MODE_OPTIONS: { value: DisableMode; label: string; icon: any; help: string }[] = [
  { value: 'hide', label: 'সম্পূর্ণ লুকান', icon: EyeOff, help: 'ফিচারটি ইউজারের কাছে দেখাই দেবে না' },
  { value: 'coming_soon', label: 'শীঘ্রই আসছে', icon: Clock, help: '"শীঘ্রই আসছে" badge সহ disabled দেখাবে' },
  { value: 'pro_only', label: 'শুধু প্রো', icon: Crown, help: 'প্রো প্ল্যান প্রোমোশন সহ disabled দেখাবে' },
];

const PLAN_OPTIONS: { value: MinPlan; label: string }[] = [
  { value: 'none', label: 'সবার জন্য' },
  { value: 'trial', label: 'ট্রায়াল+' },
  { value: 'pro', label: 'শুধু প্রো' },
];

const ROLE_OPTIONS: { value: MinRole; label: string }[] = [
  { value: 'user', label: 'সব ইউজার' },
  { value: 'moderator', label: 'মডারেটর+' },
  { value: 'admin', label: 'শুধু এডমিন' },
];

type FlagPatch = Partial<Pick<FeatureFlag, 'enabled' | 'disable_mode' | 'min_plan' | 'min_role' | 'disabled_message'>>;

export function FeatureFlagsEditor() {
  const qc = useQueryClient();
  const { data: flags, isLoading } = useFeatureFlags();
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: FlagPatch }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature_flags'] });
      toast.success('সংরক্ষিত');
    },
    onError: (e: any) => toast.error(e.message || 'পরিবর্তন ব্যর্থ'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  // Group by category
  const grouped = (flags || []).reduce<Record<string, FeatureFlag[]>>((acc, f) => {
    const cat = f.category || 'general';
    (acc[cat] ||= []).push(f);
    return acc;
  }, {});

  const categoryOrder = ['general', 'engagement', 'auth', ...Object.keys(grouped).filter(k => !['general', 'engagement', 'auth'].includes(k))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          ফিচার নিয়ন্ত্রণ
        </CardTitle>
        <CardDescription>
          সমস্ত ফিচার এখান থেকে চালু/বন্ধ করুন। প্রতিটি ফিচারে ক্লিক করে অতিরিক্ত সেটিং (প্ল্যান, রোল, কাস্টম মেসেজ) কনফিগার করুন।
          নতুন ফিচার কোডে যোগ করলে এখানে অটোমেটিক দেখাবে।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {categoryOrder.filter(c => grouped[c]?.length).map((cat) => (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[cat] || cat}
              </h3>
              <div className="h-px flex-1 bg-border" />
              <Badge variant="outline" className="text-[10px]">{grouped[cat].length}</Badge>
            </div>
            <div className="space-y-2">
              {grouped[cat].map((flag) => (
                <FlagRow
                  key={flag.id}
                  flag={flag}
                  expanded={expanded === flag.id}
                  onToggleExpand={() => setExpanded(expanded === flag.id ? null : flag.id)}
                  onPatch={(patch) => updateMutation.mutate({ id: flag.id, patch })}
                  saving={updateMutation.isPending}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FlagRow({
  flag,
  expanded,
  onToggleExpand,
  onPatch,
  saving,
}: {
  flag: FeatureFlag;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (patch: FlagPatch) => void;
  saving: boolean;
}) {
  const Icon = ICONS[flag.feature_key] || Sparkles;
  const [draftMessage, setDraftMessage] = useState(flag.disabled_message || '');

  return (
    <Collapsible open={expanded} onOpenChange={onToggleExpand}>
      <div
        className={cn(
          'rounded-lg border transition-colors',
          flag.enabled ? 'bg-card' : 'bg-muted/30',
          expanded && 'ring-1 ring-primary/20'
        )}
      >
        {/* Main row */}
        <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
              flag.enabled ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Icon className={cn('h-4 w-4', flag.enabled ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{flag.label}</span>
                <Badge variant={flag.enabled ? 'default' : 'secondary'} className="text-[10px] h-5">
                  {flag.enabled ? 'সক্রিয়' : 'বন্ধ'}
                </Badge>
                {flag.min_plan !== 'none' && (
                  <Badge variant="outline" className="text-[10px] h-5 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    <Crown className="h-2.5 w-2.5 mr-0.5" />
                    {flag.min_plan === 'pro' ? 'প্রো' : 'ট্রায়াল+'}
                  </Badge>
                )}
                {flag.min_role !== 'user' && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    {flag.min_role === 'admin' ? 'এডমিন' : 'মডারেটর+'}
                  </Badge>
                )}
              </div>
              {flag.description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                  {flag.description}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono truncate">
                {flag.feature_key}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="অতিরিক্ত সেটিং"
              >
                <Settings2 className={cn('h-4 w-4 transition-transform', expanded && 'text-primary')} />
              </Button>
            </CollapsibleTrigger>
            <Switch
              checked={flag.enabled}
              disabled={saving}
              onCheckedChange={(enabled) => onPatch({ enabled })}
            />
          </div>
        </div>

        {/* Expanded settings */}
        <CollapsibleContent>
          <div className="border-t bg-muted/20 p-3 sm:p-4 space-y-4">
            {/* Disable mode */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">বন্ধ থাকলে কী দেখাবে?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DISABLE_MODE_OPTIONS.map((opt) => {
                  const ModeIcon = opt.icon;
                  const active = flag.disable_mode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onPatch({ disable_mode: opt.value })}
                      disabled={saving}
                      className={cn(
                        'flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <ModeIcon className={cn('h-3.5 w-3.5', active && 'text-primary')} />
                        <span className={cn('text-xs font-medium', active && 'text-primary')}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">{opt.help}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan & Role gating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">ন্যূনতম প্ল্যান</Label>
                <Select
                  value={flag.min_plan}
                  onValueChange={(v) => onPatch({ min_plan: v as MinPlan })}
                  disabled={saving}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">ন্যূনতম রোল</Label>
                <Select
                  value={flag.min_role}
                  onValueChange={(v) => onPatch({ min_role: v as MinRole })}
                  disabled={saving}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom message */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">কাস্টম মেসেজ (ঐচ্ছিক)</Label>
              <Textarea
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                placeholder="ফিচার বন্ধ থাকলে ইউজার এই বার্তাটি দেখবেন। খালি রাখলে ডিফল্ট মেসেজ দেখাবে।"
                rows={2}
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={saving || draftMessage === (flag.disabled_message || '')}
                  onClick={() => onPatch({ disabled_message: draftMessage || null })}
                >
                  মেসেজ সংরক্ষণ
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
