import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AppNavbar } from '@/components/AppNavbar';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function DashboardLayout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppNavbar />
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            {/* Section-level isolation: a failure in one page doesn't break the shell. */}
            <ErrorBoundary
              fallback={
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-muted-foreground">
                  এই অংশটি লোড করা যায়নি। পেজ রিফ্রেশ করুন।
                </div>
              }
            >
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
