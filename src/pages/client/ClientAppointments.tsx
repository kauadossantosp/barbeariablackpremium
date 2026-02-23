import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Scissors, User, X, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientAppointments, updateAppointmentInDb, fetchBarbershop } from '@/lib/supabase-queries';
import { toast } from 'sonner';

const ClientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});

  const loadAppointments = async () => {
    if (!user?.id) return;
    const apts = await fetchClientAppointments(user.id);
    setAppointments(apts);
    // Load shop names
    const uniqueShopIds = [...new Set(apts.map(a => a.barbershop_id))];
    const names: Record<string, string> = {};
    await Promise.all(uniqueShopIds.map(async (id) => {
      try {
        const shop = await fetchBarbershop(id);
        names[id] = shop.name;
      } catch { names[id] = 'Barbearia'; }
    }));
    setShopNames(names);
  };

  useEffect(() => { loadAppointments(); }, [user?.id]);

  const handleCancel = async (id: string) => {
    await updateAppointmentInDb(id, { status: 'cancelled' });
    loadAppointments();
    toast.success('Agendamento cancelado');
  };

  const upcoming = appointments.filter(a => a.status === 'confirmed').sort((a, b) => a.date.localeCompare(b.date));
  const past = appointments.filter(a => a.status !== 'confirmed').sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="font-serif text-2xl font-bold text-foreground">Meus Agendamentos</h1>

      {upcoming.length === 0 && past.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum agendamento ainda</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Próximos</h2>
          {upcoming.map((apt, i) => (
            <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} className="glass-card p-4 gold-border">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-primary" /><span className="text-xs text-muted-foreground">{shopNames[apt.barbershop_id] || 'Barbearia'}</span></div>
                  <p className="font-semibold text-foreground">{apt.service_name}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(apt.date + 'T12:00').toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
                  </div>
                </div>
                <button onClick={() => handleCancel(apt.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Cancelar">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between">
                <span className="text-sm text-muted-foreground">{apt.duration}min</span>
                <span className="text-sm font-semibold gold-text">R$ {apt.service_price}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Histórico</h2>
          {past.map(apt => (
            <div key={apt.id} className="glass-card p-4 opacity-60">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{apt.service_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(apt.date + 'T12:00').toLocaleDateString('pt-BR')} • {apt.time}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg h-fit ${apt.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                  {apt.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientAppointments;
