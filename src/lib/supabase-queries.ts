import { supabase } from '@/integrations/supabase/client';

// ===== Barbershops =====
export const fetchBarbershops = async () => {
  const { data, error } = await supabase.from('barbershops').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchBarbershop = async (id: string) => {
  const { data, error } = await supabase.from('barbershops').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const createBarbershopInDb = async (shopData: {
  name: string;
  owner_id: string;
  plan?: string;
  plan_type?: string;
  plan_price?: number;
  plan_start_date?: string;
  plan_end_date?: string;
}) => {
  const { data, error } = await supabase.from('barbershops').insert(shopData).select().single();
  if (error) throw error;
  return data;
};

export const updateBarbershopInDb = async (id: string, updates: Record<string, any>) => {
  const { error } = await supabase.from('barbershops').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteBarbershopInDb = async (id: string) => {
  const { error } = await supabase.from('barbershops').delete().eq('id', id);
  if (error) throw error;
};

// ===== Services =====
export const fetchServices = async (barbershopId: string) => {
  const { data, error } = await supabase.from('services').select('*').eq('barbershop_id', barbershopId);
  if (error) throw error;
  return data || [];
};

export const createServiceInDb = async (service: { barbershop_id: string; name: string; price: number; duration: number; active?: boolean }) => {
  const { data, error } = await supabase.from('services').insert(service).select().single();
  if (error) throw error;
  return data;
};

export const updateServiceInDb = async (id: string, updates: Record<string, any>) => {
  const { error } = await supabase.from('services').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteServiceInDb = async (id: string) => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
};

// ===== Barbers =====
export const fetchBarbers = async (barbershopId: string) => {
  const { data, error } = await supabase.from('barbers').select('*').eq('barbershop_id', barbershopId);
  if (error) throw error;
  return data || [];
};

export const createBarberInDb = async (barber: {
  barbershop_id: string; name: string; avatar?: string;
  working_days?: number[]; working_hours_start?: string; working_hours_end?: string;
  days_off?: string[]; commission_percentage?: number;
}) => {
  const { data, error } = await supabase.from('barbers').insert(barber).select().single();
  if (error) throw error;
  return data;
};

export const deleteBarberInDb = async (id: string) => {
  const { error } = await supabase.from('barbers').delete().eq('id', id);
  if (error) throw error;
};

// ===== Appointments =====
export const fetchAppointments = async (barbershopId: string) => {
  const { data, error } = await supabase.from('appointments').select('*').eq('barbershop_id', barbershopId);
  if (error) throw error;
  return data || [];
};

export const fetchClientAppointments = async (clientId: string) => {
  const { data, error } = await supabase.from('appointments').select('*').eq('client_id', clientId);
  if (error) throw error;
  return data || [];
};

export const createAppointmentInDb = async (apt: {
  barbershop_id: string; client_id: string; client_name: string;
  barber_id: string; service_id: string; service_name: string;
  service_price: number; date: string; time: string; duration: number;
  commission_percentage: number; barber_earning: number; owner_earning: number;
}) => {
  const { data, error } = await supabase.from('appointments').insert(apt).select().single();
  if (error) throw error;
  return data;
};

export const updateAppointmentInDb = async (id: string, updates: Record<string, any>) => {
  const { error } = await supabase.from('appointments').update(updates).eq('id', id);
  if (error) throw error;
};

// ===== Available Slots =====
export const getAvailableSlotsFromDb = async (
  barbershopId: string, barberId: string, date: string, duration: number,
  barberStart: string, barberEnd: string
): Promise<string[]> => {
  const { data: appointments } = await supabase
    .from('appointments')
    .select('time, duration')
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .eq('date', date)
    .neq('status', 'cancelled');

  const startH = parseInt(barberStart.split(':')[0]);
  const endH = parseInt(barberEnd.split(':')[0]);

  const slots: string[] = [];
  for (let h = startH; h < endH; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const slotEnd = h * 60 + m + duration;
      if (slotEnd > endH * 60) continue;

      const conflict = (appointments || []).some(a => {
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

// ===== Plan helpers =====
const planDays: Record<string, number> = { monthly: 30, quarterly: 90, semiannual: 180 };
const planPrices: Record<string, number> = { monthly: 67, quarterly: 177, semiannual: 327 };

export const calculatePlanDates = (planType: string) => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + (planDays[planType] || 30));
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], price: planPrices[planType] || 67 };
};

// ===== User Roles =====
export const assignOwnerRole = async (userId: string, barbershopId: string) => {
  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'owner' as const,
    barbershop_id: barbershopId,
  });
  if (error) throw error;
};
