import React from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney, formatTime } from '../utils/gameLogic';

const FLOOR_LABELS: Record<number, string> = {
  1: 'LOBBY',
  2: 'MEZZ',
  3: 'HIGH',
  4: 'PENT',
};

export function Sidebar() {
  const { state, endDayManual, isDev, setFloor } = useGame();

  const progress = Math.min(1, state.bank / state.quota);
  const timerUrgent = state.timeLeft <= 60;
  const quotaHit = state.bank >= state.quota;

  return (
    <aside className="sidebar">
      {/* Bank */}
      <div className="sidebar-section">
        <div className="sidebar-label">BANK</div>
        <div className="sidebar-bank">{formatMoney(state.bank)}</div>
      </div>

      {/* Quota */}
      <div className="sidebar-section">
        <div className="sidebar-label">DAILY QUOTA</div>
        <div className={`sidebar-quota ${quotaHit ? 'quota-hit' : ''}`}>
          {formatMoney(state.quota)}
        </div>
        <div className="quota-bar-wrap">
          <div
            className={`quota-bar-fill ${quotaHit ? 'quota-bar-done' : ''}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="quota-pct">
          {quotaHit ? '✓ QUOTA HIT' : `${Math.round(progress * 100)}% to quota`}
        </div>
      </div>

      {/* Timer */}
      <div className="sidebar-section">
        <div className="sidebar-label">TIME LEFT</div>
        <div className={`sidebar-timer ${timerUrgent ? 'timer-urgent' : ''}`}>
          {formatTime(state.timeLeft)}
        </div>
      </div>

      {/* History */}
      {state.gameHistory.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-label">HISTORY</div>
          <div className="history-list">
            {[...state.gameHistory].reverse().slice(0, 5).map((h) => (
              <div key={h.day} className="history-row">
                <span className="history-day">D{h.day}</span>
                <span className={`history-profit ${h.profit >= 0 ? 'win' : 'loss'}`}>
                  {h.profit >= 0 ? '+' : ''}{formatMoney(h.profit)}
                </span>
                <span className={`history-quota ${h.quotaHit ? 'quota-hit-small' : 'quota-miss-small'}`}>
                  {h.quotaHit ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDev && (
        <div className="sidebar-section">
          <div className="sidebar-label">DEV — FLOOR SELECT</div>
          <div className="dev-floor-btns">
            {[1, 2, 3, 4].map(f => (
              <button
                key={f}
                className={`dev-floor-btn ${state.floor === f ? 'dev-floor-active' : ''}`}
                onClick={() => setFloor(f)}
              >
                {FLOOR_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="btn-end-day" onClick={endDayManual} disabled={!quotaHit && !isDev}>
        {isDev ? 'NEXT FLOOR ↑' : quotaHit ? 'ENTER LIMO' : '🔒 QUOTA NOT MET'}
      </button>
    </aside>
  );
}
