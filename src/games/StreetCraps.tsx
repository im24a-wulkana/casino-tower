import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const DICE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function rollDice(): [number, number] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

type Phase = 'betting' | 'come-out' | 'point' | 'result';

interface CrapsState {
  phase: Phase;
  bet: number;
  dice: [number, number];
  point: number | null;
  result: 'win' | 'lose' | null;
  net: number;
}

function initial(): CrapsState {
  return { phase: 'betting', bet: 0, dice: [1, 1], point: null, result: null, net: 0 };
}

export function StreetCraps() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [craps, setCraps] = useState<CrapsState>(initial());
  const { toast, show } = useGameToast();

  const startRoll = () => {
    updateBank(-bet);
    setCraps({ ...initial(), phase: 'come-out', bet });
  };

  const roll = () => {
    const dice = rollDice();
    const sum = dice[0] + dice[1];

    if (craps.phase === 'come-out') {
      if (sum === 7 || sum === 11) {
        updateBank(Math.round(craps.bet * 2));
        setCraps(s => ({ ...s, dice, result: 'win', net: craps.bet, phase: 'result' }));
        show(true, 'YOU WIN', craps.bet);
      } else if (sum === 2 || sum === 3 || sum === 12) {
        setCraps(s => ({ ...s, dice, result: 'lose', net: -craps.bet, phase: 'result' }));
        show(false, 'YOU LOSE', -craps.bet);
      } else {
        setCraps(s => ({ ...s, dice, point: sum, phase: 'point' }));
      }
    } else if (craps.phase === 'point') {
      if (sum === craps.point) {
        updateBank(Math.round(craps.bet * 2));
        setCraps(s => ({ ...s, dice, result: 'win', net: craps.bet, phase: 'result' }));
        show(true, 'YOU WIN', craps.bet);
      } else if (sum === 7) {
        setCraps(s => ({ ...s, dice, result: 'lose', net: -craps.bet, phase: 'result' }));
        show(false, 'YOU LOSE', -craps.bet);
      } else {
        setCraps(s => ({ ...s, dice }));
      }
    }
  };

  const reset = () => { setCraps(initial()); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const sum = craps.dice[0] + craps.dice[1];

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="STREET CRAPS" bank={gs.bank} onLeave={leave} />

      <div className="craps-table">
        <div className="craps-dice-area">
          <div className="craps-die">{DICE_FACE[craps.dice[0]]}</div>
          <div className="craps-die">{DICE_FACE[craps.dice[1]]}</div>
        </div>

        {craps.phase !== 'betting' && (
          <div className="craps-sum mono">SUM: {sum}</div>
        )}

        {craps.point && craps.phase === 'point' && (
          <div className="craps-point-display">
            POINT: <span className="gold mono">{craps.point}</span>
            <span className="craps-hint"> — roll {craps.point} to win, 7 to lose</span>
          </div>
        )}

        {craps.phase === 'come-out' && !craps.result && (
          <div className="craps-phase-label">COME-OUT ROLL — 7/11 wins, 2/3/12 loses</div>
        )}
      </div>


      {craps.phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={startRoll} confirmLabel="ROLL" />
      )}

      {(craps.phase === 'come-out' || craps.phase === 'point') && !craps.result && (
        <div className="craps-controls">
          <div className="craps-bet-show">BET: <span className="mono gold">{formatMoney(craps.bet)}</span></div>
          <button className="btn-primary" onClick={roll}>ROLL DICE</button>
        </div>
      )}

      {craps.phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="ROLL AGAIN" />
      )}
    </div>
  );
}
