import React, { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '../utils/gameLogic';

export interface BettingPanelProps {
  bank: number;
  value: number;
  onChange: (v: number) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  disabled?: boolean;
}

export function BettingPanel({
  bank,
  value,
  onChange,
  onConfirm,
  confirmLabel = 'CONFIRM BET',
  disabled = false,
}: BettingPanelProps) {
  const presets = [
    { label: 'MIN', v: 10 },
    { label: '$100', v: 100 },
    { label: '$500', v: 500 },
    { label: '$1K', v: 1000 },
    { label: 'ALL IN', v: bank },
  ];
  const clamp = (v: number) => Math.max(1, Math.min(v, bank));

  return (
    <div className="betting-panel">
      <div className="betting-title">PLACE YOUR BET</div>
      <div className="betting-presets">
        {presets.map((p) => (
          <button
            key={p.label}
            className={`btn-preset ${!disabled && value === clamp(p.v) ? 'btn-preset-active' : ''}`}
            onClick={() => onChange(clamp(p.v))}
            disabled={p.v > bank || disabled}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="betting-input-row">
        <button className="btn-adj" onClick={() => onChange(clamp(value - 100))} disabled={disabled}>
          −
        </button>
        <input
          className="betting-input mono"
          type="number"
          min={1}
          max={bank}
          value={value}
          onChange={(e) => onChange(clamp(parseInt(e.target.value) || 1))}
          disabled={disabled}
        />
        <button className="btn-adj" onClick={() => onChange(clamp(value + 100))} disabled={disabled}>
          +
        </button>
      </div>
      <button
        className="btn-primary btn-deal"
        onClick={onConfirm}
        disabled={disabled || value <= 0 || value > bank}
      >
        {confirmLabel} — {formatMoney(value)}
      </button>
    </div>
  );
}

export function ResultActions({
  bank,
  onPlayAgain,
  onLeave,
  onBankrupt,
  playLabel = 'PLAY AGAIN',
}: {
  bank: number;
  onPlayAgain: () => void;
  onLeave: () => void;
  onBankrupt: () => void;
  playLabel?: string;
}) {
  if (bank <= 0) {
    return (
      <div className="bj-result-actions">
        <button className="btn-primary btn-danger" onClick={onBankrupt}>
          GAME OVER
        </button>
      </div>
    );
  }
  return (
    <div className="bj-result-actions">
      <button className="btn-primary" onClick={onPlayAgain}>
        {playLabel}
      </button>
      <button className="btn-secondary" onClick={onLeave}>
        LEAVE TABLE
      </button>
    </div>
  );
}

export function GameHeader({
  title,
  bank,
  onLeave,
}: {
  title: string;
  bank: number;
  onLeave: () => void;
}) {
  return (
    <div className="game-view-header">
      <button className="btn-back" onClick={onLeave}>
        ← BACK
      </button>
      <h2 className="game-view-title">{title}</h2>
      <div className="game-view-bank mono">{formatMoney(bank)}</div>
    </div>
  );
}

export interface ToastState {
  won: boolean;
  label: string;
  payout: number;
  key: number;
}

export function useGameToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const show = useCallback((won: boolean, label: string, payout: number) => {
    setToast({ won, label, payout, key: Date.now() });
  }, []);
  const clear = useCallback(() => setToast(null), []);
  return { toast, show, clear };
}

export function GameToast({ toast }: { toast: ToastState | null }) {
  const [current, setCurrent] = useState<ToastState | null>(null);
  const [stage, setStage] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden');

  useEffect(() => {
    if (!toast) return;
    setCurrent(toast);
    setStage('hidden');
    const t1 = setTimeout(() => setStage('entering'), 20);
    const t2 = setTimeout(() => setStage('visible'), 370);
    const t3 = setTimeout(() => setStage('exiting'), 2200);
    const t4 = setTimeout(() => { setStage('hidden'); setCurrent(null); }, 2430);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [toast?.key]);

  if (!current || stage === 'hidden') return null;
  return (
    <div className={`game-toast ${current.won ? 'toast-win' : 'toast-lose'} toast-${stage}`}>
      <div className="toast-label">{current.label}</div>
      <div className="toast-payout">
        {current.payout > 0 ? `+${formatMoney(current.payout)}` : formatMoney(current.payout)}
      </div>
    </div>
  );
}
