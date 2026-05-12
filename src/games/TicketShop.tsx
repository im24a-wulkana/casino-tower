import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { GameHeader } from '../components/BettingPanel';
import { formatMoney } from '../utils/gameLogic';
import {
  MACHINES, MachineDef,
  COLLECTIBLE_POOL, CollectibleDef,
  rollFromMachine, rarityColor, RARITY_ORDER,
} from './collectibles';
import { Collectible } from '../types';

const REEL_SIZE = 40;
const ITEM_STRIDE = 88; // px — item width (80) + gap (8)

type Phase = 'idle' | 'spinning' | 'result';

interface MachineTickets { basic: number; premium: number; elite: number }

function stopIdxForSpin(): number {
  return Math.floor(REEL_SIZE * 0.65) + Math.floor(Math.random() * 8);
}

function buildReel(machineId: string, winner: CollectibleDef): CollectibleDef[] {
  const pool = COLLECTIBLE_POOL.filter(c => c.machineIds.includes(machineId));
  const idx = stopIdxForSpin();
  const reel = Array.from({ length: REEL_SIZE }, (_, i) =>
    i === idx ? winner : pool[Math.floor(Math.random() * pool.length)]
  );
  (reel as (CollectibleDef & { _stopIdx?: number }))[0]._stopIdx = idx;
  return reel;
}

