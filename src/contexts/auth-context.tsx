'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setApiKey } from '@/lib/api';

const STORAGE_KEY = 'hitch_api_key';

interface AuthContextValue {
  apiKey: string | null;
  login: (key: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
      setApiKey(stored);
    }
  }, []);

  function login(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
    setApiKey(key);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
    setApiKey(null);
  }

  return (
    <AuthContext.Provider value={{ apiKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
