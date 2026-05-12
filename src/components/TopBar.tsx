import React from 'react';
import { useGame } from '../store/gameStore';

interface TopBarProps {
  onLogout: () => void;
  username: string | null;
  isDev: boolean;
  onPause?: () => void;
}

export function TopBar({ onLogout, username, isDev, onPause }: TopBarProps) {
  const { state } = useGame();
  const floorLabel = ['', 'LOBBY', 'MEZZANINE', 'HIGH STAKES', 'PENTHOUSE', 'LEGEND'][state.floor];

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
        <span className="topbar-username mono">{username}</span>
        {onPause && (
          <button className="topbar-pause" onClick={onPause} title="Pause game">
            ⏸
          </button>
        )}
        <button className="topbar-logout" onClick={onLogout}>LOGOUT</button>
      </div>
    </header>
  );
}
