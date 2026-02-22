// Multi-tenant localStorage storage layer

export interface Barbershop {
  id: string;
  name: string;
  email: string;
  password: string;
  plan: 'starter' | 'pro' | 'premium';
  plan_type: 'monthly' | 'quarterly' | 'semiannual';
  plan_price: number;
  plan_start_date: string;
  plan_end_date: string;
  plan_status: 'active' | 'expired';
  payment_status: 'approved' | 'expired' | 'pending';
  logo: string;
  color: string;
  workingHours: { start: string; end: string };
  workingDays: number[];
  createdAt: string;
}

export interface User {
  email: string;
  password: string;
  name: string;
  role: 'client' | 'owner' | 'super_admin';
  barbershopId?: string;
}

export interface Service {
  id: string;
  barbershopId: string;
  name: string;
  price: number;
  duration: number;
  active: boolean;
}

export interface Barber {
  id: string;
  barbershopId: string;
  name: string;
  avatar: string;
  workingDays: number[];
  workingHours: { start: string; end: string };
  daysOff: string[];
  commission_percentage: number;
}

export interface Appointment {
  id: string;
  barbershopId: string;
  clientEmail: string;
  clientName: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  commission_percentage: number;
  barber_earning: number;
  owner_earning: number;
  createdAt: string;
}

const generateId = () => crypto.randomUUID();

// ===== Init super_admin =====
export const initSuperAdmin = () => {
  const users = getUsers();
  const existing = users.find(u => u.email === 'admin@platform.com');
  if (!existing) {
    users.push({ email: 'admin@platform.com', password: 'Admin@Barber2024!', name: 'Super Admin', role: 'super_admin' });
    localStorage.setItem('users', JSON.stringify(users));
  } else if (existing.password !== 'Admin@Barber2024!') {
    existing.password = 'Admin@Barber2024!';
    localStorage.setItem('users', JSON.stringify(users));
  }
};

// ===== Plan helpers =====
const planDays: Record<string, number> = { monthly: 30, quarterly: 90, semiannual: 180 };
const planPrices: Record<string, number> = { monthly: 67, quarterly: 177, semiannual: 327 };

export const calculatePlanDates = (planType: 'monthly' | 'quarterly' | 'semiannual') => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + planDays[planType]);
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], price: planPrices[planType] };
};

export const checkPlanExpiration = (shop: Barbershop): boolean => {
  if (!shop.plan_end_date) return false;
  const now = new Date().toISOString().split('T')[0];
  return now > shop.plan_end_date;
};

export const refreshPlanStatuses = () => {
  const shops = getBarbershops();
  let changed = false;
  shops.forEach(s => {
    if (s.plan_status === 'active' && checkPlanExpiration(s)) {
      s.plan_status = 'expired';
      s.payment_status = 'expired';
      changed = true;
    }
  });
  if (changed) localStorage.setItem('barbershops', JSON.stringify(shops));
};

export const renewPlan = (shopId: string, planType: 'monthly' | 'quarterly' | 'semiannual') => {
  const { start, end, price } = calculatePlanDates(planType);
  updateBarbershop(shopId, { plan_type: planType, plan_price: price, plan_start_date: start, plan_end_date: end, plan_status: 'active', payment_status: 'approved' });
};

// ===== Barbershops =====
export const getBarbershops = (): Barbershop[] => JSON.parse(localStorage.getItem('barbershops') || '[]');

export const getBarbershop = (id: string): Barbershop | undefined => getBarbershops().find(b => b.id === id);

export const createBarbershop = (data: { name: string; email: string; password: string; plan: 'starter' | 'pro' | 'premium'; plan_type: 'monthly' | 'quarterly' | 'semiannual' }): Barbershop => {
  const shops = getBarbershops();
  const { start, end, price } = calculatePlanDates(data.plan_type);
  const shop: Barbershop = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    password: data.password,
    plan: data.plan,
    plan_type: data.plan_type,
    plan_price: price,
    plan_start_date: start,
    plan_end_date: end,
    plan_status: 'active',
    payment_status: 'approved',
    logo: '',
    color: '#C6A75E',
    workingHours: { start: '09:00', end: '19:00' },
    workingDays: [1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
  };
  shops.push(shop);
  localStorage.setItem('barbershops', JSON.stringify(shops));

  // Default services
  const defaultServices: Omit<Service, 'id'>[] = [
    { barbershopId: shop.id, name: 'Corte Tradicional', price: 45, duration: 30, active: true },
    { barbershopId: shop.id, name: 'Corte + Barba', price: 65, duration: 45, active: true },
    { barbershopId: shop.id, name: 'Corte + Sobrancelha', price: 55, duration: 35, active: true },
    { barbershopId: shop.id, name: 'Corte + Barba + Sobrancelha', price: 80, duration: 60, active: true },
    { barbershopId: shop.id, name: 'Corte Premium + Hidratação', price: 95, duration: 50, active: true },
    { barbershopId: shop.id, name: 'Barba Modelada', price: 35, duration: 25, active: true },
    { barbershopId: shop.id, name: 'Pigmentação', price: 120, duration: 60, active: true },
    { barbershopId: shop.id, name: 'Combo VIP', price: 150, duration: 90, active: true },
  ];
  defaultServices.forEach(s => createService(s));

  // Default barbers with commission
  const defaultBarbers: Omit<Barber, 'id'>[] = [
    { barbershopId: shop.id, name: 'Carlos Silva', avatar: '💈', workingDays: [1,2,3,4,5,6], workingHours: { start: '09:00', end: '19:00' }, daysOff: [], commission_percentage: 50 },
    { barbershopId: shop.id, name: 'Rafael Santos', avatar: '✂️', workingDays: [1,2,3,4,5], workingHours: { start: '10:00', end: '20:00' }, daysOff: [], commission_percentage: 50 },
  ];
  defaultBarbers.forEach(b => createBarber(b));

  return shop;
};

