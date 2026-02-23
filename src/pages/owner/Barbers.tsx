import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Check, X, Percent } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBarbers, createBarberInDb, deleteBarberInDb } from '@/lib/supabase-queries';
import { toast } from 'sonner';

const avatars = ['💈', '✂️', '🪒', '👨‍🦱', '🧔', '💇‍♂️'];
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const Barbers = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId || '';
  const [barbers, setBarbers] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', avatar: '💈', workingDays: [1, 2, 3, 4, 5, 6], startHour: '09:00', endHour: '19:00', commission: 50 });

  const loadBarbers = async () => {
    if (!shopId) return;
    const data = await fetchBarbers(shopId);
    setBarbers(data);
  };

  useEffect(() => { loadBarbers(); }, [shopId]);

  const handleAdd = async () => {
    if (!form.name) return;
    await createBarberInDb({
      barbershop_id: shopId, name: form.name, avatar: form.avatar,
      working_days: form.workingDays, working_hours_start: form.startHour, working_hours_end: form.endHour,
      days_off: [], commission_percentage: form.commission,
    });
    setForm({ name: '', avatar: '💈', workingDays: [1, 2, 3, 4, 5, 6], startHour: '09:00', endHour: '19:00', commission: 50 });
    setAdding(false);
    loadBarbers();
    toast.success('Barbeiro adicionado!');
  };

  const handleDelete = async (id: string) => {
    await deleteBarberInDb(id);
    loadBarbers();
    toast.success('Barbeiro removido!');
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      workingDays: f.workingDays.includes(day) ? f.workingDays.filter(d => d !== day) : [...f.workingDays, day],
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Barbeiros</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua equipe</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="gold-gradient text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 gold-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do barbeiro"
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-2">
              {avatars.map(a => (
                <button key={a} onClick={() => setForm({ ...form, avatar: a })}
                  className={`text-2xl p-2 rounded-xl transition-all ${form.avatar === a ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-secondary/50'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Dias de trabalho</p>
            <div className="flex gap-2">
              {dayNames.map((name, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    form.workingDays.includes(i) ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/30 text-muted-foreground border border-border'
                  }`}>{name}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Início</label>
              <input type="time" value={form.startHour} onChange={e => setForm({ ...form, startHour: e.target.value })}
                className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fim</label>
              <input type="time" value={form.endHour} onChange={e => setForm({ ...form, endHour: e.target.value })}
                className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1"><Percent className="w-3 h-3" /> Comissão: {form.commission}%</label>
            <Slider value={[form.commission]} onValueChange={v => setForm({ ...form, commission: v[0] })} min={0} max={100} step={5} className="mt-1" />
          </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="gold-gradient text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Salvar</button>
            <button onClick={() => setAdding(false)} className="border border-border text-muted-foreground px-4 py-2 rounded-xl text-sm flex items-center gap-1"><X className="w-3 h-3" /> Cancelar</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {barbers.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{b.avatar}</span>
                <div>
                  <p className="font-semibold text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.working_hours_start} - {b.working_hours_end}</p>
                  <p className="text-xs text-primary">{b.commission_percentage ?? 50}% comissão</p>
                </div>
              </div>
              <button onClick={() => handleDelete(b.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1 mt-3">
              {dayNames.map((name, idx) => (
                <span key={idx} className={`text-[10px] px-1.5 py-1 rounded-md ${(b.working_days || []).includes(idx) ? 'bg-primary/15 text-primary' : 'bg-secondary/30 text-muted-foreground'}`}>
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Barbers;
