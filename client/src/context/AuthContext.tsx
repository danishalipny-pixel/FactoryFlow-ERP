import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/erp';
import { apiRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('factoryflow_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('factoryflow_token');
      if (storedToken) {
        try {
          const res = await apiRequest<{ user: User }>('/auth/me');
          setUser(res.user);
        } catch (err) {
          console.error('Failed to restore session, re-authenticating as admin');
          await autoLoginDefault();
        }
      } else {
        await autoLoginDefault();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const autoLoginDefault = async () => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@factoryflow.eg',
          password: 'FactoryFlow@2026',
        }),
      });
      localStorage.setItem('factoryflow_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (e) {
      console.error('Auto login failed:', e);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    localStorage.setItem('factoryflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('factoryflow_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: string) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ targetRole }),
      });
      localStorage.setItem('factoryflow_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
