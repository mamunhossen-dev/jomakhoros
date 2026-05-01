import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Repeat, Download, KeyRound, Smartphone, Compass } from 'lucide-react';
import { useFeatureFlags, type FeatureFlag } from '@/hooks/useFeatureFlags';

const ICONS: Record<string, any> = {
  dashboard_tour: Compass,
  recurring_transactions: Repeat,
  data_export: Download,
  forgot_password: KeyRound,
  pwa_install: Smartphone,
  onboarding_flow: Sparkles,
};

export function FeatureFlagsEditor() {
  const qc = useQueryClient();
  const { data: flags, isLoading } = useFeatureFlags();

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature_flags'] });
      toast.success('ফিচার সেটিং সংরক্ষিত হয়েছে');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          ফিচার নিয়ন্ত্রণ
        </CardTitle>
        <CardDescription>
          সাম্প্রতিক যোগ হওয়া ফিচারগুলো এখান থেকে চালু/বন্ধ করুন। বন্ধ করলে কোনো ইউজার এই ফিচার দেখতে পাবেন না।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {(flags || []).map((flag: FeatureFlag) => {
          const Icon = ICONS[flag.feature_key] || Sparkles;
          return (
            <div
              key={flag.id}
              className="flex items-start sm:items-center justify-between gap-3 rounded-lg border p-3 sm:p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label htmlFor={`flag-${flag.id}`} className="font-medium text-sm cursor-pointer">
                      {flag.label}
                    </Label>
                    <Badge variant={flag.enabled ? 'default' : 'secondary'} className="text-[10px] h-5">
                      {flag.enabled ? 'সক্রিয়' : 'বন্ধ'}
                    </Badge>
                  </div>
                  {flag.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {flag.description}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                    {flag.feature_key}
                  </p>
                </div>
              </div>
              <Switch
                id={`flag-${flag.id}`}
                checked={flag.enabled}
                disabled={toggleMutation.isPending}
                onCheckedChange={(enabled) => toggleMutation.mutate({ id: flag.id, enabled })}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
