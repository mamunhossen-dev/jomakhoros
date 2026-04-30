import { Navigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

/** Allow only authenticated moderators (NOT admins) to access. */
export function ModeratorOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isModerator, isAdmin, loading } = useSubscription();
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  // Moderators OR admins can read the moderator guide (admins should know what moderators see).
  if (!isModerator && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Allow only admins. */
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useSubscription();
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
