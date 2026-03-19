import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '@/config/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'ai_ledger_token';
const USER_KEY = 'ai_ledger_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setCurrentOrg(parsed.organizations?.[0] || null);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setUser(data.user);
    setCurrentOrg(data.user.organizations?.[0] || null);

    return data.user;
  }, []);

  const register = useCallback(async (registrationData) => {
    const { data } = await api.post('/auth/register', registrationData);

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setUser(data.user);
    setCurrentOrg(data.user.organizations?.[0] || null);

    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setCurrentOrg(null);
  }, []);

  const switchOrg = useCallback(
    (orgId) => {
      if (!user?.organizations) return;

      const org = user.organizations.find((o) => o.id === orgId);
      if (org) {
        setCurrentOrg(org);
      }
    },
    [user]
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    currentOrg,
    login,
    register,
    logout,
    switchOrg,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
