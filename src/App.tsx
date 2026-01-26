import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TrackingProvider } from "@/contexts/TrackingContext";
import { PointsProvider } from "@/contexts/PointsContext";
import { GamificationTriggerProvider } from "@/contexts/GamificationTriggerContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { isCustomDomain } from "@/lib/utils";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AffiliateTerms from "./pages/AffiliateTerms";
import AffiliateProgram from "./pages/AffiliateProgram";
import PartnerProgram from "./pages/PartnerProgram";
import VerifyEmail from "./pages/VerifyEmail";
import GoogleCallback from "./pages/GoogleCallback";
import Dashboard from "./pages/Dashboard";
import Reels from "./pages/Reels";
import Builder from "./pages/Builder";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import Affiliates from "./pages/Affiliates";
// Lazy load de páginas públicas para code splitting
const PublicQuiz = lazy(() => import("./pages/PublicQuiz"));
const PreviewQuiz = lazy(() => import("./pages/PreviewQuiz"));
const TemplateShare = lazy(() => import("./pages/TemplateShare"));
const Checkout = lazy(() => import("./pages/Checkout"));
// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminGateways from "./pages/admin/AdminGateways";
import AdminSMTP from "./pages/admin/AdminSMTP";
import AdminBroadcast from "./pages/admin/AdminBroadcast";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAffiliates from "./pages/admin/AdminAffiliates";
import AdminAffiliateDetail from "./pages/admin/AdminAffiliateDetail";
import NotFound from "./pages/NotFound";

// Loading component para lazy loaded routes
const PageLoader = () => (
  <div className="fixed inset-0 bg-black flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-white animate-spin" />
  </div>
);

// Componente para rota raiz que decide entre Index e PublicQuiz baseado no domínio
const RootRoute = () => {
  // Se for domínio personalizado, renderizar PublicQuiz (que vai buscar pelo domínio)
  // Caso contrário, renderizar Index (página inicial da plataforma)
  if (isCustomDomain()) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicQuiz />
      </Suspense>
    );
  }
  return <Index />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Não refazer requisição ao focar na janela
      refetchOnMount: false, // Não refazer requisição ao montar componente
      refetchOnReconnect: false, // Não refazer requisição ao reconectar
      refetchInterval: false, // Desabilitar refetch automático completamente
      staleTime: 5 * 60 * 1000, // Considerar dados "frescos" por 5 minutos
      gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos (antigo cacheTime)
      retry: 1, // Tentar apenas 1 vez em caso de erro
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <PointsProvider>
          <GamificationTriggerProvider>
            <TrackingProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/affiliate-terms" element={<AffiliateTerms />} />
              <Route path="/affiliate-program" element={<AffiliateProgram />} />
              <Route path="/partner-program" element={<PartnerProgram />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/confirm-email/:token" element={<VerifyEmail />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/reels" element={<Reels />} />
              <Route
                path="/preview/:slug"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <PreviewQuiz />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/builder/:reelId?"
                element={
                  <ProtectedRoute>
                    <Builder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/builder/:reelId/results"
                element={
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/:planId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Checkout />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/affiliates"
                element={
                  <ProtectedRoute>
                    <Affiliates />
                  </ProtectedRoute>
                }
              />
              {/* Admin Routes */}
              <Route
                path="/ananindeua"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="plans" element={<AdminPlans />} />
                <Route path="gateways" element={<AdminGateways />} />
                <Route path="smtp" element={<AdminSMTP />} />
                <Route path="broadcast" element={<AdminBroadcast />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="affiliates" element={<AdminAffiliates />} />
                <Route path="affiliates/:id" element={<AdminAffiliateDetail />} />
              </Route>
              {/* Rota pública para templates compartilhados */}
              <Route
                path="/template/:token"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TemplateShare />
                  </Suspense>
                }
              />
              {/* Rota pública para swippers - deve vir depois das rotas fixas */}
              <Route 
                path="/:slug" 
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PublicQuiz />
                  </Suspense>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </TrackingProvider>
          </GamificationTriggerProvider>
        </PointsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
