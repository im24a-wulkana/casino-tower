import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney, formatTime } from '../utils/gameLogic';
import { supabase } from '../lib/supabase';
import { rarityColor, RARITY_ORDER } from '../games/collectibles';
import { Collectible } from '../types';
import { Leaderboard } from './Leaderboard';

const FLOOR_LABELS: Record<number, string> = {
  1: 'LOBBY', 2: 'MEZZ', 3: 'HIGH', 4: 'PENT', 5: 'LEGEND',
};

export function Sidebar() {
  const { state, endDayManual, ascend, isDev, setFloor } = useGame();
  const [sendTarget, setSendTarget] = useState('');
  const [sendAmount, setSendAmount] = useState('1000000');
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const progress = Math.min(1, state.bank / state.quota);
  const timerUrgent = state.timeLeft <= 60;
  const quotaHit = state.bank >= state.quota;
  const isLastDay = state.day >= 15;
  const collectibles = state.collectibles ?? [];

  const sendMoney = async () => {
    const target = sendTarget.trim().toLowerCase();
    const amount = parseInt(sendAmount, 10);
    if (!target || isNaN(amount) || amount <= 0) return;

    const { data, error } = await supabase.from('users').select('username, game_state').eq('username', target).maybeSingle();
    if (error || !data) { setSendMsg({ ok: false, text: 'User not found.' }); return; }

    const gs = (data.game_state ?? {}) as Record<string, unknown>;
    const current = typeof gs.bank === 'number' ? gs.bank : 0;
    const updated = { ...gs, bank: current + amount };

    const { error: updateErr } = await supabase.from('users').update({ game_state: updated }).eq('username', target);
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
        {state.incomeMultiplier && state.incomeMultiplier > 1 && (
          <div className="sidebar-multiplier">+{((state.incomeMultiplier - 1) * 100).toFixed(0)}% income</div>
        )}
      </div>

      {/* Quota / Last day */}
      <div className="sidebar-section">
        <div className="sidebar-label">
          {isLastDay ? 'ASCENSION READY' : 'DAILY QUOTA'}
        </div>
        {!isLastDay && (
          <>
            <div className={`sidebar-quota ${quotaHit ? 'quota-hit' : ''}`}>
              {formatMoney(state.quota)}
            </div>
            <div className="quota-bar-wrap">
              <div className={`quota-bar-fill ${quotaHit ? 'quota-bar-done' : ''}`} style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="quota-pct">
              {quotaHit ? '✓ QUOTA HIT' : `${Math.round(progress * 100)}% to quota`}
            </div>
          </>
        )}
        {isLastDay && (
          <div className="last-day-badge">🏆 FINAL FLOOR — INFINITE TIME</div>
        )}
      </div>

      {/* Timer */}
      {!isLastDay && (
        <div className="sidebar-section">
          <div className="sidebar-label">TIME LEFT</div>
          <div className={`sidebar-timer ${timerUrgent ? 'timer-urgent' : ''}`}>
            {formatTime(state.timeLeft)}
          </div>
        </div>
      )}

      {/* Collectibles */}
      <div className="sidebar-section">
        <div className="sidebar-label">🎴 COLLECTIBLES ({collectibles.length})</div>
        <div className="collectibles-grid">
          {collectibles.length === 0 ? (
            <div className="collectibles-empty">None yet</div>
          ) : (
            <>
              {[...collectibles]
                .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
                .slice(0, 2)
                .map((c, i) => (
                  <div key={i} className="collectible-card" style={{ borderColor: rarityColor(c.rarity) }} title={c.name}>
                    <span className="cc-emoji">{c.emoji}</span>
                    <span className="cc-rarity">{c.rarity[0].toUpperCase()}</span>
                  </div>
                ))}
              {collectibles.length > 2 && (
                <button className="collectible-view-all" onClick={() => setShowCollectionModal(true)}>
                  +{collectibles.length - 2}<br/>More
                </button>
              )}
            </>
          )}
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

      {/* Leaderboard button */}
      <button className="sidebar-leaderboard-btn" onClick={() => setShowLeaderboard(true)}>
        🏆 LEADERBOARD
      </button>

      {isDev && (
        <div className="sidebar-section">
          <div className="sidebar-label">DEV — FLOOR SELECT</div>
          <div className="dev-floor-btns">
            {[1, 2, 3, 4, 5].map(f => (
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

      {!isLastDay && (
        <button className="btn-end-day" onClick={endDayManual} disabled={!quotaHit && !isDev}>
          {isDev ? 'NEXT FLOOR ↑' : quotaHit ? 'ENTER LIMO' : '🔒 QUOTA NOT MET'}
        </button>
      )}

      {isLastDay && (
        <button className="btn-end-day btn-ascend" onClick={ascend}>
          🔥 ASCEND (×{(1 + Math.log10((state.bank ?? 1) / 1_000_000) * 0.1).toFixed(2)} income)
        </button>
      )}

      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="collection-modal-backdrop" onClick={() => setShowCollectionModal(false)}>
          <div className="collection-modal" onClick={e => e.stopPropagation()}>
            <div className="collection-modal-header">
              <span className="collection-modal-title">YOUR COLLECTION</span>
              <button className="collection-modal-close" onClick={() => setShowCollectionModal(false)}>✕</button>
            </div>
            <div className="collection-modal-content">
              {[...collectibles]
                .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
                .map((c, i) => (
                  <div key={i} className="collection-card" style={{ borderColor: rarityColor(c.rarity) }}>
                    <span className="cc-emoji">{c.emoji}</span>
                    <span className="cc-name">{c.name}</span>
                    <span className="cc-rarity" style={{ color: rarityColor(c.rarity) }}>
                      {c.rarity.toUpperCase()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
