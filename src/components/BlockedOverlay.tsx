import { Link, useLocation } from 'react-router-dom';
import { Lock, MessageCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSetting } from '@/hooks/useAppSetting';

export type BlockMessageContent = {
  title: string;
  body: string;
  support_button_label: string;
  show_logout_button: boolean;
};

export const DEFAULT_BLOCK_MESSAGE: BlockMessageContent = {
  title: 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত',
  body: 'আপনার অ্যাকাউন্টের অ্যাক্সেস সাময়িকভাবে বন্ধ করা হয়েছে। বিস্তারিত জানতে এবং সমাধানের জন্য অনুগ্রহ করে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।',
  support_button_label: 'সাপোর্টে যোগাযোগ করুন',
  show_logout_button: true,
};

// Routes a blocked user is allowed to access (so they can talk to support).
const ALLOWED_PATHS = ['/feedback', '/settings'];

export function BlockedGate({ children }: { children: React.ReactNode }) {
  const { isBlocked, blockReason, loading } = useSubscription();
  const { signOut } = useAuth();
  const { pathname } = useLocation();
  const { data: msg } = useAppSetting<BlockMessageContent>('block_message', DEFAULT_BLOCK_MESSAGE);
  const content = { ...DEFAULT_BLOCK_MESSAGE, ...(msg ?? {}) };

  if (loading || !isBlocked) return <>{children}</>;
  if (ALLOWED_PATHS.some(p => pathname.startsWith(p))) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg border-destructive/30 shadow-lg">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-display text-xl font-bold">{content.title}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{content.body}</p>
          {blockReason && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-left">
              <p className="text-xs font-medium text-destructive mb-1">কারণ:</p>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{blockReason}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button asChild className="gap-2">
              <Link to="/feedback">
                <MessageCircle className="h-4 w-4" />
                {content.support_button_label}
              </Link>
            </Button>
            {content.show_logout_button && (
              <Button variant="outline" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                লগআউট
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
