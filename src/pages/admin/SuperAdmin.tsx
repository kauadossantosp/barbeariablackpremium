import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Plus, Trash2, RefreshCw, LogOut, Store, 
  Calendar, DollarSign, Check, X, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getBarbershops, createBarbershop, deleteBarbershop, createUser, getUser,
  renewPlan, refreshPlanStatuses, Barbershop 
} from '@/lib/storage';
import { toast } from 'sonner';

const planLabels: Record<string, string> = { monthly: 'Mensal', quarterly: 'Trimestral', semiannual: 'Semestral' };
const planPrices: Record<string, string> = { monthly: 'R$ 67', quarterly: 'R$ 177', semiannual: 'R$ 327' };

const SuperAdmin = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ shopName: '', ownerName: '', email: '', password: '', plan: 'pro' as 'starter' | 'pro' | 'premium', planType: 'monthly' as 'monthly' | 'quarterly' | 'semiannual' });

  refreshPlanStatuses();
  const shops = getBarbershops();

  const handleCreate = () => {
    if (!form.shopName || !form.email || !form.password || !form.ownerName) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (getUser(form.email)) {
      toast.error('Email já cadastrado');
      return;
    }
    const shop = createBarbershop({ name: form.shopName, email: form.email, password: form.password, plan: form.plan, plan_type: form.planType });
    createUser({ email: form.email, password: form.password, name: form.ownerName, role: 'owner', barbershopId: shop.id });
    setForm({ shopName: '', ownerName: '', email: '', password: '', plan: 'pro', planType: 'monthly' });
    setAdding(false);
    setRefresh(r => r + 1);
    toast.success('Barbearia criada com sucesso!');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Excluir "${name}" e todos os dados associados?`)) {
      deleteBarbershop(id);
      setRefresh(r => r + 1);
      toast.success('Barbearia excluída');
    }
  };

  const handleRenew = (id: string, planType: 'monthly' | 'quarterly' | 'semiannual') => {
    renewPlan(id, planType);
    setRefresh(r => r + 1);
    toast.success('Plano renovado!');
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground">Super Admin</h1>
              <p className="text-xs text-muted-foreground">Painel de controle da plataforma</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card">
            <Store className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold gold-text">{shops.length}</p>
            <p className="text-xs text-muted-foreground">Barbearias</p>
          </div>
          <div className="stat-card">
            <Check className="w-5 h-5 text-success mb-2" />
            <p className="text-2xl font-bold text-success">{shops.filter(s => s.plan_status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Planos Ativos</p>
          </div>
          <div className="stat-card">
            <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
            <p className="text-2xl font-bold text-destructive">{shops.filter(s => s.plan_status === 'expired').length}</p>
            <p className="text-xs text-muted-foreground">Planos Expirados</p>
          </div>
          <div className="stat-card">
            <DollarSign className="w-5 h-5 text-info mb-2" />
            <p className="text-2xl font-bold text-info">R$ {shops.filter(s => s.plan_status === 'active').reduce((s, sh) => s + (sh.plan_price || 0), 0)}</p>
            <p className="text-xs text-muted-foreground">MRR</p>
          </div>
        </div>

        {/* Add button */}
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-2xl font-bold text-foreground">Barbearias</h2>
          <button onClick={() => setAdding(true)}
            className="gold-gradient text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar Barbearia
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 gold-border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} placeholder="Nome da barbearia"
                className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} placeholder="Nome do proprietário"
                className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email do proprietário"
                className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Senha"
                className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Plano</label>
                <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value as any })}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Período</label>
                <select value={form.planType} onChange={e => setForm({ ...form, planType: e.target.value as any })}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="monthly">Mensal – R$ 67</option>
                  <option value="quarterly">Trimestral – R$ 177</option>
                  <option value="semiannual">Semestral – R$ 327</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="gold-gradient text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Criar</button>
              <button onClick={() => setAdding(false)} className="border border-border text-muted-foreground px-4 py-2 rounded-xl text-sm flex items-center gap-1"><X className="w-3 h-3" /> Cancelar</button>
            </div>
          </motion.div>
        )}

        {/* Shops list */}
        <div className="space-y-3">
          {shops.map((shop, i) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} className="glass-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground text-sm">{shop.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg ${shop.plan_status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {shop.plan_status === 'active' ? 'Ativo' : 'Expirado'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary capitalize">{shop.plan}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {shop.email} • {planLabels[shop.plan_type] || 'Mensal'} ({planPrices[shop.plan_type] || 'R$ 67'})
                    • Expira: {shop.plan_end_date ? new Date(shop.plan_end_date + 'T12:00').toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">ID: {shop.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {shop.plan_status === 'expired' && (
                    <select onChange={e => { if (e.target.value) handleRenew(shop.id, e.target.value as any); e.target.value = ''; }}
                      className="bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground">
                      <option value="">Renovar...</option>
                      <option value="monthly">Mensal – R$ 67</option>
                      <option value="quarterly">Trimestral – R$ 177</option>
                      <option value="semiannual">Semestral – R$ 327</option>
                    </select>
                  )}
                  {shop.plan_status === 'active' && (
                    <button onClick={() => handleRenew(shop.id, shop.plan_type || 'monthly')}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-info/10 text-info hover:bg-info/20 transition-colors flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Renovar
                    </button>
                  )}
                  <button onClick={() => handleDelete(shop.id, shop.name)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {shops.length === 0 && (
            <div className="glass-card p-8 text-center">
              <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma barbearia cadastrada</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdmin;
