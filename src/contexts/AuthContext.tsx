import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'owner' | 'super_admin';
  barbershopId?: string;
}

interface AuthContextType {
  user: AppUser | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AppUser | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  isAuthenticated: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

async function fetchAppUser(supabaseUser: SupabaseUser): Promise<AppUser | null> {
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  // Get roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, barbershop_id')
    .eq('user_id', supabaseUser.id);

  // Determine primary role
  let role: AppUser['role'] = 'client';
  let barbershopId: string | undefined;

  if (roles && roles.length > 0) {
    const superAdmin = roles.find(r => r.role === 'super_admin');
    const owner = roles.find(r => r.role === 'owner');
    if (superAdmin) {
      role = 'super_admin';
    } else if (owner) {
      role = 'owner';
      barbershopId = owner.barbershop_id || undefined;
    }
  }

  return {
    id: supabaseUser.id,
    email: profile?.email || supabaseUser.email || '',
    name: profile?.name || String(supabaseUser.user_metadata?.name || ''),
    role,
    barbershopId,
  };
}

async function ensureAuthData(supabaseUser: SupabaseUser): Promise<void> {
  const profilePayload = {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: String(supabaseUser.user_metadata?.name || ''),
  };

  await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });

  const { data: roles } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', supabaseUser.id)
    .limit(1);

  if (!roles || roles.length === 0) {
    await supabase.from('user_roles').insert({
      user_id: supabaseUser.id,
      role: 'client' as const,
    });
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        // Use setTimeout to avoid deadlock with Supabase auth
        setTimeout(async () => {
          await ensureAuthData(session.user);
          const appUser = await fetchAppUser(session.user);
          setUser(appUser);
          setLoading(false);
        }, 0);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await ensureAuthData(session.user);
        const appUser = await fetchAppUser(session.user);
        setUser(appUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: AppUser | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      await ensureAuthData(data.user);
      const appUser = await fetchAppUser(data.user);
      return { success: true, user: appUser };
    }
    return { success: true, user: null };
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) return { success: false, error: error.message };

    if (data.user) {
      await ensureAuthData(data.user);
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, signup, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
