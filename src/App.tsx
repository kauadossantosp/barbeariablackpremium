import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { getBarbershop } from "@/lib/storage";
import Auth from "./pages/Auth";
import ClientBooking from "./pages/client/ClientBooking";
import ClientAppointments from "./pages/client/ClientAppointments";
import ClientLayout from "./components/ClientLayout";
import OwnerLayout from "./components/OwnerLayout";
import Dashboard from "./pages/owner/Dashboard";
import Services from "./pages/owner/Services";
import Barbers from "./pages/owner/Barbers";
import OwnerAppointments from "./pages/owner/Appointments";
import Financial from "./pages/owner/Financial";
import OwnerSettings from "./pages/owner/Settings";
import SuperAdmin from "./pages/admin/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role: 'client' | 'owner' | 'super_admin' }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const OwnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const shop = user?.barbershopId ? getBarbershop(user.barbershopId) : null;
  if (shop && shop.plan_status === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold text-foreground">Plano Expirado</h2>
          <p className="text-muted-foreground text-sm">Seu plano expirou. Entre em contato com o administrador para renovar.</p>
          <p className="text-xs text-muted-foreground">ID: {shop.id}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={user?.role === 'super_admin' ? '/admin' : user?.role === 'owner' ? '/owner' : '/client'} replace />
          : <Auth />
      } />

      {/* Client Routes */}
      <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout><ClientBooking /></ClientLayout></ProtectedRoute>} />
      <Route path="/client/appointments" element={<ProtectedRoute role="client"><ClientLayout><ClientAppointments /></ClientLayout></ProtectedRoute>} />

      {/* Owner Routes */}
      <Route path="/owner" element={<ProtectedRoute role="owner"><OwnerGuard><OwnerLayout><Dashboard /></OwnerLayout></OwnerGuard></ProtectedRoute>} />
      <Route path="/owner/financial" element={<ProtectedRoute role="owner"><OwnerGuard><OwnerLayout><Financial /></OwnerLayout></OwnerGuard></ProtectedRoute>} />
      <Route path="/owner/services" element={<ProtectedRoute role="owner"><OwnerGuard><OwnerLayout><Services /></OwnerLayout></OwnerGuard></ProtectedRoute>} />
      <Route path="/owner/barbers" element={<ProtectedRoute role="owner"><OwnerGuard><OwnerLayout><Barbers /></OwnerLayout></OwnerGuard></ProtectedRoute>} />
      <Route path="/owner/appointments" element={<ProtectedRoute role="owner"><OwnerGuard><OwnerLayout><OwnerAppointments /></OwnerLayout></OwnerGuard></ProtectedRoute>} />
      <Route path="/owner/settings" element={<ProtectedRoute role="owner"><OwnerGuard><OwnerLayout><OwnerSettings /></OwnerLayout></OwnerGuard></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="super_admin"><SuperAdmin /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