export const updateBarbershop = (id: string, data: Partial<Barbershop>) => {
  const shops = getBarbershops();
  const idx = shops.findIndex(s => s.id === id);
  if (idx >= 0) {
    shops[idx] = { ...shops[idx], ...data };
    localStorage.setItem('barbershops', JSON.stringify(shops));
  }
};

export const deleteBarbershop = (id: string) => {
  localStorage.setItem('barbershops', JSON.stringify(getBarbershops().filter(s => s.id !== id)));
  // Remove related data
  const services: Service[] = JSON.parse(localStorage.getItem('services') || '[]');
  localStorage.setItem('services', JSON.stringify(services.filter(s => s.barbershopId !== id)));
  const barbers: Barber[] = JSON.parse(localStorage.getItem('barbers') || '[]');
  localStorage.setItem('barbers', JSON.stringify(barbers.filter(b => b.barbershopId !== id)));
  const appointments: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
  localStorage.setItem('appointments', JSON.stringify(appointments.filter(a => a.barbershopId !== id)));
  // Remove owner user
  const users = getUsers().filter(u => u.barbershopId !== id);
  localStorage.setItem('users', JSON.stringify(users));
};

// ===== Users =====
export const getUsers = (): User[] => JSON.parse(localStorage.getItem('users') || '[]');
export const getUser = (email: string): User | undefined => getUsers().find(u => u.email === email);
export const createUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
};

// ===== Services =====
export const getServices = (barbershopId: string): Service[] => {
  const all: Service[] = JSON.parse(localStorage.getItem('services') || '[]');
  return all.filter(s => s.barbershopId === barbershopId);
};

export const createService = (data: Omit<Service, 'id'>): Service => {
  const all: Service[] = JSON.parse(localStorage.getItem('services') || '[]');
  const service: Service = { ...data, id: generateId() };
  all.push(service);
  localStorage.setItem('services', JSON.stringify(all));
  return service;
};

export const updateService = (id: string, data: Partial<Service>) => {
  const all: Service[] = JSON.parse(localStorage.getItem('services') || '[]');
  const idx = all.findIndex(s => s.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
    localStorage.setItem('services', JSON.stringify(all));
  }
};

export const deleteService = (id: string) => {
  const all: Service[] = JSON.parse(localStorage.getItem('services') || '[]');
  localStorage.setItem('services', JSON.stringify(all.filter(s => s.id !== id)));
};

// ===== Barbers =====
export const getBarbers = (barbershopId: string): Barber[] => {
  const all: Barber[] = JSON.parse(localStorage.getItem('barbers') || '[]');
  return all.filter(b => b.barbershopId === barbershopId);
};

export const getBarberById = (id: string): Barber | undefined => {
  const all: Barber[] = JSON.parse(localStorage.getItem('barbers') || '[]');
  return all.find(b => b.id === id);
};

export const createBarber = (data: Omit<Barber, 'id'>): Barber => {
  const all: Barber[] = JSON.parse(localStorage.getItem('barbers') || '[]');
  const barber: Barber = { ...data, id: generateId() };
  all.push(barber);
  localStorage.setItem('barbers', JSON.stringify(all));
  return barber;
};

export const updateBarber = (id: string, data: Partial<Barber>) => {
  const all: Barber[] = JSON.parse(localStorage.getItem('barbers') || '[]');
  const idx = all.findIndex(b => b.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
    localStorage.setItem('barbers', JSON.stringify(all));
  }
};

export const deleteBarber = (id: string) => {
  const all: Barber[] = JSON.parse(localStorage.getItem('barbers') || '[]');
  localStorage.setItem('barbers', JSON.stringify(all.filter(b => b.id !== id)));
};

// ===== Appointments =====
export const getAppointments = (barbershopId: string): Appointment[] => {
  const all: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
  return all.filter(a => a.barbershopId === barbershopId);
};

export const getClientAppointments = (email: string): Appointment[] => {
  const all: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
  return all.filter(a => a.clientEmail === email);
};

export const createAppointment = (data: Omit<Appointment, 'id' | 'createdAt'>): Appointment => {
  const all: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
  const apt: Appointment = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  all.push(apt);
  localStorage.setItem('appointments', JSON.stringify(all));
  return apt;
};

export const updateAppointment = (id: string, data: Partial<Appointment>) => {
  const all: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
  const idx = all.findIndex(a => a.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
    localStorage.setItem('appointments', JSON.stringify(all));
  }
};

// ===== Helpers =====
export const getAvailableSlots = (barbershopId: string, barberId: string, date: string, duration: number): string[] => {
  const barber = getBarbers(barbershopId).find(b => b.id === barberId);
  const shop = getBarbershop(barbershopId);
  if (!barber || !shop) return [];

  const hours = barber.workingHours;
  const startH = parseInt(hours.start.split(':')[0]);
  const endH = parseInt(hours.end.split(':')[0]);

  const appointments = getAppointments(barbershopId).filter(
    a => a.barberId === barberId && a.date === date && a.status !== 'cancelled'
  );

  const slots: string[] = [];
  for (let h = startH; h < endH; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const slotEnd = h * 60 + m + duration;
      if (slotEnd > endH * 60) continue;

      const conflict = appointments.some(a => {
        const aStart = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
        const aEnd = aStart + a.duration;
        const sStart = h * 60 + m;
        const sEnd = sStart + duration;
        return sStart < aEnd && sEnd > aStart;
      });

      if (!conflict) slots.push(time);
    }
  }
  return slots;
};
