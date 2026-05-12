import React, { useState, useRef } from 'react';
import { useGame } from '../store/gameStore';

import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

// 5 ducks, equal 1/5 chance each — 4.75× gives 95% RTP
const DUCKS = [
  { id: 0, name: 'Duck 1',  emoji: '🐥', mult: 4.75 },
  { id: 1, name: 'Duck 2',  emoji: '🐤', mult: 4.75 },
  { id: 2, name: 'Duck 3',  emoji: '🦆', mult: 4.75 },
  { id: 3, name: 'Duck 4',  emoji: '🐣', mult: 4.75 },
  { id: 4, name: 'YARL',    emoji: '🦅', mult: 4.75 },
];

type Phase = 'betting' | 'racing' | 'result';

export function DuckRace() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [picked, setPicked] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>('betting');
  const [positions, setPositions] = useState([0, 0, 0, 0, 0]);
  const [winner, setWinner] = useState<number | null>(null);
  const [result, setResult] = useState<{ won: boolean; net: number } | null>(null);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast, show } = useGameToast();

  const race = () => {
    updateBank(-bet);
    setPhase('racing');
    setPositions([0, 0, 0, 0, 0]);
    const winnerIdx = Math.floor(Math.random() * 5);
    setWinner(null);

    // Speeds: winner gets a slight boost, others random
    const speeds = DUCKS.map((_, i) => {
      const base = 1 + Math.random() * 2;
      return i === winnerIdx ? base + 1.5 : base;
    });

    const prog = [0, 0, 0, 0, 0];
    frameRef.current = setInterval(() => {
      DUCKS.forEach((_, i) => {
        prog[i] = Math.min(100, prog[i] + speeds[i] * (0.5 + Math.random() * 0.8));
      });
      setPositions([...prog]);

      if (prog[winnerIdx] >= 100) {
        clearInterval(frameRef.current!);
        setWinner(winnerIdx);
        const duck = DUCKS[winnerIdx];
        const won = winnerIdx === picked;
        const returned = won ? Math.round(bet * duck.mult) : 0;
        if (won) updateBank(returned);
        const net = returned - bet;
        setResult({ won, net });
        show(won, won ? `${duck.name} WINS — YOUR DUCK!` : `${duck.name} WINS`, net);
        setPhase('result');
      }
    }, 80);
  };

  const reset = () => { setPhase('betting'); setResult(null); setPositions([0,0,0,0,0]); setWinner(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="DUCK RACE" bank={gs.bank} onLeave={leave} />

      <div className="duck-track">
        {DUCKS.map((d, i) => (
          <div key={i} className={`duck-lane ${phase === 'betting' ? 'duck-pickable' : ''} ${picked === i && phase === 'betting' ? 'duck-picked' : ''} ${winner === i ? 'duck-winner' : ''}`}
            onClick={() => phase === 'betting' && setPicked(i)}>
            <div className="duck-info">
              <span className="duck-emoji">{d.emoji}</span>
              <span className="duck-name">{d.name}</span>
              <span className="duck-odds mono">{d.mult - 1}:1</span>
              {picked === i && <span className="duck-pick-badge">YOUR PICK</span>}
            </div>
            <div className="duck-progress-bg">
              <div className="duck-progress-fill" style={{ width: `${positions[i]}%` }}>
                <span className="duck-racer">{d.emoji}</span>
              </div>
            </div>
          </div>
        ))}

      </div>

      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={race} confirmLabel={`BET ON ${DUCKS[picked].name}`} />
      )}
      {phase === 'racing' && <div className="spin-status">RACE IN PROGRESS…</div>}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="RACE AGAIN" />
      )}
    </div>
  );
}
