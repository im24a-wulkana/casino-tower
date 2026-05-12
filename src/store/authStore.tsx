import React, { createContext, useContext, useState, useCallback } from 'react';
import { GameState } from '../types';
import { supabase } from '../lib/supabase';

const DEV_USERNAME = 'dev';
const DEV_PASSWORD = 'dev123';
const SESSION_KEY = 'ct_session';

export interface AuthContextValue {
  username: string | null;
  isDev: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  saveGameState: (state: GameState) => void;
  loadGameState: () => GameState | null;
}

// Kept for local game-state caching (not auth)
const GAME_CACHE_KEY = 'ct_gs_cache';

function getCachedGameState(username: string): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj[username] ?? null;
  } catch { return null; }
}

function setCachedGameState(username: string, state: GameState) {
  try {
    const raw = localStorage.getItem(GAME_CACHE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[username] = state;
    localStorage.setItem(GAME_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s).username : null;
    } catch { return null; }
  });

  // Loaded game state is stored here so loadGameState() can return it synchronously
  const [loadedState, setLoadedState] = useState<GameState | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      const u = s ? JSON.parse(s).username : null;
      if (!u || u === DEV_USERNAME) return null;
      return getCachedGameState(u);
    } catch { return null; }
  });

  const isDev = username === DEV_USERNAME;

  const login = useCallback(async (user: string, pass: string): Promise<string | null> => {
    const key = user.toLowerCase().trim();

    // Dev shortcut — never hits the DB
    if (key === DEV_USERNAME) {
      if (pass !== DEV_PASSWORD) return 'Invalid password.';
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: key }));
      setUsername(key);
      setLoadedState(null);
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('username, game_state')
      .eq('username', key)
      .eq('password_hash', simpleHash(pass))
      .maybeSingle();

    if (error) return 'Login failed. Try again.';
    if (!data) return 'Invalid username or password.';

    const gs: GameState | null = data.game_state ?? null;
    if (gs) setCachedGameState(key, gs);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: key }));
    setUsername(key);
    setLoadedState(gs);
    return null;
  }, []);

  const register = useCallback(async (user: string, pass: string): Promise<string | null> => {
    const key = user.toLowerCase().trim();
    if (key === DEV_USERNAME) return 'That username is reserved.';
    if (key.length < 3) return 'Username must be at least 3 characters.';
    if (!/^[a-z0-9_]+$/.test(key)) return 'Only letters, numbers, and underscores.';
    if (pass.length < 4) return 'Password must be at least 4 characters.';

    const { error } = await supabase.from('users').insert({
      username: key,
      password_hash: simpleHash(pass),
      game_state: null,
    });

    if (error) {
      if (error.code === '23505') return 'Username already taken.';
      return 'Registration failed. Try again.';
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: key }));
    setUsername(key);
    setLoadedState(null);
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUsername(null);
    setLoadedState(null);
  }, []);

  const saveGameState = useCallback((state: GameState) => {
    if (!username || username === DEV_USERNAME) return;
    setCachedGameState(username, state);
    // Fire-and-forget upsert — we don't await to avoid blocking the game loop
    supabase.from('users')
      .update({ game_state: state })
      .eq('username', username)
      .then(({ error }) => {
        if (error) console.warn('saveGameState DB error:', error.message);
      });
  }, [username]);

  const loadGameState = useCallback((): GameState | null => {
    return loadedState;
  }, [loadedState]);

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

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return h.toString(16);
}
