import React, { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';

const CONFETTI_CHARS = ['🎊', '🎉', '✨', '💰', '🏆', '⭐', '💎', '🌟'];

interface Confetti {
  id: number; char: string; x: number; delay: number; duration: number; size: number;
}

let confId = 0;
function makeConfetti(n: number): Confetti[] {
  return Array.from({ length: n }, () => ({
    id: confId++,
    char: CONFETTI_CHARS[Math.floor(Math.random() * CONFETTI_CHARS.length)],
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
    size: 16 + Math.floor(Math.random() * 20),
  }));
}

export function VictoryScreen() {
  const { state, newRun, resetGame } = useGame();
  const [visible, setVisible] = useState(false);
  const [confetti] = useState(() => makeConfetti(40));

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const totalProfit = state.gameHistory.reduce((sum, h) => sum + h.profit, 0);
  const quotasHit = state.gameHistory.filter(h => h.quotaHit).length;
  const nextMult = 1 + Math.log10((state.bank ?? 1) / 1_000_000) * 0.1;

  return (
    <div className={`overlay-screen victory-overlay ${visible ? 'overlay-visible' : ''}`}>
      <div className="confetti-container" aria-hidden>
        {confetti.map(c => (
          <span key={c.id} className="confetti-piece" style={{
            left: `${c.x}%`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            fontSize: `${c.size}px`,
          }}>{c.char}</span>
        ))}
      </div>

      <div className="victory-card">
        <div className="victory-glow-ring" />
        <div className="victory-icon">🏆</div>
        <h1 className="victory-title">YOU OWN<br />THE TOWER</h1>
        <p className="victory-sub">Floor 5 conquered. The casino is yours.</p>

        <div className="victory-stats">
          <div className="vstat">
            <span className="vstat-label">Final Bank</span>
            <span className="vstat-value gold">{formatMoney(state.bank)}</span>
          </div>
          <div className="vstat">
            <span className="vstat-label">Total Profit</span>
            <span className={`vstat-value ${totalProfit >= 0 ? 'win' : 'loss'}`}>
              {totalProfit >= 0 ? '+' : ''}{formatMoney(totalProfit)}
            </span>
          </div>
          <div className="vstat">
            <span className="vstat-label">Quotas Hit</span>
            <span className="vstat-value">{quotasHit} / {state.gameHistory.length}</span>
          </div>
          <div className="vstat">
            <span className="vstat-label">Collectibles</span>
            <span className="vstat-value">{(state.collectibles ?? []).length}</span>
          </div>
        </div>

        {/* New run bonus */}
        <div className="victory-bonus-banner">
          🔥 NEW RUN BONUS: <strong style={{ color: '#ffe066' }}>×{nextMult.toFixed(2)} income</strong>
          &nbsp;forever
        </div>

        <div className="victory-actions">
          <button className="btn-primary victory-btn-keep" onClick={newRun}>
            🔄 NEW RUN ({nextMult.toFixed(2)}× income)
          </button>
          <button className="btn-secondary" onClick={resetGame}>
            FRESH START
          </button>
        </div>
      </div>
    </div>
  );
}
