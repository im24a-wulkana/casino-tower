import React, { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';

export function VictoryScreen() {
  const { state, resetGame } = useGame();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const isGoodEnding = state.bank >= 500_000;
  const totalProfit = state.bank - 1000;

  return (
    <div className={`overlay-screen ${visible ? 'overlay-visible' : ''}`}>
      <div className="end-card">
        {isGoodEnding ? (
          <>
            <div className="end-icon">🏆</div>
            <h1 className="end-title gold">GOOD ENDING</h1>
            <p className="end-sub">You beat the casino.</p>
          </>
        ) : (
          <>
            <div className="end-icon">🚗</div>
            <h1 className="end-title" style={{ color: '#aaa' }}>
              NEUTRAL ENDING
            </h1>
            <p className="end-sub">You survived, but barely.</p>
          </>
        )}

        <div className="end-stats">
          <div className="stat-row">
            <span className="stat-label">Final bank</span>
            <span className="stat-value mono gold">{formatMoney(state.bank)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total profit</span>
            <span className={`stat-value mono ${totalProfit >= 0 ? 'win' : 'loss'}`}>
              {totalProfit >= 0 ? '+' : ''}{formatMoney(totalProfit)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Quotas hit</span>
            <span className="stat-value mono">
              {state.gameHistory.filter((h) => h.quotaHit).length} / {state.gameHistory.length}
            </span>
          </div>
        </div>

        <button className="btn-primary" onClick={resetGame}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
