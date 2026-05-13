import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.01) return 1.0; // 1% instant crash
  return Math.max(1.01, 1.00 / (1 - r));
}

type Phase = 'betting' | 'live' | 'cashed' | 'crashed';

export function Crash() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [mult, setMult] = useState(1.0);
  const [cashMult, setCashMult] = useState<number | null>(null);
  const [crashPoint, setCrashPoint] = useState(1.0);
  const [activeBet, setActiveBet] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const multRef = useRef(1.0);
  const crashRef = useRef(1.0);
  const { toast, show } = useGameToast();

  const clearTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const startGame = () => {
    const cp = generateCrashPoint();
    updateBank(-bet);
    setActiveBet(bet);
    setCrashPoint(cp);
    crashRef.current = cp;
    multRef.current = 1.0;
    setMult(1.0);
    setCashMult(null);
    setPhase('live');

    intervalRef.current = setInterval(() => {
      multRef.current = Math.round((multRef.current + 0.03 + multRef.current * 0.002) * 100) / 100;
      setMult(multRef.current);
      if (multRef.current >= crashRef.current) {
        clearTimer();
        show(false, `CRASHED @ ${crashRef.current.toFixed(2)}× — YOU LOSE`, -activeBet);
        setPhase('crashed');
      }
    }, 60);
  };

  const cashOut = () => {
    if (phase !== 'live') return;
    clearTimer();
    const m = multRef.current;
    setCashMult(m);
    const returned = Math.round(activeBet * m);
    updateBank(returned);
    show(true, `CASHED @ ${m.toFixed(2)}× — YOU WIN`, returned - activeBet);
    setPhase('cashed');
  };

  useEffect(() => () => clearTimer(), []);

  const reset = () => {
    setPhase('betting');
    setMult(1.0);
    setCashMult(null);
    setBet(v => Math.min(v, gs.bank));
  };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const net = cashMult !== null
    ? Math.round(activeBet * cashMult) - activeBet
    : -activeBet;

  const multColor = phase === 'crashed' ? '#e63946' : mult >= 3 ? '#2dc653' : mult >= 2 ? '#c9a84c' : '#e8e8e8';

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="CRASH" bank={gs.bank} onLeave={leave} />

      <div className="crash-display">
        <div className="crash-mult-wrap">
          <div className="crash-mult mono" style={{ color: multColor }}>
            {phase === 'betting' ? '1.00×' : `${mult.toFixed(2)}×`}
          </div>
          {phase === 'crashed' && (
            <div className="crash-boom">💥 CRASHED @ {crashPoint.toFixed(2)}×</div>
          )}
          {phase === 'cashed' && cashMult !== null && (
            <div className="crash-cashed">✓ CASHED OUT @ {cashMult.toFixed(2)}×</div>
          )}
        </div>

        <div className="crash-graph">
          <div className="crash-line" style={{
            width: phase === 'betting' ? '0%' : '100%',
            height: phase === 'betting' ? '4px' : `${Math.min(90, (mult - 1) * 20)}%`,
            background: phase === 'crashed' ? '#e63946' : '#2dc653',
          }} />
        </div>
      </div>

      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={startGame} confirmLabel="LAUNCH" />
      )}

      {phase === 'live' && (
        <div className="crash-live-controls">
          <div className="craps-bet-show">POTENTIAL: <span className="mono gold">{formatMoney(Math.round(activeBet * mult))}</span></div>
          <button className="btn-primary" onClick={cashOut} style={{ background: '#2dc653', color: '#000' }}>
            CASH OUT — {mult.toFixed(2)}×
          </button>
        </div>
      )}

      {(phase === 'cashed' || phase === 'crashed') && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="LAUNCH AGAIN" />
      )}
    </div>
  );
}
