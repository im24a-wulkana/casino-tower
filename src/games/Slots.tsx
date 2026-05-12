import React, { useState, useRef } from 'react';
import { useGame } from '../store/gameStore';

import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const SYMBOLS = ['7', 'BAR', '★', '♦', '♣'];
const POOL = ['★','♣','BAR','★','♣','BAR','★','♣','BAR','7','BAR','★','♣','BAR','♦','BAR','♦','★'];

function roll(): string { return POOL[Math.floor(Math.random() * POOL.length)]; }

function calcResult(reels: string[], bet: number): { label: string; mult: number } {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    const mult = a === '7' ? 20 : 10;
    return { label: `3 × ${a}`, mult };
  }
  if (a === b || b === c || a === c) return { label: '2 of a Kind', mult: 1.5 };
  return { label: 'No Match', mult: 0 };
}

type Phase = 'betting' | 'spinning' | 'result';

export function Slots() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [reels, setReels] = useState(['★', '★', '★']);
  const [result, setResult] = useState<{ label: string; net: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast, show } = useGameToast();

  const spin = () => {
    updateBank(-bet);
    setPhase('spinning');
    const final = [roll(), roll(), roll()];
    let tick = 0;
    timerRef.current = setInterval(() => {
      setReels([roll(), roll(), roll()]);
      if (++tick >= 20) {
        clearInterval(timerRef.current!);
        setReels(final);
        const { label, mult } = calcResult(final, bet);
        const returned = mult > 0 ? Math.round(bet * mult) : 0;
        if (returned > 0) updateBank(returned);
        const net = returned - bet;
        setResult({ label, net });
        show(net >= 0, net >= 0 ? `${label} — YOU WIN` : `${label} — YOU LOSE`, net);
        setPhase('result');
      }
    }, 80);
  };

  const reset = () => { setPhase('betting'); setResult(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="SLOTS" bank={gs.bank} onLeave={leave} />

      <div className="slots-machine">
        <div className="slots-reels">
          {reels.map((sym, i) => (
            <div key={i} className={`slots-reel ${phase === 'spinning' ? 'slots-spin' : ''}`}>
              <span className="slots-symbol">{sym}</span>
            </div>
          ))}
        </div>
        <div className="slots-paytable">
          <span>3×7 = 20x</span>
          <span>3 match = 10x</span>
          <span>2 match = 1.5x</span>
        </div>
      </div>


      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={spin} confirmLabel="SPIN" />
      )}
      {phase === 'spinning' && <div className="spin-status">SPINNING…</div>}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="SPIN AGAIN" />
      )}
    </div>
  );
}
