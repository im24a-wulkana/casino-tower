import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

const ROWS = 8;
const SLOTS = ROWS + 1; // 9

// RTP targets ~92% after accounting for physics center-bias.
// B(8,0.5) theoretical probs: [1,8,28,56,70,56,28,8,1]/256
// Physics slightly favours centre — edge mults kept lower to ensure house edge.
const RISK_CONFIG = {
  LOW: {
    label: 'LOW',
    // EV ≈ sum of C(8,k)/256 * mult[k] ≈ 1.00
    mults:  [5.6, 2.1, 1.1, 0.7, 0.5, 0.7, 1.1, 2.1, 5.6],
    colors: ['#c9a84c','#2dc653','#3a9a3a','#4caaff','#888','#4caaff','#3a9a3a','#2dc653','#c9a84c'],
    bias: 0,
    edgeHitRadius: 1.0,
  },
  MEDIUM: {
    label: 'MEDIUM',
    // Higher variance, still ~100% RTP
    mults:  [22, 5, 1.5, 0.3, 0, 0.3, 1.5, 5, 22],
    colors: ['#c9a84c','#4caaff','#888','#b44c00','#7a1a1a','#b44c00','#888','#4caaff','#c9a84c'],
    bias: 0,
    edgeHitRadius: 1.0,
  },
  HIGH: {
    label: 'HIGH',
    // Extreme variance, ~100% RTP, most slots are 0
    mults:  [110, 2.0, 0, 0, 0, 0, 0, 2.0, 110],
    colors: ['#c9a84c','#8a3a00','#4a0000','#4a0000','#4a0000','#4a0000','#4a0000','#8a3a00','#c9a84c'],
    bias: 0,
    edgeHitRadius: 1.0,
  },
} as const;

type RiskLevel = keyof typeof RISK_CONFIG;

const BOARD_W = 680;
const BOARD_H = 480;
const PEG_RADIUS = 5;
const BALL_RADIUS = 9;
const ROW_H = (BOARD_H - 60) / (ROWS + 1);
const SLOT_H = 40;

function pegX(row: number, col: number): number {
  const pegsInRow = row + 2;
  const totalWidth = BOARD_W - 60;
  const spacing = totalWidth / (pegsInRow + 1);
  return 30 + spacing * (col + 1);
}
function pegY(row: number): number {
  return 30 + ROW_H * (row + 1);
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  settled: boolean;
  slot: number | null;
  bet: number;
  flashSlot: number | null;
  flashTimer: number;
}

type Phase = 'betting' | 'active' | 'result';

let nextId = 0;

function slotColor(mult: number, riskColors: readonly string[], idx: number): string {
  return riskColors[idx] ?? '#888';
}

function multLabel(m: number): string {
  if (m === 0) return '0×';
  if (m === Math.floor(m)) return `${m}×`;
  return `${m}×`;
}

