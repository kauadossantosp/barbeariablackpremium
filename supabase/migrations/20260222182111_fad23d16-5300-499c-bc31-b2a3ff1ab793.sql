
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'owner', 'client');

-- 2. Drop existing tables (they're empty and incomplete)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.barbers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.barbershops CASCADE;

-- 3. Create barbershops table with all fields
CREATE TABLE public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'premium')),
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'quarterly', 'semiannual')),
  plan_price NUMERIC NOT NULL DEFAULT 67,
  plan_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  plan_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'expired')),
  payment_status TEXT NOT NULL DEFAULT 'approved' CHECK (payment_status IN ('approved', 'expired', 'pending')),
  logo TEXT DEFAULT '',
  color TEXT DEFAULT '#C6A75E',
  working_hours_start TEXT DEFAULT '09:00',
  working_hours_end TEXT DEFAULT '19:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, barbershop_id)
);

-- 5. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create barbers table
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '💈',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6],
  working_hours_start TEXT DEFAULT '09:00',
  working_hours_end TEXT DEFAULT '19:00',
  days_off TEXT[] DEFAULT ARRAY[]::TEXT[],
  commission_percentage INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL NOT NULL,
  service_name TEXT,
  service_price NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  commission_percentage INTEGER NOT NULL DEFAULT 50,
  barber_earning NUMERIC NOT NULL DEFAULT 0,
  owner_earning NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_owner_of(_barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner' AND barbershop_id = _barbershop_id
  )
$$;

-- 10. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Enable RLS on all tables
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 12. RLS: profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- 13. RLS: user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super admin can manage roles" ON public.user_roles FOR ALL USING (public.is_super_admin());
CREATE POLICY "Users can insert own client role" ON public.user_roles FOR INSERT WITH CHECK (user_id = auth.uid() AND role = 'client');

-- 14. RLS: barbershops
CREATE POLICY "Anyone can view barbershops" ON public.barbershops FOR SELECT USING (true);
CREATE POLICY "Super admin full access barbershops" ON public.barbershops FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owner can update own barbershop" ON public.barbershops FOR UPDATE USING (public.is_owner_of(id));

-- 15. RLS: services
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Super admin full access services" ON public.services FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owner can manage own services" ON public.services FOR ALL USING (public.is_owner_of(barbershop_id));

-- 16. RLS: barbers
CREATE POLICY "Anyone can view barbers" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Super admin full access barbers" ON public.barbers FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owner can manage own barbers" ON public.barbers FOR ALL USING (public.is_owner_of(barbershop_id));

-- 17. RLS: appointments
CREATE POLICY "Super admin full access appointments" ON public.appointments FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owner can manage own appointments" ON public.appointments FOR ALL USING (public.is_owner_of(barbershop_id));
CREATE POLICY "Client can view own appointments" ON public.appointments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client can create appointments" ON public.appointments FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Client can cancel own appointments" ON public.appointments FOR UPDATE USING (client_id = auth.uid() AND status = 'confirmed');
