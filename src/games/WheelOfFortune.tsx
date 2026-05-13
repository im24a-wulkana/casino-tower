import React, { useState, useRef } from 'react';
import { useGame } from '../store/gameStore';

import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

interface Segment { label: string; mult: number; color: string; }

// 14 segments — EV = (3.6+2.6+2+5)/14 = 13.2/14 ≈ 94% RTP
// LOSE×6, 0.9×4, 1.3×2, 2×1, 5×1
const SEGMENTS: Segment[] = [
  { label: 'LOSE', mult: 0,   color: '#7f1d1d' },
  { label: '1×',   mult: 1,   color: '#1a3a1a' },
  { label: '1.3×', mult: 1.3, color: '#1a2a4a' },
  { label: 'LOSE', mult: 0,   color: '#7f1d1d' },
  { label: '0.9×', mult: 0.9, color: '#1a3a1a' },
  { label: '2×',   mult: 2,   color: '#4a2a1a' },
  { label: 'LOSE', mult: 0,   color: '#7f1d1d' },
  { label: '5×',   mult: 5,   color: '#4a1a4a' },
  { label: '1×',   mult: 1,   color: '#1a3a1a' },
  { label: 'LOSE', mult: 0,   color: '#7f1d1d' },
  { label: '1.3×', mult: 1.3, color: '#1a2a4a' },
  { label: '0.9×', mult: 0.9, color: '#1a3a1a' },
  { label: 'LOSE', mult: 0,   color: '#7f1d1d' },
  { label: 'LOSE', mult: 0,   color: '#7f1d1d' },
];
// EV = (1+1.3+0.9+2+5+1+1.3+0.9)/14 ≈ 13.4/14 ≈ 95.7% → close to fair
const N = SEGMENTS.length;
const DEG_PER = 360 / N;

type Phase = 'betting' | 'spinning' | 'result';

export function WheelOfFortune() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ seg: Segment; net: number } | null>(null);
  const spinRef = useRef(0);
  const { toast, show } = useGameToast();

  const spinWheel = () => {
    updateBank(-bet);
    setPhase('spinning');
    const idx = Math.floor(Math.random() * N);
    const extra = 5 * 360 + (360 - idx * DEG_PER - DEG_PER / 2);
    const newRot = spinRef.current + extra;
    spinRef.current = newRot;
    setRotation(newRot);

    setTimeout(() => {
      const seg = SEGMENTS[idx];
      const returned = seg.mult > 0 ? Math.round(bet * seg.mult) : 0;
      if (returned > 0) updateBank(returned);
      const net = returned - bet;
      setResult({ seg, net });
      show(net >= 0, net >= 0 ? `${seg.label} — YOU WIN` : 'LOSE — YOU LOSE', net);
      setPhase('result');
    }, 3200);
  };

  const reset = () => { setPhase('betting'); setResult(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const conicGradient = SEGMENTS.map((s, i) =>
    `${s.color} ${i * DEG_PER}deg ${(i + 1) * DEG_PER}deg`
  ).join(', ');

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="WHEEL OF FORTUNE" bank={gs.bank} onLeave={leave} />

      <div className="wof-container">
        <div className="wof-pointer">▼</div>
        <div
          className="wof-wheel"
          style={{
            background: `conic-gradient(${conicGradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: phase === 'spinning' ? 'transform 3s cubic-bezier(0.17,0.67,0.21,0.99)' : 'none',
          }}
        >
          {SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className="wof-seg-label"
              style={{
                // rotate to segment midpoint, then translate(-50%, -62px):
                // -50% centres the label tangentially; -62px keeps it inside the wheel (52% of 120px radius)
                transform: `rotate(${i * DEG_PER + DEG_PER / 2}deg) translate(-50%, -152px)`,
              }}
            >
              {seg.label}
            </div>
          ))}
        </div>
      </div>


      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={spinWheel} confirmLabel="SPIN WHEEL" />
      )}
      {phase === 'spinning' && <div className="spin-status">WHEEL SPINNING…</div>}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="SPIN AGAIN" />
      )}
    </div>
  );
}
