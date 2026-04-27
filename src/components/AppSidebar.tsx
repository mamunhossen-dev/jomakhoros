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
  X,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'ড্যাশবোর্ড', url: '/', icon: LayoutDashboard },
  { title: 'লেনদেন', url: '/transactions', icon: ArrowUpDown },
  { title: 'ক্যাটাগরি', url: '/categories', icon: Tag },
  { title: 'ওয়ালেট', url: '/wallets', icon: Smartphone },
  { title: 'দেনা/পাওনা', url: '/loans', icon: HandCoins },
  { title: 'বাজেট', url: '/budgets', icon: Wallet },
  { title: 'বিশ্লেষণ', url: '/analytics', icon: PieChart },
  { title: 'ফিডব্যাক', url: '/feedback', icon: MessageSquare },
  { title: 'সাবস্ক্রিপশন', url: '/subscription', icon: CreditCard },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const { isAdmin, isModerator } = useSubscription();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 md:collapsible-icon">
      <SidebarContent className="bg-sidebar pt-4">
        <div className="flex items-center justify-between px-4 pb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
              <DollarSign className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-display text-lg font-bold text-sidebar-foreground">JomaKhoros</span>
            )}
          </div>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">সাধারণ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} onClick={closeMobileSidebar} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-4">
        <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">সাইন আউট</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
