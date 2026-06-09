'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, login as apiLogin, setToken, clearToken, type AuthUser } from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /** Verify the stored token and load the current admin user. */
  const loadUser = useCallback(async () => {
    try {
      const me = await getMe();
      if (!me.is_admin) {
        // Token is valid but the account doesn't have admin/moderator role
        clearToken();
        setUser(null);
      } else {
        setUser(me);
      }
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only attempt to load user if there is a stored token
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('sc_admin_token')
      : null;

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const token = await apiLogin(email, password);
    setToken(token);
    await loadUser();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
