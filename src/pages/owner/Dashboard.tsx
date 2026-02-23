import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp, Users, Scissors, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAppointments, fetchServices, fetchBarbers } from '@/lib/supabase-queries';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId || '';
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);

  useEffect(() => {
    if (!shopId) return;
    Promise.all([
      fetchAppointments(shopId),
      fetchServices(shopId),
      fetchBarbers(shopId),
    ]).then(([a, s, b]) => { setAppointments(a); setServices(s); setBarbers(b); });
  }, [shopId]);

  const data = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayApts = appointments.filter(a => a.date === today && a.status !== 'cancelled');
    const revenueToday = todayApts.reduce((sum, a) => sum + Number(a.service_price), 0);

    const currentMonth = new Date().getMonth();
    const monthApts = appointments.filter(a => {
      const m = new Date(a.date + 'T12:00').getMonth();
      return m === currentMonth && a.status !== 'cancelled';
    });
    const monthCompleted = monthApts.filter(a => a.status === 'completed');
    const revenueMonth = monthApts.reduce((sum, a) => sum + Number(a.service_price), 0);
    const avgTicket = monthApts.length > 0 ? Math.round(revenueMonth / monthApts.length) : 0;
    const monthCommission = monthCompleted.reduce((s, a) => s + Number(a.barber_earning || 0), 0);

    const serviceCount: Record<string, number> = {};
    monthApts.forEach(a => {
      const name = a.service_name || 'Serviço';
      serviceCount[name] = (serviceCount[name] || 0) + 1;
    });
    const topServices = Object.entries(serviceCount)
      .sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + '…' : name, count }));

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().split('T')[0];
      const dayApts = appointments.filter(a => a.date === iso && a.status !== 'cancelled');
      const revenue = dayApts.reduce((s, a) => s + Number(a.service_price), 0);
      return { day: d.toLocaleDateString('pt-BR', { weekday: 'short' }), revenue };
    });

    const totalSlots = barbers.length * 8 * 2;
    const occupancy = totalSlots > 0 ? Math.round((todayApts.length / totalSlots) * 100) : 0;

    return { todayApts: todayApts.length, revenueToday, revenueMonth, avgTicket, monthCommission, topServices, last7Days, occupancy, totalBarbers: barbers.length, totalServices: services.filter(s => s.active).length };
  }, [appointments, services, barbers]);

  const stats = [
    { label: 'Agendamentos Hoje', value: data.todayApts, icon: Calendar, color: 'text-info' },
    { label: 'Receita Hoje', value: `R$ ${data.revenueToday}`, icon: DollarSign, color: 'text-success' },
    { label: 'Receita Mensal', value: `R$ ${data.revenueMonth}`, icon: TrendingUp, color: 'gold-text' },
    { label: 'Ticket Médio', value: `R$ ${data.avgTicket}`, icon: BarChart3, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className={`text-2xl lg:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-5 lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Receita — Últimos 7 dias
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.last7Days}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(42, 48%, 57%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(42, 48%, 57%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 15%)', borderRadius: '12px', color: 'hsl(0, 0%, 95%)' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(42, 48%, 57%)" fill="url(#goldGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-5 space-y-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Taxa de Ocupação</span>
                <span className="text-foreground font-medium">{data.occupancy}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${data.occupancy}%` }} transition={{ duration: 1, delay: 0.6 }}
                  className="h-full gold-gradient rounded-full" />
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-3 h-3" />Barbeiros</span>
              <span className="text-sm font-medium text-foreground">{data.totalBarbers}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Scissors className="w-3 h-3" />Serviços Ativos</span>
              <span className="text-sm font-medium text-foreground">{data.totalServices}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {data.topServices.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" /> Serviços Mais Vendidos
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topServices} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 15%)', borderRadius: '12px', color: 'hsl(0, 0%, 95%)' }} />
              <Bar dataKey="count" fill="hsl(42, 48%, 57%)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
