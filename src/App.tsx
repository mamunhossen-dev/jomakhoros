import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "@/contexts/AuthContext";

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

function PageFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Landing />;
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
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user) {
    return (
      <SubscriptionProvider>
        <DashboardLayout />
      </SubscriptionProvider>
    );
  }
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><Onboarding /></Suspense></ProtectedRoute>} />
            <Route element={<AuthAwareLayout><Outlet /></AuthAwareLayout>}>
              <Route path="/terms" element={<Suspense fallback={<PageFallback />}><Terms /></Suspense>} />
              <Route path="/user-guide" element={<Suspense fallback={<PageFallback />}><UserGuide /></Suspense>} />
            </Route>
            <Route path="/" element={<HomeRoute />}>
              <Route index element={<Index />} />
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
              <Route path="/transactions" element={<Suspense fallback={<PageFallback />}><Transactions /></Suspense>} />
              <Route path="/categories" element={<Suspense fallback={<PageFallback />}><Categories /></Suspense>} />
              <Route path="/budgets" element={<Suspense fallback={<PageFallback />}><Budgets /></Suspense>} />
              <Route path="/wallets" element={<Suspense fallback={<PageFallback />}><Wallets /></Suspense>} />
              <Route path="/loans" element={<Suspense fallback={<PageFallback />}><Loans /></Suspense>} />
              <Route path="/analytics" element={<Suspense fallback={<PageFallback />}><Reports /></Suspense>} />
              <Route path="/feedback" element={<Suspense fallback={<PageFallback />}><Feedback /></Suspense>} />
              <Route path="/subscription" element={<Suspense fallback={<PageFallback />}><Subscription /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<PageFallback />}><AdminPanel /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
