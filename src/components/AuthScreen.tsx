import React, { useState } from 'react';
import { useAuth } from '../store/authStore';

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = mode === 'login'
      ? await login(username.trim(), password)
      : await register(username.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🎰</span>
          <div className="auth-logo-title">CASINO TOWER</div>
          <div className="auth-logo-sub">FLOORS 1–5 · 19 GAMES · 15 DAYS</div>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
          >
            LOGIN
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('register'); setError(null); }}
          >
            REGISTER
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">USERNAME</label>
            <input
              className="auth-input mono"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              maxLength={24}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">PASSWORD</label>
            <input
              className="auth-input mono"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'LOADING…' : mode === 'login' ? 'ENTER THE TOWER' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="auth-hint">
          {mode === 'login'
            ? "New here? Register to save your progress."
            : "Already have an account? Log in above."}
        </div>
      </div>
    </div>
  );
}
