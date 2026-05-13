import React, { useState } from 'react';
import { useGame } from '../store/gameStore';

interface TopBarProps {
  onLogout: () => void;
  username: string | null;
  isDev: boolean;
  onPause?: () => void;
}

export function TopBar({ onLogout, username, isDev, onPause }: TopBarProps) {
  const { state, curseUser } = useGame();
  const [curseInput, setCurseInput] = useState('');
  const [showCursePanel, setShowCursePanel] = useState(false);
  const floorLabel = ['', 'LOBBY', 'MEZZANINE', 'HIGH STAKES', 'PENTHOUSE', 'LEGEND'][state.floor];

  const handleCurseUser = () => {
    if (curseInput.trim()) {
      curseUser(curseInput.trim());
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
            placeholder="Username to curse..."
            value={curseInput}
            onChange={e => setCurseInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleCurseUser()}
            autoFocus
          />
          <button onClick={handleCurseUser}>CURSE</button>
          <button onClick={() => setShowCursePanel(false)}>CANCEL</button>
        </div>
      )}
    </header>
  );
}
