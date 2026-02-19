import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointments } from '@/lib/storage';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Financial = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId || '';

  const data = useMemo(() => {
    const appointments = getAppointments(shopId).filter(a => a.status !== 'cancelled');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Daily revenue for current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayApts = appointments.filter(a => a.date === dateStr);
      return { day: String(day), revenue: dayApts.reduce((s, a) => s + a.servicePrice, 0) };
    });

    // Monthly totals
    const monthlyData: { month: string; revenue: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthApts = appointments.filter(a => {
        const d = new Date(a.date + 'T12:00');
        return d.getMonth() === m && d.getFullYear() === currentYear;
      });
      monthlyData.push({
        month: new Date(currentYear, m).toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: monthApts.reduce((s, a) => s + a.servicePrice, 0),
      });
    }

    const monthRevenue = dailyRevenue.reduce((s, d) => s + d.revenue, 0);
    const todayStr = today.toISOString().split('T')[0];
    const todayRevenue = appointments.filter(a => a.date === todayStr).reduce((s, a) => s + a.servicePrice, 0);
    const totalApts = appointments.filter(a => {
      const d = new Date(a.date + 'T12:00');
      return d.getMonth() === currentMonth;
    }).length;

    return { dailyRevenue, monthlyData, monthRevenue, todayRevenue, totalApts };
  }, [shopId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground mt-1">Acompanhe a saúde financeira do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
          <DollarSign className="w-5 h-5 text-success mb-2" />
          <p className="text-2xl font-bold text-success">R$ {data.todayRevenue}</p>
          <p className="text-xs text-muted-foreground">Receita Hoje</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <TrendingUp className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold gold-text">R$ {data.monthRevenue}</p>
          <p className="text-xs text-muted-foreground">Receita Mensal</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
          <ArrowUpRight className="w-5 h-5 text-info mb-2" />
          <p className="text-2xl font-bold text-info">{data.totalApts}</p>
          <p className="text-xs text-muted-foreground">Agendamentos no Mês</p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Receita Diária — Mês Atual</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.dailyRevenue}>
            <defs>
              <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(42, 48%, 57%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(42, 48%, 57%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 10 }} interval={2} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 15%)', borderRadius: '12px', color: 'hsl(0, 0%, 95%)' }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(42, 48%, 57%)" fill="url(#goldArea)" strokeWidth={2} />
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
            <Area type="monotone" dataKey="revenue" stroke="hsl(142, 60%, 45%)" fill="url(#greenArea)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default Financial;
