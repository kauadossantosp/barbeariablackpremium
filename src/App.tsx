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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role: 'client' | 'owner' }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'owner' ? '/owner' : '/client'} replace />
          : <Auth />
      } />

      {/* Client Routes */}
      <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout><ClientBooking /></ClientLayout></ProtectedRoute>} />
      <Route path="/client/appointments" element={<ProtectedRoute role="client"><ClientLayout><ClientAppointments /></ClientLayout></ProtectedRoute>} />

      {/* Owner Routes */}
      <Route path="/owner" element={<ProtectedRoute role="owner"><OwnerLayout><Dashboard /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/financial" element={<ProtectedRoute role="owner"><OwnerLayout><Financial /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/services" element={<ProtectedRoute role="owner"><OwnerLayout><Services /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/barbers" element={<ProtectedRoute role="owner"><OwnerLayout><Barbers /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/appointments" element={<ProtectedRoute role="owner"><OwnerLayout><OwnerAppointments /></OwnerLayout></ProtectedRoute>} />
      <Route path="/owner/settings" element={<ProtectedRoute role="owner"><OwnerLayout><OwnerSettings /></OwnerLayout></ProtectedRoute>} />

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
