import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'subscription_reminder_dismissed_at';
const DISMISS_HOURS = 12;

export function SubscriptionReminderBanner() {
  const { data: profile } = useProfile();
  const { accountType, isAdmin, isModerator } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(DISMISS_KEY);
    if (v) {
      const ago = (Date.now() - Number(v)) / 3600000;
      if (ago < DISMISS_HOURS) setDismissed(true);
    }
  }, []);

  const reminder = useMemo(() => {
    if (isAdmin || isModerator) return null;
    const now = new Date();

    if (accountType === 'trial' && profile?.trial_end_date) {
      const end = new Date(profile.trial_end_date);
      const days = differenceInDays(end, now);
      if (days < 0) return null;
      if (days <= 7) {
        return {
          tone: days <= 2 ? 'danger' : 'warn' as const,
          title: days === 0 ? 'আপনার ট্রায়াল আজই শেষ হবে!' : `ট্রায়াল শেষ হতে আর ${days} দিন বাকি`,
          body: 'প্রো প্ল্যান নিয়ে নিরবিচ্ছিন্নভাবে ব্যবহার চালিয়ে যান।',
          cta: 'প্ল্যান দেখুন',
        };
      }
    }

    if (accountType === 'pro' && profile?.subscription_end) {
      const end = new Date(profile.subscription_end);
      // Lifetime check
      if (end.getFullYear() >= 2099) return null;
      const days = differenceInDays(end, now);
      if (days < 0) return null;
      if (days <= 7) {
        return {
          tone: days <= 2 ? 'danger' : 'warn' as const,
          title: days === 0 ? 'আপনার সাবস্ক্রিপশন আজই শেষ হবে!' : `সাবস্ক্রিপশন শেষ হতে আর ${days} দিন বাকি`,
          body: 'এখনই রিনিউ করুন যাতে কোনো বাধা ছাড়াই সব ফিচার ব্যবহার করতে পারেন।',
          cta: 'রিনিউ করুন',
        };
      }
    }

    if (accountType === 'free') {
      return {
        tone: 'info' as const,
        title: 'আপনি ফ্রি প্ল্যানে আছেন',
        body: 'PDF এক্সপোর্ট ও সম্পূর্ণ রিপোর্ট পেতে প্রো-তে আপগ্রেড করুন।',
        cta: 'প্রো নিন',
      };
    }

    return null;
  }, [accountType, profile, isAdmin, isModerator]);

  if (!reminder || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const toneClasses = {
    danger: 'border-destructive/30 bg-destructive/10 text-destructive',
    warn: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500',
    info: 'border-primary/30 bg-primary/10 text-primary',
  }[reminder.tone];

  return (
    <div className={`mb-4 flex items-start gap-3 rounded-lg border p-3 sm:p-4 ${toneClasses}`}>
      {reminder.tone === 'danger' ? (
        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      ) : (
        <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{reminder.title}</p>
        <p className="text-xs mt-0.5 opacity-90">{reminder.body}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button asChild size="sm" variant="outline" className="bg-background/50">
          <Link to="/subscription">{reminder.cta}</Link>
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDismiss} aria-label="বন্ধ করুন">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
