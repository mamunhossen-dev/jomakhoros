import { memo } from 'react';
import { Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { NotificationsPopover } from '@/components/navbar/NotificationsPopover';
import { MessagesPopover } from '@/components/navbar/MessagesPopover';
import { UserMenu } from '@/components/navbar/UserMenu';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AppNavbarBase() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="w-64 pl-9 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Each badge popover is isolated — a failed fetch never breaks the navbar. */}
        <ErrorBoundary><MessagesPopover /></ErrorBoundary>
        <ErrorBoundary><NotificationsPopover /></ErrorBoundary>
        <UserMenu />
      </div>
    </header>
  );
}

export const AppNavbar = memo(AppNavbarBase);
