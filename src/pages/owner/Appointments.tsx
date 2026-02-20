import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointments, updateAppointment, getBarberById } from '@/lib/storage';

const statusLabels: Record<string, string> = { confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };
const statusColors: Record<string, string> = { confirmed: 'bg-info/10 text-info', completed: 'bg-success/10 text-success', cancelled: 'bg-destructive/10 text-destructive' };

const OwnerAppointments = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId || '';
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);

  const appointments = getAppointments(shopId)
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.clientName.toLowerCase().includes(search.toLowerCase()) || a.serviceName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const handleStatusChange = (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    const updates: any = { status };
    if (status === 'completed') {
      // Recalculate commission based on current barber commission
      const apt = getAppointments(shopId).find(a => a.id === id);
      if (apt) {
        const barber = getBarberById(apt.barberId);
        const commission = barber?.commission_percentage ?? apt.commission_percentage ?? 50;
        const barberEarning = Math.round(apt.servicePrice * commission / 100);
        updates.commission_percentage = commission;
        updates.barber_earning = barberEarning;
        updates.owner_earning = apt.servicePrice - barberEarning;
      }
    }
    updateAppointment(id, updates);
    setRefresh(r => r + 1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Agendamentos</h1>
        <p className="text-muted-foreground mt-1">Todos os agendamentos da barbearia</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente ou serviço..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex gap-2">
          {['all', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filter === f ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/30 text-muted-foreground border border-border hover:bg-secondary/50'}`}>
              {f === 'all' ? 'Todos' : statusLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {appointments.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum agendamento encontrado</p>
          </div>
        )}
        {appointments.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }} className="glass-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground text-sm">{a.clientName}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.serviceName} • {a.barberName} • {new Date(a.date + 'T12:00').toLocaleDateString('pt-BR')} às {a.time}</p>
                {a.status === 'completed' && a.barber_earning != null && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Barbeiro: R$ {a.barber_earning} ({a.commission_percentage}%) • Proprietário: R$ {a.owner_earning}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold gold-text">R$ {a.servicePrice}</span>
                {a.status === 'confirmed' && (
                  <div className="flex gap-1">
                    <button onClick={() => handleStatusChange(a.id, 'completed')}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-success/10 text-success hover:bg-success/20 transition-colors">Concluir</button>
                    <button onClick={() => handleStatusChange(a.id, 'cancelled')}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">Cancelar</button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OwnerAppointments;
