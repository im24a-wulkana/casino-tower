import React, { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';

export function GameOverScreen() {
  const { resetGame, state } = useGame();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const daysPlayed = state.gameHistory.length;

  return (
    <div className={`overlay-screen overlay-dark ${visible ? 'overlay-visible' : ''}`}>
      <div className="end-card">
        <div className="end-skull">💀</div>
        <h1 className="end-title red">GAME OVER</h1>
        <p className="end-sub">The house always wins.</p>
        <p className="end-detail">
          You survived <strong>{daysPlayed}</strong> day{daysPlayed !== 1 ? 's' : ''} before
          going bankrupt.
        </p>
        <button className="btn-primary btn-danger" onClick={resetGame}>
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}
