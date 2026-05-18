import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { FLOOR_LABELS } from '../utils/gameLogic';

interface TopBarProps {
  onLogout: () => void;
  username: string | null;
  isDev: boolean;
  onPause?: () => void;
}

export function TopBar({ onLogout, username, isDev, onPause }: TopBarProps) {
  const { state, curseUser, uncurseUser } = useGame();
  const [curseInput, setCurseInput] = useState('');
  const [curseDuration, setCurseDuration] = useState('5'); // minutes, "0" for permanent
  const [showCursePanel, setShowCursePanel] = useState(false);
  const floorLabel = FLOOR_LABELS[state.floor] ?? '';

  const handleCurseUser = () => {
    if (curseInput.trim()) {
      const minutes = parseInt(curseDuration) || 0;
      const durationMs = minutes === 0 ? 0 : minutes * 60 * 1000;
      curseUser(curseInput.trim(), durationMs);
      setCurseInput('');
      setShowCursePanel(false);
    }
  };

  const handleUncurseUser = () => {
    if (curseInput.trim()) {
      uncurseUser(curseInput.trim());
      setCurseInput('');
      setShowCursePanel(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-title">CASINO TOWER</span>
        <span className="topbar-divider">|</span>
        <span className="topbar-floor">{floorLabel} — FLOOR {state.floor}</span>
        {isDev && <span className="topbar-dev-badge">DEV</span>}
      </div>
      <div className="topbar-day">
        <span className="topbar-day-label">DAY</span>
        <span className="topbar-day-num">{isDev ? '∞' : state.day}</span>
        {!isDev && <span className="topbar-day-label">/ 15</span>}
      </div>
      <div className="topbar-user">
        {isDev && (
          <button className="topbar-curse-btn" onClick={() => setShowCursePanel(!showCursePanel)} title="Curse a user">
            🧿
          </button>
        )}
        <span className="topbar-username mono">{username}</span>
        {onPause && (
          <button className="topbar-pause" onClick={onPause} title="Pause game">
            ⏸
          </button>
        )}
        <button className="topbar-logout" onClick={onLogout}>LOGOUT</button>
      </div>

      {/* Dev curse panel */}
      {isDev && showCursePanel && (
        <div className="topbar-curse-panel">
          <input
            type="text"
            placeholder="Username..."
            value={curseInput}
            onChange={e => setCurseInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleCurseUser()}
            autoFocus
          />
          <input
            type="number"
            placeholder="Minutes (0=permanent)"
            min="0"
            value={curseDuration}
            onChange={e => setCurseDuration(e.target.value)}
            style={{ width: '80px' }}
          />
          <button onClick={handleCurseUser} title="Curse user with bad luck">CURSE</button>
          <button onClick={handleUncurseUser} title="Remove curse">UNCURSE</button>
          <button onClick={() => setShowCursePanel(false)}>CANCEL</button>
        </div>
      )}
    </header>
  );
}
