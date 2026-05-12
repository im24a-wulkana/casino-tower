import React, { useState, useRef } from 'react';
import { useGame } from '../store/gameStore';

import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const numColor = (n: number) => n === 0 ? 'green' : RED.has(n) ? 'red' : 'black';
const COLOR_BG: Record<string, string> = { red: '#7f1d1d', black: '#111', green: '#14532d' };
const COLOR_FG: Record<string, string> = { red: '#fca5a5', black: '#d4d4d4', green: '#86efac' };

type BetType = 'number' | 'red' | 'black' | 'dozen1' | 'dozen2' | 'dozen3';
type Phase = 'betting' | 'spinning' | 'result';

interface BetCfg { type: BetType; num?: number; label: string; mult: number; }

function checkWin(spin: number, cfg: BetCfg): boolean {
  switch (cfg.type) {
    case 'number': return spin === cfg.num;
    case 'red':    return numColor(spin) === 'red';
    case 'black':  return numColor(spin) === 'black';
    case 'dozen1': return spin >= 1 && spin <= 12;
    case 'dozen2': return spin >= 13 && spin <= 24;
    case 'dozen3': return spin >= 25 && spin <= 36;
  }
}

const OUTSIDE: BetCfg[] = [
  { type: 'red',    label: 'RED',   mult: 2 },
  { type: 'black',  label: 'BLACK', mult: 2 },
  { type: 'dozen1', label: '1–12',  mult: 3 },
  { type: 'dozen2', label: '13–24', mult: 3 },
  { type: 'dozen3', label: '25–36', mult: 3 },
];

export function Roulette() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [cfg, setCfg] = useState<BetCfg>(OUTSIDE[0]);
  const [phase, setPhase] = useState<Phase>('betting');
  const [display, setDisplay] = useState<number | null>(null);
  const [result, setResult] = useState<{ spin: number; won: boolean; net: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast, show } = useGameToast();

  const spin = () => {
    updateBank(-bet);
    setPhase('spinning');
    const final = Math.floor(Math.random() * 37);
    let tick = 0;
    timerRef.current = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 37));
      if (++tick >= 28) {
        clearInterval(timerRef.current!);
        setDisplay(final);
        const won = checkWin(final, cfg);
        const returned = won ? Math.round(bet * cfg.mult) : 0;
        if (won) updateBank(returned);
        const net = returned - bet;
        setResult({ spin: final, won, net });
        show(won, won ? `${cfg.label} — YOU WIN` : `${cfg.label} — YOU LOSE`, net);
        setPhase('result');
      }
    }, 70);
  };

  const reset = () => { setPhase('betting'); setResult(null); setDisplay(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const nc = display !== null ? numColor(display) : 'black';

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="ROULETTE" bank={gs.bank} onLeave={leave} />

      <div className="roulette-table">
        <div className="roulette-center">
          <div className="roulette-ball" style={{ background: COLOR_BG[nc], color: COLOR_FG[nc] }}>
            {phase === 'betting' ? '?' : display}
          </div>
          {phase === 'spinning' && <div className="spin-label">SPINNING…</div>}
        </div>
      </div>


      {phase === 'betting' && (
        <div className="roulette-controls">
          <div className="roulette-outside">
            {OUTSIDE.map(b => (
              <button key={b.type}
                className={`btn-outside ${b.type === 'red' ? 'outside-red' : b.type === 'black' ? 'outside-black' : ''} ${cfg.type === b.type && !cfg.num ? 'outside-sel' : ''}`}
                onClick={() => setCfg(b)}>
                {b.label} ({b.mult - 1}:1)
              </button>
            ))}
          </div>
          <div className="roulette-divider">OR PICK A NUMBER — 35:1</div>
          <div className="roulette-grid">
            {Array.from({ length: 37 }, (_, i) => {
              const nc = numColor(i);
              const sel = cfg.type === 'number' && cfg.num === i;
              return (
                <button key={i} className={`roulette-num ${nc}-num ${sel ? 'num-sel' : ''}`}
                  onClick={() => setCfg({ type: 'number', num: i, label: String(i), mult: 36 })}>
                  {i}
                </button>
              );
            })}
          </div>
          <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={spin} confirmLabel={`SPIN — ${cfg.label}`} />
        </div>
      )}

      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="SPIN AGAIN" />
      )}
    </div>
  );
}
