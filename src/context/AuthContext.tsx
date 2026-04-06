import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'admin' | 'agent';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  title: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Başlangıçta kullanıcı giriş yapmamış (null)
  const [user, setUser] = useState<User | null>(null);

  const login = (role: Role) => {
    if (role === 'admin') {
      setUser({ 
        id: '1', 
        name: 'Batuhan Yağlu', 
        email: 'batuhan@emlakcrm.com', 
        role: 'admin', 
        initials: 'BY', 
        title: 'Şube Müdürü' 
      });
    } else {
      setUser({ 
        id: '2', 
        name: 'Ayşe Kaya', 
        email: 'ayse@emlakcrm.com', 
        role: 'agent', 
        initials: 'AK', 
        title: 'Gayrimenkul Danışmanı' 
      });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
