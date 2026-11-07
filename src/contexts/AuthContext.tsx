import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'GERENTE' | 'CAIXA';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email?: string;
  active: boolean;
  terminalId?: string;
}

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  GERENTE: {
    id: 'usr-gerente-01',
    full_name: 'Miguel Worscoi (Gerente Geral)',
    role: 'GERENTE',
    email: 'admin@masakula.co.ao',
    active: true,
    terminalId: 'Terminal Master 01'
  },
  CAIXA: {
    id: 'usr-caixa-01',
    full_name: 'Operador de Balcão (Frente de Loja)',
    role: 'CAIXA',
    email: 'caixa@masakula.co.ao',
    active: true,
    terminalId: 'Caixa 01 - Balcão Principal'
  }
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string, overrideRole?: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  switchRole: (role: UserRole) => void;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  verifyManagerPassword: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const STORAGE_KEY = 'masakula_auth_profile_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved profile:', e);
    }
    return DEMO_PROFILES.GERENTE;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (e) {
        console.warn('Error persisting profile:', e);
      }
    }
  }, [profile]);

  useEffect(() => {
    // Obter sessão inicial do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    }).catch(err => console.warn('Supabase auth getSession notice:', err));

    // Escutar alterações na autenticação
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || 'Utilizador Masakula',
          role: (data.role?.toUpperCase() === 'GERENTE' ? 'GERENTE' : 'CAIXA') as UserRole,
          email: data.email,
          active: data.active ?? true,
          terminalId: data.terminal_id || 'Caixa 01'
        });
      }
    } catch (err) {
      console.warn('Supabase fetchProfile fallback:', err);
    }
  };

  const signIn = async (email: string, pass: string, overrideRole?: UserRole) => {
    setLoading(true);
    try {
      // 1. Tenta autenticar no Supabase
      const result = await supabase.auth.signInWithPassword({ email, password: pass });
      
      if (!result.error && result.data.user) {
        await fetchProfile(result.data.user.id);
        setLoading(false);
        return result;
      }
    } catch (err) {
      console.warn('Supabase signIn notice, applying local role auth:', err);
    }

    // 2. Fallback / Modo Offline / Demo
    const targetRole: UserRole = overrideRole || (
      email.toLowerCase().includes('admin') || 
      email.toLowerCase().includes('gerente') || 
      email.toLowerCase().includes('miguel') 
        ? 'GERENTE' 
        : 'CAIXA'
    );

    const chosenProfile = DEMO_PROFILES[targetRole];
    setProfile({
      ...chosenProfile,
      email,
      full_name: email.toLowerCase().includes('miguel') 
        ? 'Miguel Worscoi (Gerente Geral)' 
        : targetRole === 'GERENTE' 
          ? 'Gerente Administrativo' 
          : 'Operador de Caixa'
    });

    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut notice:', err);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!profile) return false;
    return allowedRoles.includes(profile.role);
  };

  const switchRole = (role: UserRole) => {
    const newProfile = DEMO_PROFILES[role];
    setProfile(newProfile);
  };

  const verifyManagerPassword = (password: string): boolean => {
    // Aceita a senha padrão de gerente ou 1234 / admin / admin2026
    const clean = password.trim().toLowerCase();
    return clean === 'admin2026' || clean === 'admin' || clean === '1234' || clean === 'gerente2026' || clean === 'gerente';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signOut, 
      hasRole, 
      switchRole, 
      setProfile,
      verifyManagerPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

