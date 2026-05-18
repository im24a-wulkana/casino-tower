import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const LANES = 6;
const HIT_CHANCE = 0.28;       // 72% survival per lane
const MULT_PER_LANE = 1.38;    // 0.72^6 * 1.38^6 ≈ 0.95 RTP

type Phase = 'betting' | 'crossing' | 'result';

interface Car {
  id: number;
  lane: number;
  x: number;      // 0–100 percent across road width
  speed: number;  // percent per frame
  dir: 1 | -1;   // 1 = left→right, -1 = right→left
}

interface GameState {
  bet: number;
  lane: number;
  multiplier: number;
  result: 'win' | 'lose' | null;
  net: number;
  hopOffset: number;    // y offset for hop animation
}

function initial(): GameState {
  return { bet: 0, lane: 0, multiplier: 1, result: null, net: 0, hopOffset: 0 };
}

let carIdSeq = 0;

function spawnCarsForLane(lane: number): Car[] {
  return [0, 1, 2].map(i => ({
    id: carIdSeq++,
    lane,
    x: (i * 33 + Math.random() * 10) % 100,
    speed: 0.35 + Math.random() * 0.25,
    dir: (lane % 2 === 0 ? 1 : -1) as 1 | -1,
  }));
}

export function PenguinCross() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [pen, setPen] = useState<GameState>(initial());
  const [cars, setCars] = useState<Car[]>([]);
  const [flashLane, setFlashLane] = useState<number | null>(null);
  const [hitCarId, setHitCarId] = useState<number | null>(null);
  const { toast, show } = useGameToast();
  const animRef = useRef<number>(0);
  const carsRef = useRef<Car[]>([]);
  const phaseRef = useRef<Phase>('betting');

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Animate cars when in crossing phase
  useEffect(() => {
    if (phase !== 'crossing') {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const animate = () => {
      if (phaseRef.current !== 'crossing') return;
      setCars(prev => {
        const next = prev.map(c => {
          let nx = c.x + c.speed * c.dir;
          if (nx > 110) nx = -10;
          if (nx < -10) nx = 110;
          return { ...c, x: nx };
        });
        carsRef.current = next;
        return next;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  // Guarantee empty cars on mount
  useEffect(() => {
    setCars([]);
    carsRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const start = () => {
    updateBank(-bet);
    // Spawn cars for all lanes when game starts
    const allCars: Car[] = [];
    for (let l = 1; l <= LANES; l++) {
      allCars.push(...spawnCarsForLane(l));
    }
    setCars(allCars);
    carsRef.current = allCars;
    setPen({ ...initial(), bet });
    setPhase('crossing');
    setFlashLane(null);
    setHitCarId(null);
  };

  const crossLane = () => {
    if (pen.result !== null) return;
    const nextLane = pen.lane + 1;

    if (Math.random() < HIT_CHANCE) {
      // Hit — find nearest car in that lane
      const laneCars = carsRef.current.filter(c => c.lane === nextLane);
      const hitCar = laneCars[Math.floor(Math.random() * laneCars.length)] ?? null;
      if (hitCar) setHitCarId(hitCar.id);

      setFlashLane(nextLane);
      setPen(s => ({ ...s, lane: nextLane, result: 'lose', net: -s.bet }));
      show(false, `HIT AT LANE ${nextLane} — YOU LOSE`, -pen.bet);
      // Freeze cars briefly then clear
      cancelAnimationFrame(animRef.current);
      setTimeout(() => {
        setCars([]);
        carsRef.current = [];
        setFlashLane(null);
        setHitCarId(null);
        setPhase('result');
      }, 800);
    } else {
      const newMult = Math.pow(MULT_PER_LANE, nextLane);

      // Hop animation
      setPen(s => ({ ...s, hopOffset: -10 }));
      setTimeout(() => setPen(s => ({ ...s, hopOffset: 0 })), 200);

      if (nextLane >= LANES) {
        const returned = Math.round(pen.bet * newMult);
        updateBank(returned);
        const winNet = returned - pen.bet;
        setPen(s => ({ ...s, lane: nextLane, multiplier: newMult, result: 'win', net: winNet }));
        show(true, `${nextLane}/${LANES} LANES — YOU WIN`, winNet);
        cancelAnimationFrame(animRef.current);
        setCars([]);
        carsRef.current = [];
        setPhase('result');
      } else {
        setPen(s => ({ ...s, lane: nextLane, multiplier: newMult }));
      }
    }
  };

  const cashOut = () => {
    if (pen.result !== null || pen.lane === 0) return;
    const returned = Math.round(pen.bet * pen.multiplier);
    updateBank(returned);
    const cashNet = returned - pen.bet;
    cancelAnimationFrame(animRef.current);
    setCars([]);
    carsRef.current = [];
    setPen(s => ({ ...s, result: 'win', net: cashNet }));
    show(true, `CASHED OUT — YOU WIN`, cashNet);
    setPhase('result');
  };

  const reset = () => {
    cancelAnimationFrame(animRef.current);
    setCars([]);
    carsRef.current = [];
    setPhase('betting');
    setPen(initial());
    setFlashLane(null);
    setHitCarId(null);
    setBet(v => Math.min(v, gs.bank));
  };

  const leave = () => {
    cancelAnimationFrame(animRef.current);
    setCars([]);
    gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);
  };

  // Draw chicken using canvas — white oval body, orange beak, red comb, legs
  function ChickenIcon({ size = 40, dead = false, hopOffset = 0 }: { size?: number; dead?: boolean; hopOffset?: number }) {
    const canvasRef2 = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      const c = canvasRef2.current;
      if (!c) return;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, size, size);
      const cx = size * 0.45;
      const cy = size * 0.52 + hopOffset * 0.5;
      // Body
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.28, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = dead ? '#888' : '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Head
      const hx = cx + size * 0.22;
      const hy = cy - size * 0.18;
      ctx.beginPath();
      ctx.arc(hx, hy, size * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = dead ? '#888' : '#f0f0f0';
      ctx.fill();
      ctx.stroke();
      // Comb
      if (!dead) {
        ctx.beginPath();
        ctx.arc(hx, hy - size * 0.12, size * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#e63946';
        ctx.fill();
      }
      // Beak
      ctx.beginPath();
      ctx.moveTo(hx + size * 0.12, hy);
      ctx.lineTo(hx + size * 0.22, hy - size * 0.03);
      ctx.lineTo(hx + size * 0.12, hy + size * 0.06);
      ctx.closePath();
      ctx.fillStyle = '#f4a030';
      ctx.fill();
      // Legs
      const legY = cy + size * 0.22;
      ctx.strokeStyle = '#f4a030';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - size * 0.08, legY); ctx.lineTo(cx - size * 0.08, legY + size * 0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + size * 0.08, legY); ctx.lineTo(cx + size * 0.08, legY + size * 0.15); ctx.stroke();
      // Eye
      ctx.beginPath();
      ctx.arc(hx + size * 0.06, hy - size * 0.04, size * 0.025, 0, Math.PI * 2);
      ctx.fillStyle = dead ? '#e63946' : '#111';
      ctx.fill();
    }, [size, dead, hopOffset]);
    return <canvas ref={canvasRef2} width={size} height={size} style={{ display: 'block' }} />;
  }

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="CHICKEN CROSS" bank={gs.bank} onLeave={leave} />

      <div className="penguin-game">
        <div className="penguin-road">
          {/* Finish zone */}
          <div className={`penguin-zone finish-zone ${pen.lane >= LANES ? 'zone-active' : ''}`}>
            FINISH &nbsp; {(Math.pow(MULT_PER_LANE, LANES)).toFixed(2)}×
          </div>

          {/* Lanes (reverse so lane 6 is top) */}
          {Array.from({ length: LANES }, (_, i) => {
            const laneNum = LANES - i;
            const crossed = pen.lane >= laneNum;
            const isFlashing = flashLane === laneNum && pen.result === 'lose';
            const laneCars = phase === 'betting' ? [] : cars.filter(c => c.lane === laneNum);

            return (
              <div
                key={laneNum}
                className={`penguin-lane ${crossed ? 'lane-crossed' : ''} ${isFlashing ? 'lane-crash' : ''}`}
              >
                <div className="lane-cars">
                  {laneCars.map(car => (
                    <div
                      key={car.id}
                      className={`lane-car-abs ${hitCarId === car.id ? 'car-hit' : ''}`}
                      style={{
                        left: `${car.x}%`,
                        transform: `translateY(-50%) scaleX(${car.dir})`,
                      }}
                    >
                      🚗
                    </div>
                  ))}
                </div>
                <div className="lane-mult mono">{(Math.pow(MULT_PER_LANE, laneNum)).toFixed(2)}×</div>
              </div>
            );
          })}

          {/* Start zone with chicken */}
          <div className={`penguin-zone start-zone ${pen.lane === 0 && phase === 'crossing' ? 'zone-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {phase === 'crossing' && pen.lane === 0 ? (
              <>
                <ChickenIcon size={36} dead={false} hopOffset={pen.hopOffset} />
                <span>START</span>
              </>
            ) : phase === 'betting' ? (
              <span>START</span>
            ) : null}
          </div>
        </div>

        {/* Chicken status indicator */}
        {phase === 'crossing' && pen.lane > 0 && (
          <div className="penguin-status">
            <ChickenIcon size={40} dead={pen.result === 'lose'} hopOffset={pen.hopOffset} />
            <div className="penguin-mult-label">
              {pen.lane}/{LANES} lanes — <span className="mono gold">{pen.multiplier.toFixed(2)}×</span>
            </div>
          </div>
        )}
      </div>


      {phase === 'betting' && (
        <BettingPanel
          bank={gs.bank}
          value={bet}
          onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))}
          onConfirm={start}
          confirmLabel="START CROSSING"
        />
      )}

      {phase === 'crossing' && (
        <div className="penguin-controls">
          <div className="craps-bet-show">BET: <span className="mono gold">{formatMoney(pen.bet)}</span></div>
          <div className="bj-action-row">
            <button className="btn-action" onClick={crossLane} disabled={pen.result !== null}>
              CROSS LANE {pen.lane + 1}
            </button>
            {pen.lane > 0 && (
              <button className="btn-action" onClick={cashOut} disabled={pen.result !== null}>
                CASH OUT ({formatMoney(Math.round(pen.bet * pen.multiplier))})
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="PLAY AGAIN" />
      )}
    </div>
  );
}
