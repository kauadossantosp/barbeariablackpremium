import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Calendar, LogOut, Scissors } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ClientLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  const tabs = [
    { path: '/client', icon: MessageSquare, label: 'Agendar' },
    { path: '/client/appointments', icon: Calendar, label: 'Meus Agendamentos' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif font-semibold gold-text">BarberPro</span>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map(tab => (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                location.pathname === tab.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default ClientLayout;
