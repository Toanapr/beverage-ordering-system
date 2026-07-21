import { createContext, useContext, useEffect, useState } from 'react';
import { request } from '../lib/api';
import type { Role, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { email: string; password: string; fullName: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'moc_access_token';
const USER_KEY = 'moc_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [ready, setReady] = useState(false);

  function persist(nextToken: string | null, nextUser: User | null) {
    setToken(nextToken);
    setUser(nextUser);
    if (nextToken && nextUser) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    request<User>('/auth/me', {}, token)
      .then((currentUser) => persist(token, currentUser))
      .catch(() => persist(null, null))
      .finally(() => setReady(true));
  }, [token]);

  async function login(email: string, password: string) {
    const data = await request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    persist(data.accessToken, data.user);
    return data.user;
  }

  async function register(payload: { email: string; password: string; fullName: string }) {
    const created = await request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return login(payload.email, payload.password).then(() => created);
  }

  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST' }, token);
    } finally {
      persist(null, null);
    }
  }

  const value = { user, token, ready, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function roleHome(role: Role) {
  if (role === 'admin') return '/admin';
  if (role === 'staff') return '/staff';
  return '/';
}
