import {
  LayoutDashboard,
  ArrowUpDown,
  PieChart,
  Wallet,
  DollarSign,
  Tag,
  Smartphone,
  HandCoins,
  MessageSquare,
  CreditCard,
  Shield,
  ShieldCheck,
  BookOpen,
  Info,
  Repeat,
  X,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFeatureFlag, useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useBrand } from '@/hooks/useBrand';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

// Each item can optionally specify a feature_key — if that flag exists and is disabled, the item is hidden
const baseMainItems = [
  { title: 'ড্যাশবোর্ড', url: '/', icon: LayoutDashboard, key: 'dashboard' },
  { title: 'লেনদেন', url: '/transactions', icon: ArrowUpDown, key: 'transactions' },
  { title: 'পুনরাবৃত্তি', url: '/recurring', icon: Repeat, key: 'recurring_transactions' },
  { title: 'ক্যাটাগরি', url: '/categories', icon: Tag, key: 'categories' },
  { title: 'ওয়ালেট', url: '/wallets', icon: Smartphone, key: 'wallets' },
  { title: 'দেনা/পাওনা', url: '/loans', icon: HandCoins, key: 'loans' },
  { title: 'বাজেট', url: '/budgets', icon: Wallet, key: 'budgets' },
  { title: 'বিশ্লেষণ', url: '/analytics', icon: PieChart, key: 'analytics' },
  { title: 'ফিডব্যাক', url: '/feedback', icon: MessageSquare, key: 'feedback_form' },
  { title: 'সাবস্ক্রিপশন', url: '/subscription', icon: CreditCard, key: 'subscription' },
  { title: 'About', url: '/about', icon: Info, key: 'about' },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin, isModerator } = useSubscription();
  const isMobile = useIsMobile();
  const brand = useBrand();
  const { data: allFlags } = useFeatureFlags();

  const mainItems = baseMainItems.filter((item) => {
    // If a flag with this key exists, respect its enabled state
    const flag = allFlags?.find((f) => f.feature_key === item.key);
    if (flag && !flag.enabled && flag.disable_mode === 'hide') return false;
    return true;
  });

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 md:collapsible-icon">
      <SidebarContent className="bg-sidebar pt-4">
        <div className="flex items-center justify-between px-4 pb-6">
          <Link to="/" onClick={closeMobileSidebar} className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
              <DollarSign className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-display text-lg font-bold text-sidebar-foreground">{brand.name}</span>
            )}
          </Link>
          {isMobile && (
            <button onClick={closeMobileSidebar} className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">মেনু</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/'} onClick={closeMobileSidebar} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isModerator) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">অ্যাডমিন</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" onClick={closeMobileSidebar} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Shield className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">অ্যাডমিন প্যানেল</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isModerator && !isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/moderator-guide" onClick={closeMobileSidebar} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <BookOpen className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">মডারেটর গাইড</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin-guide" onClick={closeMobileSidebar} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <ShieldCheck className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">এডমিন গাইড</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