export function TicketShop() {
  const { state: gs, updateBank, setActiveGame, buyTicket, rollCollectible, isDev } = useGame();

  const [activeMachine, setActiveMachine] = useState<MachineDef>(MACHINES[0]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [reel, setReel] = useState<CollectibleDef[]>([]);
  const [stopIdx, setStopIdx] = useState(0);
  const [wonItem, setWonItem] = useState<CollectibleDef | null>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  // Per-machine ticket counts derived from game state
  // We store all tickets in a flat pool per machine in gs — but since types use single tickets number,
  // we use a local breakdown keyed by machine, stored as part of game state tickets object.
  // For simplicity: gs.tickets is total count; we track machine affinity via a separate local map
  // stored in localStorage (not critical data).
  const [machineTickets, setMachineTickets] = useState<MachineTickets>(() => {
    try {
      const raw = localStorage.getItem('ct_mtickets');
      return raw ? JSON.parse(raw) : { basic: 0, premium: 0, elite: 0 };
    } catch { return { basic: 0, premium: 0, elite: 0 }; }
  });

  const saveMachineTickets = (mt: MachineTickets) => {
    setMachineTickets(mt);
    localStorage.setItem('ct_mtickets', JSON.stringify(mt));
  };

  const ticketsForMachine = (id: string) => machineTickets[id as keyof MachineTickets] ?? 0;

  const handleBuyTicket = (machine: MachineDef) => {
    if (!isDev && gs.bank < machine.ticketBuyCost) return;
    buyTicket(machine.ticketBuyCost, machine.id);
    const mt = { ...machineTickets, [machine.id]: (machineTickets[machine.id as keyof MachineTickets] ?? 0) + 1 };
    saveMachineTickets(mt as MachineTickets);
  };

  const handleSpin = (machine: MachineDef) => {
    const t = ticketsForMachine(machine.id);
    if (!isDev && t <= 0) return;
    if (phase === 'spinning') return;

    const winner = rollFromMachine(machine.id);
    const idx = stopIdxForSpin();
    const pool = COLLECTIBLE_POOL.filter(c => c.machineIds.includes(machine.id));
    const reelItems: CollectibleDef[] = Array.from({ length: REEL_SIZE }, (_, i) =>
      i === idx ? winner : pool[Math.floor(Math.random() * pool.length)]
    );

    if (!isDev) {
      const mt = { ...machineTickets, [machine.id]: Math.max(0, t - 1) };
      saveMachineTickets(mt as MachineTickets);
    }

    setActiveMachine(machine);
    setReel(reelItems);
    setStopIdx(idx);
    setWonItem(null);
    setPhase('spinning');
  };

  // Animate reel
  useEffect(() => {
    if (phase !== 'spinning' || reel.length === 0) return;
    const el = reelRef.current;
    if (!el) return;

    const containerW = el.parentElement!.offsetWidth;
    const centerOffset = containerW / 2 - 80 / 2; // 80 = item visual width
    const targetOffset = stopIdx * ITEM_STRIDE - centerOffset;

    el.style.transition = 'none';
    el.style.transform = 'translateX(0)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 4s cubic-bezier(0.10, 0.85, 0.18, 1)';
        el.style.transform = `translateX(-${targetOffset}px)`;
      });
    });

    const t = setTimeout(() => {
      const won = reel[stopIdx];
      setWonItem(won);
      const collectible: Collectible = { ...won, obtainedAt: Date.now() };
      rollCollectible(collectible);
      setPhase('result');
    }, 4400);

    return () => clearTimeout(t);
  }, [phase, reel]);

  const reset = () => { setPhase('idle'); setWonItem(null); setReel([]); };
  const leave = () => setActiveGame(null);

  const rarityLabel = (r: Collectible['rarity']) =>
    r.charAt(0).toUpperCase() + r.slice(1);

  return (
    <div className="game-view ts-wrap">
      <GameHeader title="TICKET SHOP" bank={gs.bank} onLeave={leave} />

      {/* Machine selector */}
      <div className="ts-machines">
        {MACHINES.map(m => {
          const myTickets = ticketsForMachine(m.id);
          const canAfford = isDev || gs.bank >= m.ticketBuyCost;
          const canSpin = isDev || myTickets > 0;
          return (
            <div
              key={m.id}
              className={`ts-machine ${activeMachine.id === m.id ? 'ts-machine-active' : ''}`}
              style={{ '--mc': m.color } as React.CSSProperties}
              onClick={() => setActiveMachine(m)}
            >
              <div className="ts-machine-emoji">{m.emoji}</div>
              <div className="ts-machine-name">{m.name}</div>
              <div className="ts-machine-desc">{m.description}</div>
              <div className="ts-machine-ticket-price">
                🎟 Ticket: <strong>{formatMoney(m.ticketBuyCost)}</strong>
              </div>
              <div className="ts-machine-ticket-count">
                You have: <strong style={{ color: m.color }}>{isDev ? '∞' : myTickets}</strong>
              </div>
              <button
                className="ts-buy-btn"
                disabled={!canAfford}
                onClick={e => { e.stopPropagation(); handleBuyTicket(m); }}
              >
                BUY TICKET
              </button>
              <button
                className={`ts-spin-btn ${!canSpin ? 'ts-spin-disabled' : ''}`}
                disabled={!canSpin || phase === 'spinning'}
                onClick={e => { e.stopPropagation(); handleSpin(m); }}
              >
                {phase === 'spinning' && activeMachine.id === m.id ? 'SPINNING…' : 'SPIN'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reel area — shown when spinning or result */}
      {(phase === 'spinning' || phase === 'result') && (
        <div className="ts-reel-section">
          <div className="ts-reel-title" style={{ color: activeMachine.color }}>
            {phase === 'spinning' ? `${activeMachine.name} — SPINNING…` : wonItem ? `${wonItem.emoji} ${wonItem.name}` : ''}
          </div>

          <div className="ts-reel-outer">
            <div className="ts-reel-marker" style={{ borderColor: activeMachine.color }} />
            <div className="ts-reel-window">
              <div className="ts-reel" ref={reelRef}>
                {reel.map((item, i) => (
                  <div
                    key={i}
                    className={`ts-reel-item ${phase === 'result' && i === stopIdx ? 'ts-reel-winner' : ''}`}
                    style={{
                      '--rc': rarityColor(item.rarity),
                      borderTopColor: rarityColor(item.rarity),
                    } as React.CSSProperties}
                  >
                    <span className="ts-ri-emoji">{item.emoji}</span>
                    <span className="ts-ri-name">{item.name}</span>
                    <span className="ts-ri-rarity" style={{ color: rarityColor(item.rarity) }}>
                      {rarityLabel(item.rarity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {phase === 'result' && wonItem && (
            <div className="ts-result" style={{ borderColor: rarityColor(wonItem.rarity) }}>
              <span className="ts-result-emoji">{wonItem.emoji}</span>
              <div className="ts-result-info">
                <div className="ts-result-name" style={{ color: rarityColor(wonItem.rarity) }}>
                  {wonItem.name}
                </div>
                <div className="ts-result-rarity" style={{ color: rarityColor(wonItem.rarity) }}>
                  {rarityLabel(wonItem.rarity).toUpperCase()}
                </div>
              </div>
              <div className="ts-result-actions">
                <button className="btn-primary" onClick={reset}>SPIN AGAIN</button>
                <button className="btn-secondary" onClick={leave}>LEAVE</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collection preview */}
      <div className="ts-collection-preview">
        <div className="ts-cp-title">YOUR COLLECTION ({(gs.collectibles ?? []).length})</div>
        <div className="ts-cp-grid">
          {[...(gs.collectibles ?? [])]
            .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
            .slice(0, 12)
            .map((c, i) => (
              <div key={i} className="ts-cp-item" style={{ borderColor: rarityColor(c.rarity) }} title={c.name}>
                <span>{c.emoji}</span>
              </div>
            ))}
          {(gs.collectibles ?? []).length === 0 && (
            <div className="ts-cp-empty">No collectibles yet — spin to get some!</div>
          )}
        </div>
      </div>
    </div>
  );
}
