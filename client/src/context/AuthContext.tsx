import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, clearToken } from '../lib/api';

interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  register: (username: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const data = await api<User>('/auth/me');
      setUser(data);
    } catch {
      clearToken();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('gg_token');
    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithToken = async (token: string) => {
    setToken(token);
    await fetchMe();
  };

  const register = async (username: string) => {
    const data = await api<{ id: number; username: string; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    setToken(data.token);
    setUser({ id: data.id, username: data.username, display_name: username, avatar_url: null, is_admin: false });
  };

  const login = async (username: string) => {
    const data = await api<{ id: number; username: string; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    setToken(data.token);
    setUser({ id: data.id, username: data.username, display_name: username, avatar_url: null, is_admin: false });
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
