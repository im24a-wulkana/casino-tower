import React, { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney, formatTime } from '../utils/gameLogic';

export function PauseScreen() {
  const { state, resume } = useGame();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`overlay-screen pause-overlay ${visible ? 'overlay-visible' : ''}`}>
      <div className="pause-card">
        <div className="pause-icon">⏸</div>
        <h1 className="pause-title">GAME PAUSED</h1>
        <p className="pause-sub">Your progress is saved.</p>

        <div className="pause-stats">
          <div className="pstat">
            <span className="pstat-label">Bank</span>
            <span className="pstat-value gold">{formatMoney(state.bank)}</span>
          </div>
          <div className="pstat">
            <span className="pstat-label">Day {state.day}</span>
            <span className="pstat-value">{state.day >= 15 ? 'Infinite' : formatTime(state.timeLeft)}</span>
          </div>
        </div>

        <button className="btn-primary pause-resume" onClick={resume}>
          ▶ RESUME
        </button>
      </div>
    </div>
  );
}
