import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, DollarSign, Scissors, Users, Calendar, 
  Settings, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getBarbershop } from '@/lib/storage';

const menuItems = [
  { path: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/owner/financial', icon: DollarSign, label: 'Financeiro' },
  { path: '/owner/services', icon: Scissors, label: 'Serviços' },
  { path: '/owner/barbers', icon: Users, label: 'Barbeiros' },
  { path: '/owner/appointments', icon: Calendar, label: 'Agendamentos' },
  { path: '/owner/settings', icon: Settings, label: 'Configurações' },
];

const OwnerLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shop = user?.barbershopId ? getBarbershop(user.barbershopId) : null;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground truncate text-sm">{shop?.name || 'BarberPro'}</h2>
              <p className="text-xs text-muted-foreground capitalize">{shop?.plan}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
        <div className="flex justify-around py-2 px-2">
          {menuItems.slice(0, 5).map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[56px] ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground min-w-[56px]">
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">Mais</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border p-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSidebarOpen(false)} className="mb-4"><X className="w-5 h-5 text-muted-foreground" /></button>
            <nav className="space-y-1">
              {menuItems.map(item => (
                <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                    location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  <item.icon className="w-4 h-4" /> {item.label}
                </button>
              ))}
            </nav>
            <button onClick={handleLogout} className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:p-8 p-4 pb-24 lg:pb-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default OwnerLayout;
