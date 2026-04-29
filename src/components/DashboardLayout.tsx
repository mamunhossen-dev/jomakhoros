import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AppNavbar } from '@/components/AppNavbar';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BlockedGate } from '@/components/BlockedOverlay';
import { SubscriptionReminderBanner } from '@/components/SubscriptionReminderBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Record last_login_at once per session
  useEffect(() => {
    if (!user) return;
    supabase.rpc('touch_last_login').then(() => {});
  }, [user?.id]);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppNavbar />
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            <ErrorBoundary
              fallback={
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-muted-foreground">
                  এই অংশটি লোড করা যায়নি। পেজ রিফ্রেশ করুন।
                </div>
              }
            >
              <BlockedGate>
                <SubscriptionReminderBanner />
                <Outlet />
              </BlockedGate>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
