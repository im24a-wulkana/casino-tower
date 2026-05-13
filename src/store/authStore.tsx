import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  refreshGameState: () => Promise<GameState | null>;
  onDBUpdate: (cb: (state: GameState) => void) => () => void;
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

  // Debounced save to avoid hammering database
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<GameState | null>(null);

  const isDev = username === DEV_USERNAME;
  const dbUpdateListeners = useRef<Set<(state: GameState) => void>>(new Set());

  // Subscribe to Realtime updates for the logged-in user's row
  useEffect(() => {
    if (!username || username === DEV_USERNAME) return;
    const channel = supabase
      .channel(`user:${username}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `username=eq.${username}` },
        payload => {
          const gs = (payload.new as Record<string, unknown>).game_state as GameState | null;
          if (!gs) return;
          setCachedGameState(username, gs);
          setLoadedState(gs);
          dbUpdateListeners.current.forEach(cb => cb(gs));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [username]);

  const onDBUpdate = useCallback((cb: (state: GameState) => void) => {
    dbUpdateListeners.current.add(cb);
    return () => { dbUpdateListeners.current.delete(cb); };
  }, []);

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
    pendingStateRef.current = state;

    // Clear existing timeout and set a new one for debouncing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const stateToSave = pendingStateRef.current;
      if (stateToSave) {
        // Fire-and-forget upsert — we don't await to avoid blocking the game loop
        supabase.from('users')
          .update({ game_state: stateToSave })
          .eq('username', username)
          .then(({ error }) => {
            if (error) console.warn('saveGameState DB error:', error.message);
          });
      }
      saveTimeoutRef.current = null;
    }, 1000); // Debounce for 1 second
  }, [username]);

  const loadGameState = useCallback((): GameState | null => {
    return loadedState;
  }, [loadedState]);

  const refreshGameState = useCallback(async (): Promise<GameState | null> => {
    if (!username || username === DEV_USERNAME) return null;
    try {
      const { data, error } = await supabase.from('users')
        .select('game_state')
        .eq('username', username)
        .single();
      if (error) {
        console.error('refreshGameState error:', error);
        return loadedState;
      }
      if (data?.game_state) {
        setCachedGameState(username, data.game_state);
        setLoadedState(data.game_state);
        return data.game_state;
      }
      return loadedState;
    } catch (err) {
      console.error('refreshGameState exception:', err);
      return loadedState;
    }
  }, [username, loadedState]);

  // Ensure pending state is saved on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending state immediately on unmount
      if (pendingStateRef.current && username && username !== DEV_USERNAME) {
        supabase.from('users')
          .update({ game_state: pendingStateRef.current })
          .eq('username', username)
          .catch(err => console.warn('Unmount save error:', err));
      }
    };
  }, [username]);

  return (
    <AuthContext.Provider value={{ username, isDev, login, register, logout, saveGameState, loadGameState, refreshGameState, onDBUpdate }}>
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
