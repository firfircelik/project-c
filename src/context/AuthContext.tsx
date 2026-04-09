import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import rolesConfig from '../config/roles.json';

type Role = 'agent' | 'senior_agent' | 'branch_manager' | 'admin' | 'owner';

type DataScope = 'own' | 'branch_visible' | 'branch' | 'global';

interface RoleConfig {
  name: string;
  permissions: string[];
  data_scope: DataScope;
  bonus_features: string[];
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: Role;
  branch_id: string | null;
  tenant_name: string;
  tenant_slug: string;
  initials: string;
  title: string;
  permissions: string[];
  data_scope: DataScope;
  bonus_features: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, fullName: string, companyName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'emlakcrm_user';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getTitle(role: Role): string {
  const titles: Record<Role, string> = {
    owner: 'Sahip',
    admin: 'Yönetici',
    branch_manager: 'Şube Müdürü',
    senior_agent: 'Kıdemli Danışman',
    agent: 'Danışman'
  };
  return titles[role];
}

function getRoleConfig(role: Role): RoleConfig {
  const cfg = (rolesConfig as any).roles?.[role];
  if (cfg) return cfg as RoleConfig;
  return {
    name: 'Danışman',
    permissions: [],
    data_scope: 'own',
    bonus_features: []
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
        return;
      }

      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        const roleConfig = getRoleConfig(parsed.role);
        setUser({
          ...parsed,
          permissions: roleConfig.permissions,
          data_scope: roleConfig.data_scope,
          bonus_features: roleConfig.bonus_features
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<{ error: string | null }> {
    try {
      setLoading(true);
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return { error: signInError.message };
      }

      if (!signInData.user) {
        return { error: 'Kullanıcı bulunamadı' };
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, tenants!inner(name, slug)')
        .eq('id', signInData.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        return { error: 'Kullanıcı verisi bulunamadı' };
      }

      const newUser: User = {
        id: userData.id,
        tenant_id: userData.tenant_id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        branch_id: userData.branch_id,
        tenant_name: userData.tenants?.name || 'Emlak CRM',
        tenant_slug: userData.tenants?.slug || '',
        initials: getInitials(userData.full_name),
        title: getTitle(userData.role),
        permissions: getRoleConfig(userData.role).permissions,
        data_scope: getRoleConfig(userData.role).data_scope,
        bonus_features: getRoleConfig(userData.role).bonus_features
      };

      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Giriş başarısız' };
    } finally {
      setLoading(false);
    }
  }

  async function signup(
    email: string, 
    password: string, 
    fullName: string, 
    companyName: string
  ): Promise<{ error: string | null }> {
    try {
      setLoading(true);

      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: companyName,
          slug: slug,
          plan: 'free'
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.message.includes('duplicate')) {
          return { error: 'Bu firma adı zaten kullanılıyor. Farklı bir isim deneyin.' };
        }
        return { error: tenantError.message };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (authError) {
        await supabase.from('tenants').delete().eq('id', tenantData.id);
        return { error: authError.message };
      }

      if (!authData.user) {
        await supabase.from('tenants').delete().eq('id', tenantData.id);
        return { error: 'Kullanıcı oluşturulamadı' };
      }

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          tenant_id: tenantData.id,
          email,
          password_hash: 'supabase-auth',
          full_name: fullName,
          role: 'owner'
        });

      if (userError) {
        console.error('User insert error:', userError);
      }

      const newUser: User = {
        id: authData.user.id,
        tenant_id: tenantData.id,
        email,
        full_name: fullName,
        role: 'owner',
        branch_id: null,
        tenant_name: companyName,
        tenant_slug: slug,
        initials: getInitials(fullName),
        title: 'Sahip',
        permissions: getRoleConfig('owner').permissions,
        data_scope: getRoleConfig('owner').data_scope,
        bonus_features: getRoleConfig('owner').bonus_features
      };

      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Kayıt başarısız' };
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasPermission(permission: string) {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  }

  function hasAnyPermission(permissions: string[]) {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return permissions.some((permission) => user.permissions.includes(permission));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
