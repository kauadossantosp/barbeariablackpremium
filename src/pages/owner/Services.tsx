import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Power, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchServices, createServiceInDb, updateServiceInDb, deleteServiceInDb } from '@/lib/supabase-queries';
import { toast } from 'sonner';

const Services = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId || '';
  const [services, setServices] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', duration: '' });

  const loadServices = async () => {
    if (!shopId) return;
    const data = await fetchServices(shopId);
    setServices(data);
  };

  useEffect(() => { loadServices(); }, [shopId]);

  const handleAdd = async () => {
    if (!form.name || !form.price || !form.duration) return;
    await createServiceInDb({ barbershop_id: shopId, name: form.name, price: Number(form.price), duration: Number(form.duration), active: true });
    setForm({ name: '', price: '', duration: '' });
    setAdding(false);
    loadServices();
    toast.success('Serviço criado!');
  };

  const handleUpdate = async (id: string) => {
    await updateServiceInDb(id, { name: form.name, price: Number(form.price), duration: Number(form.duration) });
    setEditing(null);
    loadServices();
    toast.success('Serviço atualizado!');
  };

  const handleToggle = async (id: string, active: boolean) => {
    await updateServiceInDb(id, { active: !active });
    loadServices();
  };

  const handleDelete = async (id: string) => {
    await deleteServiceInDb(id);
    loadServices();
    toast.success('Serviço removido!');
  };

  const startEdit = (s: any) => {
    setEditing(s.id);
    setForm({ name: s.name, price: String(s.price), duration: String(s.duration) });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground mt-1">Gerencie os serviços oferecidos</p>
        </div>
        <button onClick={() => { setAdding(true); setForm({ name: '', price: '', duration: '' }); }}
          className="gold-gradient text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 gold-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do serviço"
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Preço (R$)"
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="Duração (min)"
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="gold-gradient text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Salvar
            </button>
            <button onClick={() => setAdding(false)} className="border border-border text-muted-foreground px-4 py-2 rounded-xl text-sm flex items-center gap-1 hover:bg-secondary/50">
              <X className="w-3 h-3" /> Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {services.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className={`glass-card p-4 flex items-center gap-4 ${!s.active ? 'opacity-50' : ''}`}>
            {editing === s.id ? (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                  className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">R$ {s.price} • {s.duration}min</p>
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {editing === s.id ? (
                <>
                  <button onClick={() => handleUpdate(s.id)} className="p-2 text-success hover:bg-success/10 rounded-lg"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(null)} className="p-2 text-muted-foreground hover:bg-secondary/50 rounded-lg"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => handleToggle(s.id, s.active)} className={`p-2 rounded-lg transition-colors ${s.active ? 'text-success hover:bg-success/10' : 'text-muted-foreground hover:bg-secondary/50'}`}>
                    <Power className="w-4 h-4" />
                  </button>
                  <button onClick={() => startEdit(s)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Services;
