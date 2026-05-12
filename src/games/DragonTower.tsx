import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const ROWS = 5;
const COLS = 3;
const MULT_PER_ROW = 1.49; // (2/3 * 1.49)^5 ≈ 96.7% RTP

interface EggCell { bomb: boolean; picked: boolean; revealed: boolean; }
type Board = EggCell[][];

function makeBoard(): Board {
  return Array.from({ length: ROWS }, () => {
    const bombCol = Math.floor(Math.random() * COLS);
    return Array.from({ length: COLS }, (_, c) => ({
      bomb: c === bombCol, picked: false, revealed: false,
    }));
  });
}

type Phase = 'betting' | 'climbing' | 'result';

interface DTState {
  bet: number;
  board: Board;
  row: number;   // active row (0 = bottom)
  mult: number;
  result: 'win' | 'lose' | null;
}

export function DragonTower() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [dt, setDt] = useState<DTState | null>(null);
  const { toast, show } = useGameToast();

  const start = () => {
    updateBank(-bet);
    setDt({ bet, board: makeBoard(), row: 0, mult: 1, result: null });
    setPhase('climbing');
  };

  const pickEgg = (col: number) => {
    if (!dt || phase !== 'climbing' || dt.result) return;
    const row = dt.row;
    const cell = dt.board[row][col];

    const newBoard = dt.board.map((r, ri) =>
      ri === row ? r.map((c, ci) => ci === col ? { ...c, picked: true, revealed: true } : (cell.bomb ? { ...c, revealed: true } : c)) : r
    );

    if (cell.bomb) {
      show(false, `BOMB @ ROW ${row + 1} — YOU LOSE`, dt ? -dt.bet : 0);
      setDt(s => s && { ...s, board: newBoard, result: 'lose' });
      setPhase('result');
    } else {
      const newMult = Math.round(dt.mult * MULT_PER_ROW * 100) / 100;
      if (row + 1 >= ROWS) {
        const returned = Math.round(dt.bet * newMult);
        updateBank(returned);
        show(true, `ROW ${row + 1}/${ROWS} — YOU WIN`, returned - dt.bet);
        setDt(s => s && { ...s, board: newBoard, row: row + 1, mult: newMult, result: 'win' });
        setPhase('result');
      } else {
        setDt(s => s && { ...s, board: newBoard, row: row + 1, mult: newMult });
      }
    }
  };

  const cashOut = () => {
    if (!dt || dt.row === 0) return;
    const returned = Math.round(dt.bet * dt.mult);
    updateBank(returned);
    show(true, 'CASHED OUT — YOU WIN', returned - dt.bet);
    setDt(s => s && { ...s, result: 'win' });
    setPhase('result');
  };

  const reset = () => { setPhase('betting'); setDt(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const net = dt
    ? (dt.result === 'win' ? Math.round(dt.bet * dt.mult) - dt.bet : -dt.bet)
    : 0;

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="DRAGON TOWER" bank={gs.bank} onLeave={leave} />

      {dt && (
        <div className="dt-area">
          <div className="dt-mult-bar">
            <span>ROW {dt.row}/{ROWS}</span>
            <span className="mono gold">{dt.mult.toFixed(2)}× → next: {(dt.mult * MULT_PER_ROW).toFixed(2)}×</span>
          </div>

          <div className="dt-tower">
            {Array.from({ length: ROWS }, (_, ri) => {
              const rowIdx = ROWS - 1 - ri; // display top→bottom, logically bottom→top
              const isActive = rowIdx === dt.row && phase === 'climbing' && !dt.result;
              const isPast = rowIdx < dt.row;
              const rowMult = (MULT_PER_ROW ** (rowIdx + 1)).toFixed(2);
              return (
                <div key={rowIdx} className={`dt-row ${isActive ? 'dt-row-active' : ''} ${isPast ? 'dt-row-past' : ''}`}>
                  <div className="dt-row-label mono">{rowMult}×</div>
                  {dt.board[rowIdx].map((cell, ci) => {
                    let cls = 'dt-egg';
                    if (cell.revealed) cls += cell.bomb ? ' egg-bomb' : ' egg-safe';
                    if (isActive) cls += ' egg-clickable';
                    return (
                      <button key={ci} className={cls} onClick={() => isActive && pickEgg(ci)} disabled={!isActive}>
                        {cell.revealed ? (cell.bomb ? '💣' : '✓') : '🥚'}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={start} confirmLabel="ENTER TOWER" />
      )}

      {phase === 'climbing' && !dt?.result && dt && dt.row > 0 && (
        <div className="craps-controls">
          <button className="btn-action" onClick={cashOut}>
            CASH OUT — {formatMoney(Math.round(dt.bet * dt.mult))}
          </button>
        </div>
      )}

      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="PLAY AGAIN" />
      )}
    </div>
  );
}
