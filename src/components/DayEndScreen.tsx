import React, { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney, quotaForDay } from '../utils/gameLogic';

export function DayEndScreen() {
  const { state, startNextDay } = useGame();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const lastEntry = state.gameHistory[state.gameHistory.length - 1];
  if (!lastEntry) return null;

  const { quotaHit, profit, penalty, startBank, endBank, day } = lastEntry;
  const isLastDay = day >= 15;

  return (
    <div className={`overlay-screen ${visible ? 'overlay-visible' : ''}`}>
      <div className="day-end-card">
        <div className={`day-end-banner ${quotaHit ? 'banner-win' : 'banner-loss'}`}>
          {quotaHit ? '✓ QUOTA HIT' : '✗ QUOTA MISSED'}
        </div>

        <h1 className="day-end-title">END OF DAY {day}</h1>

        <div className="day-end-stats">
          <StatRow label="Started with" value={formatMoney(startBank)} />
          <StatRow label="Ended with" value={formatMoney(endBank)} />
          <StatRow
            label="Profit / Loss"
            value={(profit >= 0 ? '+' : '') + formatMoney(profit)}
            className={profit >= 0 ? 'win' : 'loss'}
          />
          {penalty > 0 && (
            <StatRow
              label="Quota penalty"
              value={`-${formatMoney(penalty)}`}
              className="loss"
            />
          )}
        </div>

        {!isLastDay && quotaHit && (
          <div className="day-end-next">
            <p className="day-end-hint">Day {day + 1} awaits...</p>
            <p className="day-end-quota">Next quota: <strong>{formatMoney(quotaForDay(day + 1))}</strong></p>
            <button className="btn-primary btn-limo" onClick={startNextDay}>
              🚗 ENTER LIMO
            </button>
          </div>
        )}

        {!isLastDay && !quotaHit && (
          <div className="day-end-next">
            <p className="day-end-hint loss">Quota missed — game over.</p>
            <button className="btn-primary btn-danger" onClick={startNextDay}>
              LEAVE THE TOWER
            </button>
          </div>
        )}

        {isLastDay && (
          <button className="btn-primary btn-limo" onClick={startNextDay}>
            SEE YOUR ENDING →
          </button>
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-value mono ${className}`}>{value}</span>
    </div>
  );
}
