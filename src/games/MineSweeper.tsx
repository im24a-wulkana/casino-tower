import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const GRID = 5;
const MINES = 5;
const TOTAL_CELLS = GRID * GRID; // 25
const SAFE_CELLS = TOTAL_CELLS - MINES; // 20

// Mathematically fair multiplier: 0.95 * product of (TOTAL_CELLS-i)/(SAFE_CELLS-i) for i=0..k-1
function safeMult(k: number): number {
  let m = 0.95;
  for (let i = 0; i < k; i++) m *= (TOTAL_CELLS - i) / (SAFE_CELLS - i);
  return m;
}

interface Cell { mine: boolean; revealed: boolean; }

function makeGrid(): Cell[] {
  const cells: Cell[] = Array.from({ length: GRID * GRID }, () => ({ mine: false, revealed: false }));
  let placed = 0;
  while (placed < MINES) {
    const i = Math.floor(Math.random() * cells.length);
    if (!cells[i].mine) { cells[i].mine = true; placed++; }
  }
  return cells;
}

type Phase = 'betting' | 'playing' | 'result';

interface MSState {
  bet: number;
  cells: Cell[];
  safe: number;
  mult: number;
  result: 'win' | 'lose' | null;
}

export function MineSweeper() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [ms, setMs] = useState<MSState | null>(null);
  const { toast, show } = useGameToast();

  const start = () => {
    updateBank(-bet);
    setMs({ bet, cells: makeGrid(), safe: 0, mult: safeMult(0), result: null });
    setPhase('playing');
  };

  const reveal = (idx: number) => {
    if (!ms || phase !== 'playing' || ms.cells[idx].revealed) return;

    const newCells = ms.cells.map((c, i) => i === idx ? { ...c, revealed: true } : c);

    if (ms.cells[idx].mine) {
      // Reveal all mines
      const final = newCells.map(c => c.mine ? { ...c, revealed: true } : c);
      show(false, 'MINE HIT — YOU LOSE', ms ? -ms.bet : 0);
      setMs(s => s && { ...s, cells: final, result: 'lose' });
      setPhase('result');
    } else {
      const newSafe = ms.safe + 1;
      const newMult = safeMult(newSafe);
      setMs(s => s && { ...s, cells: newCells, safe: newSafe, mult: newMult });
    }
  };

  const cashOut = () => {
    if (!ms || ms.safe === 0) return;
    const returned = Math.round(ms.bet * ms.mult);
    updateBank(returned);
    show(true, `${ms.safe} SAFE — YOU WIN`, returned - ms.bet);
    setMs(s => s && { ...s, result: 'win' });
    setPhase('result');
  };

  const reset = () => { setPhase('betting'); setMs(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const net = ms
    ? (ms.result === 'win' ? Math.round(ms.bet * ms.mult) - ms.bet : -ms.bet)
    : 0;

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="MINESWEEPER" bank={gs.bank} onLeave={leave} />

      {ms && (
        <div className="ms-area">
          <div className="ms-header-row">
            <span>{ms.safe} safe tiles — <span className="mono gold">{ms.mult.toFixed(1)}× multiplier</span></span>
            <span className="loss">{MINES} mines hidden</span>
          </div>

          <div className="ms-grid">
            {ms.cells.map((cell, i) => {
              let cls = 'ms-cell';
              if (cell.revealed) cls += cell.mine ? ' ms-mine' : ' ms-safe';
              else if (phase === 'playing' && !ms.result) cls += ' ms-hidden';
              return (
                <button key={i} className={cls}
                  onClick={() => reveal(i)}
                  disabled={cell.revealed || phase !== 'playing'}>
                  {cell.revealed ? (cell.mine ? '💣' : '✓') : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={start} confirmLabel="START SWEEP" />
      )}

      {phase === 'playing' && !ms?.result && ms && ms.safe > 0 && (
        <div className="craps-controls">
          <button className="btn-action" onClick={cashOut}>
            CASH OUT — {formatMoney(Math.round(ms.bet * ms.mult))}
          </button>
        </div>
      )}

      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="PLAY AGAIN" />
      )}
    </div>
  );
}
