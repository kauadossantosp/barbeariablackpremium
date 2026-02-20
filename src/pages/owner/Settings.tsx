import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Palette, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getBarbershop, updateBarbershop } from '@/lib/storage';
import { toast } from 'sonner';

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const OwnerSettings = () => {
  const { user } = useAuth();
  const shop = user?.barbershopId ? getBarbershop(user.barbershopId) : null;
  
  const [name, setName] = useState(shop?.name || '');
  const [color, setColor] = useState(shop?.color || '#C6A75E');
  const [startHour, setStartHour] = useState(shop?.workingHours.start || '09:00');
  const [endHour, setEndHour] = useState(shop?.workingHours.end || '19:00');
  const [workingDays, setWorkingDays] = useState(shop?.workingDays || [1,2,3,4,5,6]);

  const toggleDay = (day: number) => {
    setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = () => {
    if (!user?.barbershopId) return;
    updateBarbershop(user.barbershopId, {
      name, color,
      workingHours: { start: startHour, end: endHour },
      workingDays,
    });
    toast.success('Configurações salvas!');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize sua barbearia</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Nome da Barbearia</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2"><Palette className="w-3 h-3" /> Cor Personalizada</label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent" />
            <span className="text-sm text-muted-foreground">{color}</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2"><Clock className="w-3 h-3" /> Horário de Funcionamento</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Abertura</label>
              <input type="time" value={startHour} onChange={e => setStartHour(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fechamento</label>
              <input type="time" value={endHour} onChange={e => setEndHour(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Dias de Funcionamento</label>
          <div className="flex gap-2">
            {dayNames.map((name, i) => (
              <button key={i} onClick={() => toggleDay(i)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  workingDays.includes(i) ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/30 text-muted-foreground border border-border'
                }`}>{name}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">Plano: <span className="capitalize gold-text">{shop?.plan}</span></p>
            <p className="text-xs text-muted-foreground">Período: {shop?.plan_type === 'quarterly' ? 'Trimestral' : shop?.plan_type === 'semiannual' ? 'Semestral' : 'Mensal'} • R$ {shop?.plan_price || 0}</p>
            <p className="text-xs text-muted-foreground">Status: <span className={shop?.plan_status === 'active' ? 'text-success' : 'text-destructive'}>{shop?.plan_status === 'active' ? 'Ativo' : 'Expirado'}</span></p>
            <p className="text-xs text-muted-foreground">Expira: {shop?.plan_end_date ? new Date(shop.plan_end_date + 'T12:00').toLocaleDateString('pt-BR') : 'N/A'}</p>
            <p className="text-[10px] text-muted-foreground/60">ID: {shop?.id}</p>
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Salvar Configurações
        </button>
      </motion.div>
    </div>
  );
};

export default OwnerSettings;
