import { Navigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isModerator, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
