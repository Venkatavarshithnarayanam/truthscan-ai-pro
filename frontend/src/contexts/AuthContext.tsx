import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  plan: 'pro' | 'enterprise' | 'free';
  avatar?: string;
  joinedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  organization?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'truthscan_user';

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string,
    remember = true
  ): Promise<{ success: boolean; error?: string }> => {
    // Demo mode: any valid email + password ≥ 6 chars
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Simulate network latency
    await new Promise(r => setTimeout(r, 900));

    const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    const newUser: User = {
      id: generateId(),
      name: nameFromEmail,
      email,
      plan: 'pro',
      joinedAt: new Date().toISOString(),
    };

    setUser(newUser);
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    }
    return { success: true };
  }, []);

  const signup = useCallback(async (
    data: SignupData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    await new Promise(r => setTimeout(r, 1100));

    const newUser: User = {
      id: generateId(),
      name: data.name.trim(),
      email: data.email,
      organization: data.organization,
      role: data.role,
      plan: 'pro',
      joinedAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Helper to get avatar initials for display
export function getUserInitials(user: User | null): string {
  if (!user) return '??';
  return getInitials(user.name);
}
