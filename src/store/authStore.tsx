import React, { createContext, useContext, useState, useCallback } from 'react';
import { GameState } from '../types';

const DEV_USERNAME = 'dev';
const DEV_PASSWORD = 'dev123';
const USERS_KEY = 'ct_users';
const SESSION_KEY = 'ct_session';

export interface UserRecord {
  passwordHash: string;
  gameState: GameState | null;
}

export interface AuthContextValue {
  username: string | null;
  isDev: boolean;
  login: (username: string, password: string) => string | null;
  register: (username: string, password: string) => string | null;
  logout: () => void;
  saveGameState: (state: GameState) => void;
  loadGameState: () => GameState | null;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return h.toString(16);
}

function getUsers(): Record<string, UserRecord> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, UserRecord>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s).username : null;
    } catch {
      return null;
    }
  });

  const isDev = username === DEV_USERNAME;

  const login = useCallback((user: string, pass: string): string | null => {
    if (user === DEV_USERNAME) {
      if (pass !== DEV_PASSWORD) return 'Invalid password.';
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user }));
      setUsername(user);
      return null;
    }
    const users = getUsers();
    const record = users[user.toLowerCase()];
    if (!record) return 'Account not found.';
    if (record.passwordHash !== simpleHash(pass)) return 'Invalid password.';
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.toLowerCase() }));
    setUsername(user.toLowerCase());
    return null;
  }, []);

  const register = useCallback((user: string, pass: string): string | null => {
    const key = user.toLowerCase();
    if (key === DEV_USERNAME) return 'That username is reserved.';
    if (key.length < 3) return 'Username must be at least 3 characters.';
    if (pass.length < 4) return 'Password must be at least 4 characters.';
    const users = getUsers();
    if (users[key]) return 'Username already taken.';
    users[key] = { passwordHash: simpleHash(pass), gameState: null };
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: key }));
    setUsername(key);
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUsername(null);
  }, []);

  const saveGameState = useCallback((state: GameState) => {
    if (!username || username === DEV_USERNAME) return;
    const users = getUsers();
    if (users[username]) {
      users[username].gameState = state;
      saveUsers(users);
    }
  }, [username]);

  const loadGameState = useCallback((): GameState | null => {
    if (!username || username === DEV_USERNAME) return null;
    const users = getUsers();
    return users[username]?.gameState ?? null;
  }, [username]);

  return (
    <AuthContext.Provider value={{ username, isDev, login, register, logout, saveGameState, loadGameState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
