import React from 'react';
import { useParams } from 'react-router-dom';

interface RightPanelProps {
  onClose: () => void;
}

export function RightPanel({ onClose }: RightPanelProps) {
  const { gameId } = useParams();

  if (!gameId) return null;

  return (
    <aside className="right-panel">
      <div className="right-panel-header">
        <h3>📊 Game Stats</h3>
        <button className="right-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="right-panel-content">
        <section className="right-panel-section">
          <h4>My Last 10 Bets</h4>
          <p className="placeholder">No bets yet in this game</p>
        </section>

        <hr className="right-panel-divider" />

        <section className="right-panel-section">
          <h4>🏆 Top Today</h4>
          <p className="placeholder">Leaderboard loading...</p>
        </section>
      </div>
    </aside>
  );
}
