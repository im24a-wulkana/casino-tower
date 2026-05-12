import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';

// 24 segments — EV = (6+6+6+5)/24 = 23/24 ≈ 95.8% RTP
// 0.5×(×12), 1×(×6), 2×(×3), 5×(×1), SKULL(×2 = lose)
const SEGMENTS = [
  ...Array(12).fill(null).map(() => ({ label: '0.5×', mult: 0.5, color: '#1a2a1a' })),
  ...Array(6).fill(null).map(()  => ({ label: '1×',   mult: 1,   color: '#1a2a4a' })),
  ...Array(3).fill(null).map(()  => ({ label: '2×',   mult: 2,   color: '#3a2a1a' })),
  ...Array(1).fill(null).map(()  => ({ label: '5×',   mult: 5,   color: '#3a1a4a' })),
  ...Array(2).fill(null).map(()  => ({ label: '💀',   mult: 0,   color: '#3a0a0a' })),
];

const N = SEGMENTS.length; // 24
const DEG = 360 / N;       // 15° per segment
const RADIUS = 210;        // half of 420px

type Phase = 'betting' | 'spinning' | 'result';

export function MoneyWheel() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ seg: typeof SEGMENTS[0]; net: number } | null>(null);
  const { toast, show } = useGameToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef = useRef(0);
  const rotRef = useRef(0);
  const animRef = useRef(0);
  const spinningRef = useRef(false);
  const targetRotRef = useRef(0);
  const startTimeRef = useRef(0);
  const startRotRef = useRef(0);
  const durationMs = 4000;
  const pendingResultRef = useRef<{ seg: typeof SEGMENTS[0]; net: number } | null>(null);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = RADIUS;
    const cy = RADIUS;
    const r = RADIUS - 6;
    ctx.clearRect(0, 0, RADIUS * 2, RADIUS * 2);

    // Segments
    for (let i = 0; i < N; i++) {
      const startAngle = (angle + i * DEG - 90) * (Math.PI / 180);
      const endAngle   = (angle + (i + 1) * DEG - 90) * (Math.PI / 180);
      const seg = SEGMENTS[i];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label near outer edge
      const midAngle = (angle + i * DEG + DEG / 2 - 90) * (Math.PI / 180);
      const labelR = r * 0.82;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.font = 'bold 16px "Bebas Neue", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Dark outline for contrast against any segment color
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeText(seg.label, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(seg.label, 0, 0);
      ctx.restore();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a84c';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
  };

  // Easing: cubic-bezier(0.17,0.67,0.12,0.99) approximated
  function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  const animateWheel = () => {
    const elapsed = performance.now() - startTimeRef.current;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = easeOut(t);
    const currentAngle = startRotRef.current + (targetRotRef.current - startRotRef.current) * eased;
    rotRef.current = currentAngle;
    drawWheel(currentAngle % 360);

    if (t < 1) {
      animRef.current = requestAnimationFrame(animateWheel);
    } else {
      spinningRef.current = false;
      if (pendingResultRef.current) {
        const r = pendingResultRef.current;
        setResult(r);
        show(r.net >= 0, r.net >= 0 ? `${r.seg.label} — YOU WIN` : '💀 — YOU LOSE', r.net);
        setPhase('result');
        pendingResultRef.current = null;
      }
    }
  };

  const spin = () => {
    updateBank(-bet);
    setPhase('spinning');
    setResult(null);

    const idx = Math.floor(Math.random() * N);
    // Target: pointer at top (0°) aligns with segment idx midpoint
    // Wheel needs to rotate so segment idx is at top
    const segMidDeg = idx * DEG + DEG / 2;
    const extra = 8 * 360 + (360 - segMidDeg);
    const newRot = rotRef.current + extra;

    startRotRef.current = rotRef.current;
    targetRotRef.current = newRot;
    startTimeRef.current = performance.now();
    spinningRef.current = true;

    const seg = SEGMENTS[idx];
    const returned = seg.mult > 0 ? Math.round(bet * seg.mult) : 0;
    if (returned > 0) updateBank(returned);
    pendingResultRef.current = { seg, net: returned - bet };

    animRef.current = requestAnimationFrame(animateWheel);
  };

  // Initial draw
  useEffect(() => {
    drawWheel(0);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const reset = () => {
    setPhase('betting');
    setResult(null);
    setBet(v => Math.min(v, gs.bank));
  };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="MONEY WHEEL" bank={gs.bank} onLeave={leave} />

      <div className="mw-container">
        {/* Pointer triangle */}
        <div className="mw-pointer">▼</div>
        <canvas
          ref={canvasRef}
          width={RADIUS * 2}
          height={RADIUS * 2}
          className="mw-canvas"
        />
      </div>


      <div className="wof-paytable">
        <span>0.5× ×12</span><span>1× ×6</span><span>2× ×3</span><span>5× ×1</span>
        <span className="loss">💀 ×2</span>
      </div>

      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={spin} confirmLabel="SPIN WHEEL" />
      )}
      {phase === 'spinning' && <div className="spin-status">WHEEL SPINNING…</div>}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="SPIN AGAIN" />
      )}
    </div>
  );
}
