import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ArrowUpRight, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAppointments, fetchBarbers } from '@/lib/supabase-queries';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Financial = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId || '';
  const [appointments, setAppointments] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);

  useEffect(() => {
    if (!shopId) return;
    Promise.all([fetchAppointments(shopId), fetchBarbers(shopId)]).then(([a, b]) => { setAppointments(a); setBarbers(b); });
  }, [shopId]);

  const data = useMemo(() => {
    const allApts = appointments.filter(a => a.status !== 'cancelled');
    const completed = allApts.filter(a => a.status === 'completed');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayApts = completed.filter(a => a.date === dateStr);
      const revenue = dayApts.reduce((s, a) => s + Number(a.service_price), 0);
      const commission = dayApts.reduce((s, a) => s + Number(a.barber_earning || 0), 0);
      return { day: String(day), revenue, commission, profit: revenue - commission };
    });

    const monthlyData = [];
    for (let m = 0; m < 12; m++) {
      const monthApts = completed.filter(a => { const d = new Date(a.date + 'T12:00'); return d.getMonth() === m && d.getFullYear() === currentYear; });
      const rev = monthApts.reduce((s, a) => s + Number(a.service_price), 0);
      const com = monthApts.reduce((s, a) => s + Number(a.barber_earning || 0), 0);
      monthlyData.push({ month: new Date(currentYear, m).toLocaleDateString('pt-BR', { month: 'short' }), revenue: rev, commission: com, profit: rev - com });
    }

    const monthCompleted = completed.filter(a => { const d = new Date(a.date + 'T12:00'); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    const monthRevenue = monthCompleted.reduce((s, a) => s + Number(a.service_price), 0);
    const monthCommission = monthCompleted.reduce((s, a) => s + Number(a.barber_earning || 0), 0);
    const monthProfit = monthRevenue - monthCommission;

    const todayStr = today.toISOString().split('T')[0];
    const todayCompleted = completed.filter(a => a.date === todayStr);
    const todayRevenue = todayCompleted.reduce((s, a) => s + Number(a.service_price), 0);

    const barberRevenue = barbers.map(b => {
      const bApts = monthCompleted.filter(a => a.barber_id === b.id);
      const total = bApts.reduce((s, a) => s + Number(a.service_price), 0);
      const earning = bApts.reduce((s, a) => s + Number(a.barber_earning || 0), 0);
      return { name: b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name, total, earning, count: bApts.length };
    }).sort((a, b) => b.total - a.total);

    return { dailyRevenue, monthlyData, monthRevenue, monthCommission, monthProfit, todayRevenue, barberRevenue };
  }, [appointments, barbers]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground mt-1">Acompanhe a saúde financeira do seu negócio</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
          <DollarSign className="w-5 h-5 text-success mb-2" />
          <p className="text-2xl font-bold text-success">R$ {data.todayRevenue}</p>
          <p className="text-xs text-muted-foreground">Receita Hoje</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <TrendingUp className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold gold-text">R$ {data.monthRevenue}</p>
          <p className="text-xs text-muted-foreground">Receita Bruta</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card">
          <Users className="w-5 h-5 text-warning mb-2" />
          <p className="text-2xl font-bold text-warning">R$ {data.monthCommission}</p>
          <p className="text-xs text-muted-foreground">Pago Barbeiros</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
          <ArrowUpRight className="w-5 h-5 text-info mb-2" />
          <p className="text-2xl font-bold text-info">R$ {data.monthProfit}</p>
          <p className="text-xs text-muted-foreground">Lucro Líquido</p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Receita vs Comissão — Mês Atual</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.dailyRevenue}>
            <defs>
              <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(42, 48%, 57%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(42, 48%, 57%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 10 }} interval={2} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 15%)', borderRadius: '12px', color: 'hsl(0, 0%, 95%)' }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(42, 48%, 57%)" fill="url(#goldArea)" strokeWidth={2} name="Receita" />
            <Area type="monotone" dataKey="profit" stroke="hsl(142, 60%, 45%)" fill="url(#profitArea)" strokeWidth={2} name="Lucro" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Receita Mensal — {new Date().getFullYear()}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.monthlyData}>
            <defs>
              <linearGradient id="greenArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 15%)', borderRadius: '12px', color: 'hsl(0, 0%, 95%)' }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(42, 48%, 57%)" fill="url(#goldArea)" strokeWidth={2} name="Bruta" />
            <Area type="monotone" dataKey="profit" stroke="hsl(142, 60%, 45%)" fill="url(#greenArea)" strokeWidth={2} name="Lucro" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {data.barberRevenue.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Ranking de Barbeiros — Mês Atual
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(120, data.barberRevenue.length * 45)}>
            <BarChart data={data.barberRevenue} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ background: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 15%)', borderRadius: '12px', color: 'hsl(0, 0%, 95%)' }} />
              <Bar dataKey="total" fill="hsl(42, 48%, 57%)" radius={[0, 8, 8, 0]} name="Receita" />
              <Bar dataKey="earning" fill="hsl(142, 60%, 45%)" radius={[0, 8, 8, 0]} name="Comissão" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.barberRevenue.map(b => (
              <div key={b.name} className="flex items-center justify-between text-sm border-t border-border pt-2">
                <span className="text-foreground">{b.name}</span>
                <div className="flex gap-4 text-xs">
                  <span className="text-muted-foreground">{b.count} serviços</span>
                  <span className="gold-text">R$ {b.total}</span>
                  <span className="text-success">R$ {b.earning} comissão</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Financial;
