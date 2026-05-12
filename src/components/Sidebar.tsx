import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney, formatTime } from '../utils/gameLogic';
import { supabase } from '../lib/supabase';

const FLOOR_LABELS: Record<number, string> = {
  1: 'LOBBY',
  2: 'MEZZ',
  3: 'HIGH',
  4: 'PENT',
};

export function Sidebar() {
  const { state, endDayManual, isDev, setFloor } = useGame();
  const [sendTarget, setSendTarget] = useState('');
  const [sendAmount, setSendAmount] = useState('1000000');
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const progress = Math.min(1, state.bank / state.quota);
  const timerUrgent = state.timeLeft <= 60;
  const quotaHit = state.bank >= state.quota;

  const sendMoney = async () => {
    const target = sendTarget.trim().toLowerCase();
    const amount = parseInt(sendAmount, 10);
    if (!target || isNaN(amount) || amount <= 0) return;

    const { data, error } = await supabase
      .from('users')
      .select('username, game_state')
      .eq('username', target)
      .maybeSingle();

    if (error || !data) {
      setSendMsg({ ok: false, text: 'User not found.' });
      return;
    }

    const gs = (data.game_state ?? {}) as Record<string, unknown>;
    const current = typeof gs.bank === 'number' ? gs.bank : 0;
    const updated = { ...gs, bank: current + amount };

    const { error: updateErr } = await supabase
      .from('users')
      .update({ game_state: updated })
      .eq('username', target);

    if (updateErr) {
      setSendMsg({ ok: false, text: 'Failed to send.' });
    } else {
      setSendMsg({ ok: true, text: `Sent $${amount.toLocaleString()} to ${target}` });
      setSendTarget('');
    }
    setTimeout(() => setSendMsg(null), 3000);
  };

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

      {isDev && (
        <div className="sidebar-section">
          <div className="sidebar-label">DEV — SEND MONEY</div>
          <div className="dev-send-wrap">
            <input
              className="dev-send-input"
              placeholder="username"
              value={sendTarget}
              onChange={e => setSendTarget(e.target.value)}
              spellCheck={false}
            />
            <input
              className="dev-send-input"
              placeholder="amount"
              value={sendAmount}
              onChange={e => setSendAmount(e.target.value)}
              type="number"
              min="1"
            />
            <button className="dev-send-btn" onClick={sendMoney}>SEND</button>
            {sendMsg && (
              <div className={`dev-send-msg ${sendMsg.ok ? 'win' : 'loss'}`}>{sendMsg.text}</div>
            )}
          </div>
        </div>
      )}

      <button className="btn-end-day" onClick={endDayManual} disabled={!quotaHit && !isDev}>
        {isDev ? 'NEXT FLOOR ↑' : quotaHit ? 'ENTER LIMO' : '🔒 QUOTA NOT MET'}
      </button>
    </aside>
  );
}
