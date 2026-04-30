import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ModeratorOnlyRoute, AdminOnlyRoute } from "@/components/RoleRoutes";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { SiteMeta } from "./components/SiteMeta";
import { BrandTheme } from "./components/BrandTheme";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { UnsupportedBrowserNotice } from "./components/UnsupportedBrowserNotice";
import { useAuth } from "@/contexts/AuthContext";

// Lazy-load every route — including auth + landing — so the initial bundle
// only contains the shell, providers, and routing logic.
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Categories = lazy(() => import("./pages/Categories"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Wallets = lazy(() => import("./pages/Wallets"));
const Loans = lazy(() => import("./pages/Loans"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Subscription = lazy(() => import("./pages/Subscription"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Terms = lazy(() => import("./pages/Terms"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const ModeratorGuide = lazy(() => import("./pages/ModeratorGuide"));
const AdminGuide = lazy(() => import("./pages/AdminGuide"));
const About = lazy(() => import("./pages/About"));
const Notifications = lazy(() => import("./pages/Notifications"));

function PageFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user) {
    return (
      <Suspense fallback={<FullScreenSpinner />}>
        <Landing />
      </Suspense>
    );
  }
  return (
    <ProtectedRoute>
      <SubscriptionProvider>
        <DashboardLayout />
      </SubscriptionProvider>
    </ProtectedRoute>
  );
}

function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (user) {
    return (
      <SubscriptionProvider>
        <DashboardLayout />
      </SubscriptionProvider>
    );
  }
  return <>{children}</>;
}

// Sensible cache defaults: avoid refetching the same data on every navigation
// or window focus, retry once on transient errors, and keep cached query data
// around long enough for back/forward navigation to feel instant.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const lazyPage = (node: React.ReactNode) => (
  <ErrorBoundary fallback={<PageFallback />}>
    <Suspense fallback={<PageFallback />}>{node}</Suspense>
  </ErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <SiteMeta />
        <BrandTheme />
        <AuthProvider>
          <WelcomeBanner />
          <Routes>
            <Route path="/login" element={lazyPage(<Login />)} />
            <Route path="/register" element={lazyPage(<Register />)} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  {lazyPage(<Onboarding />)}
                </ProtectedRoute>
              }
            />
            <Route element={<AuthAwareLayout><Outlet /></AuthAwareLayout>}>
              <Route path="/terms" element={lazyPage(<Terms />)} />
              <Route path="/user-guide" element={lazyPage(<UserGuide />)} />
            </Route>
            <Route path="/" element={<HomeRoute />}>
              <Route index element={lazyPage(<Index />)} />
            </Route>
            <Route
              element={
                <ProtectedRoute>
                  <SubscriptionProvider>
                    <DashboardLayout />
                  </SubscriptionProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/transactions" element={lazyPage(<Transactions />)} />
              <Route path="/categories" element={lazyPage(<Categories />)} />
              <Route path="/budgets" element={lazyPage(<Budgets />)} />
              <Route path="/wallets" element={lazyPage(<Wallets />)} />
              <Route path="/loans" element={lazyPage(<Loans />)} />
              <Route path="/analytics" element={lazyPage(<Reports />)} />
              <Route path="/feedback" element={lazyPage(<Feedback />)} />
              <Route path="/subscription" element={lazyPage(<Subscription />)} />
              <Route path="/admin" element={<AdminRoute>{lazyPage(<AdminPanel />)}</AdminRoute>} />
              <Route path="/moderator-guide" element={<ModeratorOnlyRoute>{lazyPage(<ModeratorGuide />)}</ModeratorOnlyRoute>} />
              <Route path="/admin-guide" element={<AdminOnlyRoute>{lazyPage(<AdminGuide />)}</AdminOnlyRoute>} />
              <Route path="/settings" element={lazyPage(<Settings />)} />
              <Route path="/about" element={lazyPage(<About />)} />
              <Route path="/notifications" element={lazyPage(<Notifications />)} />
            </Route>
            <Route path="*" element={lazyPage(<NotFound />)} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