export function Plinko() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [risk, setRisk] = useState<RiskLevel>('MEDIUM');
  const [phase, setPhase] = useState<Phase>('betting');
  const [balls, setBalls] = useState<Ball[]>([]);

  const [ballResults, setBallResults] = useState<{ id: number; mult: number; net: number }[]>([]);
  const { toast, show } = useGameToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const ballsRef = useRef<Ball[]>([]);
  const riskRef = useRef<RiskLevel>('MEDIUM');
  const betRef = useRef(bet);

  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { riskRef.current = risk; }, [risk]);

  // Keep ballsRef in sync for the animation loop
  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  const dropBall = useCallback(() => {
    if (gs.bank < betRef.current) return;
    updateBank(-betRef.current);
    const id = nextId++;
    const newBall: Ball = {
      id,
      x: BOARD_W / 2 + (Math.random() - 0.5) * 4,
      y: 10,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.5,
      settled: false,
      slot: null,
      bet: betRef.current,
      flashSlot: null,
      flashTimer: 0,
    };
    setBalls(prev => {
      const next = [...prev, newBall];
      ballsRef.current = next;
      return next;
    });
    setPhase('active');
  }, [gs.bank, updateBank]);

  // Physics + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function tick() {
      const rcfg = RISK_CONFIG[riskRef.current];
      const gravity = 0.1;
      const damping = 0.72;

      setBalls(prev => {
        if (prev.length === 0) {
          drawBoard(ctx, [], rcfg);
          animRef.current = requestAnimationFrame(tick);
          return prev;
        }

        const next = prev.map(b => {
          if (b.settled) {
            let ft = b.flashTimer;
            if (ft > 0) ft--;
            return { ...b, flashTimer: ft, flashSlot: ft > 0 ? b.flashSlot : null };
          }

          let { x, y, vx, vy } = b;
          vy += gravity;

          // Center bias for LOW risk
          if (rcfg.bias !== 0) {
            const center = BOARD_W / 2;
            vx += (center - x) * rcfg.bias * 0.001;
          }

          x += vx;
          y += vy;

          // Wall clamp
          if (x - BALL_RADIUS < 0) { x = BALL_RADIUS; vx = Math.abs(vx) * 0.6; }
          if (x + BALL_RADIUS > BOARD_W) { x = BOARD_W - BALL_RADIUS; vx = -Math.abs(vx) * 0.6; }

          // Peg collisions
          for (let row = 0; row < ROWS; row++) {
            const py = pegY(row);
            const pegsInRow = row + 2;
            const totalWidth = BOARD_W - 60;
            const spacing = totalWidth / (pegsInRow + 1);
            const hitR = PEG_RADIUS + BALL_RADIUS * rcfg.edgeHitRadius;

            for (let col = 0; col < pegsInRow; col++) {
              const px = 30 + spacing * (col + 1);
              const dx = x - px;
              const dy = y - py;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < hitR && dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                // Push ball out
                x = px + nx * (hitR + 0.5);
                y = py + ny * (hitR + 0.5);
                const dot = vx * nx + vy * ny;
                vx = (vx - 2 * dot * nx) * damping + (Math.random() - 0.5) * 0.8;
                vy = (vy - 2 * dot * ny) * damping;
                if (vy < 0.2) vy = 0.2;
              }
            }
          }

          // Wall clamp again after peg bounce
          x = Math.max(BALL_RADIUS, Math.min(BOARD_W - BALL_RADIUS, x));

          // Check if ball has landed in slot zone
          const slotTop = BOARD_H - SLOT_H - 8;
          if (y >= slotTop) {
            // Determine which slot
            const slotW = BOARD_W / SLOTS;
            const slotIdx = Math.min(SLOTS - 1, Math.max(0, Math.floor(x / slotW)));
            return { ...b, x, y: slotTop, vx: 0, vy: 0, settled: true, slot: slotIdx, flashSlot: slotIdx, flashTimer: 60 };
          }

          return { ...b, x, y, vx, vy };
        });

        ballsRef.current = next;
        drawBoard(ctx, next, rcfg);

        // Resolve settled balls that just landed
        const justLanded = next.filter(b => b.settled && b.slot !== null && b.flashTimer === 60);
        if (justLanded.length > 0) {
          justLanded.forEach(b => {
            const mult = rcfg.mults[b.slot!];
            const returned = Math.round(b.bet * mult);
            if (returned > 0) updateBank(returned);
            setBallResults(prev => [...prev, { id: b.id, mult, net: returned - b.bet }]);
          });
        }

        // Check if all balls done
        const allDone = next.every(b => b.settled);
        if (allDone && next.length > 0) {
          const anyFlashing = next.some(b => b.flashTimer > 0);
          if (!anyFlashing) {
            const totalPaid = next.reduce((sum, b) => {
              const mult = rcfg.mults[b.slot!];
              return sum + Math.round(b.bet * mult);
            }, 0);
            const totalBet = next.reduce((sum, b) => sum + b.bet, 0);
            const net = totalPaid - totalBet;
            show(net >= 0, net >= 0 ? 'YOU WIN' : 'YOU LOSE', net);
            setPhase('result');
          }
        }

        animRef.current = requestAnimationFrame(tick);
        return next;
      });
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [updateBank]);

  function drawBoard(ctx: CanvasRenderingContext2D, liveBalls: Ball[], rcfg: typeof RISK_CONFIG[RiskLevel]) {
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // Pegs
    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 2;
      for (let col = 0; col < pegsInRow; col++) {
        const px = pegX(row, col);
        const py = pegY(row);
        ctx.beginPath();
        ctx.arc(px, py, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#888';
        ctx.fill();
      }
    }

    // Slot buckets
    const slotW = BOARD_W / SLOTS;
    const slotTop = BOARD_H - SLOT_H - 8;
    for (let i = 0; i < SLOTS; i++) {
      const sx = i * slotW;
      const flashingBall = liveBalls.find(b => b.flashSlot === i && b.flashTimer > 0);
      const color = rcfg.colors[i];
      ctx.fillStyle = flashingBall ? '#fff' : color + '55';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(sx + 2, slotTop, slotW - 4, SLOT_H, 4);
      ctx.fill();
      ctx.stroke();

      // Multiplier label
      const mult = rcfg.mults[i];
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Use dark text on light slot colors so it's always readable
      const lightSlot = color === '#4caaff' || color === '#2dc653' || color === '#c9a84c';
      ctx.fillStyle = flashingBall ? '#000' : (lightSlot ? '#111' : '#e8e8e8');
      ctx.fillText(multLabel(mult), sx + slotW / 2, slotTop + SLOT_H / 2);
    }

    // Balls
    liveBalls.forEach(b => {
      if (b.settled) return;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, BALL_RADIUS);
      grad.addColorStop(0, '#ffe066');
      grad.addColorStop(1, '#c9a84c');
      ctx.fillStyle = grad;
      ctx.fill();
    });
  }

  const reset = () => {
    setBalls([]);
    ballsRef.current = [];
    setBallResults([]);
    setPhase('betting');
    setBet(v => Math.min(v, gs.bank));
  };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const activeBalls = balls.filter(b => !b.settled);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="PLINKO" bank={gs.bank} onLeave={leave} />

      {/* Risk selector */}
      <div className="plinko-risk-row">
        <span className="plinko-risk-label">RISK</span>
        {(Object.keys(RISK_CONFIG) as RiskLevel[]).map(r => (
          <button
            key={r}
            className={`plinko-risk-btn ${risk === r ? 'plinko-risk-active' : ''}`}
            onClick={() => setRisk(r)}
            disabled={phase === 'active'}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Canvas board */}
      <div className="plinko-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          className="plinko-canvas"
        />
        {activeBalls.length > 1 && (
          <div className="plinko-ball-counter">{activeBalls.length} balls in play</div>
        )}
        {ballResults.length > 0 && (
          <div className="plinko-ball-log">
            {ballResults.slice(-5).map(r => (
              <div key={r.id} className={r.net >= 0 ? 'win' : 'loss'} style={{ fontSize: 12, background: 'rgba(0,0,0,0.6)', padding: '1px 6px', borderRadius: 3 }}>
                {r.mult}× — {r.net >= 0 ? '+' : ''}{formatMoney(r.net)}
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Controls */}
      {(phase === 'betting' || phase === 'active') && (
        <BettingPanel
          bank={gs.bank}
          value={bet}
          onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))}
          onConfirm={dropBall}
          confirmLabel="DROP BALL"
          disabled={gs.bank < bet}
        />
      )}
      {phase === 'active' && (
        <div className="spin-status">
          {activeBalls.length > 0 ? `${activeBalls.length > 1 ? activeBalls.length + ' BALLS' : 'BALL'} DROPPING…` : 'SETTLING…'}
        </div>
      )}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="DROP AGAIN" />
      )}
    </div>
  );
}
