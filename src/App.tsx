import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import AdminLogin from "./pages/admin/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role: 'client' | 'owner' | 'super_admin' }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const OwnerGuard = ({ children }: { children: React.ReactNode }) => {
  // Plan check can be done via fetching barbershop data in the owner pages themselves
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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
      <Route path="/admin/login" element={<AdminLogin />} />
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
