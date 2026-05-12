import React, { useState } from 'react';
import { useGame } from '../store/gameStore';

import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const TOTAL = 40;
const PICK_COUNT = 5;
const DRAW_COUNT = 5;

function drawNumbers(): number[] {
  const pool = Array.from({ length: TOTAL }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DRAW_COUNT).sort((a, b) => a - b);
}

// P(3)=0.904%, P(4)=0.0266%, P(5)=0.000152% → EV ≈ 94.8%
function payout(matches: number, bet: number): number {
  if (matches === 3) return Math.round(bet * 85);
  if (matches === 4) return Math.round(bet * 650);
  if (matches === 5) return Math.round(bet * 4000);
  return 0;
}

type Phase = 'picking' | 'result';

export function Keno() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('picking');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawn, setDrawn] = useState<number[]>([]);
  const [result, setResult] = useState<{ matches: number; net: number } | null>(null);
  const { toast, show } = useGameToast();

  const toggleNum = (n: number) => {
    if (phase !== 'picking') return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); return next; }
      if (next.size < PICK_COUNT) { next.add(n); }
      return next;
    });
  };

  const draw = () => {
    if (selected.size < PICK_COUNT) return;
    updateBank(-bet);
    const nums = drawNumbers();
    setDrawn(nums);
    const matches = nums.filter(n => selected.has(n)).length;
    const returned = payout(matches, bet);
    if (returned > 0) updateBank(returned);
    const net = returned - bet;
    setResult({ matches, net });
    show(net >= 0, net >= 0 ? `${matches} MATCHES — YOU WIN` : `${matches} MATCHES — YOU LOSE`, net);
    setPhase('result');
  };

  const reset = () => { setPhase('picking'); setSelected(new Set()); setDrawn([]); setResult(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="KENO" bank={gs.bank} onLeave={leave} />

      <div className="keno-area">
        <div className="keno-header-row">
          <span className="keno-pick-info">
            {phase === 'picking'
              ? `SELECT ${PICK_COUNT - selected.size} MORE NUMBER${PICK_COUNT - selected.size !== 1 ? 'S' : ''}`
              : `DRAWN: ${drawn.join(', ')}`}
          </span>
          <span className="keno-paytable">3 match = 85× | 4 match = 650× | 5 match = 4000×</span>
        </div>

        <div className="keno-grid">
          {Array.from({ length: TOTAL }, (_, i) => {
            const n = i + 1;
            const isSel = selected.has(n);
            const isDrawn = drawn.includes(n);
            const isMatch = isSel && isDrawn;
            return (
              <button
                key={n}
                className={`keno-cell ${isSel ? 'keno-sel' : ''} ${isDrawn && !isSel ? 'keno-drawn' : ''} ${isMatch ? 'keno-match' : ''}`}
                onClick={() => toggleNum(n)}
                disabled={phase !== 'picking' || (!isSel && selected.size >= PICK_COUNT)}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {phase === 'picking' && (
        <BettingPanel
          bank={gs.bank}
          value={bet}
          onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))}
          onConfirm={draw}
          confirmLabel="DRAW NUMBERS"
          disabled={selected.size < PICK_COUNT}
        />
      )}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="PLAY AGAIN" />
      )}
    </div>
  );
}
