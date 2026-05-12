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
const ITEM_STRIDE = 88;

type Phase = 'idle' | 'spinning' | 'result';

interface MachineTickets { basic: number; premium: number; elite: number }

function stopIdxForSpin(): number {
  return Math.floor(REEL_SIZE * 0.65) + Math.floor(Math.random() * 8);
}

export function TicketShop() {
  const { state: gs, updateBank, setActiveGame, buyTicket, rollCollectible, isDev } = useGame();

  const [activeMachine, setActiveMachine] = useState<MachineDef>(MACHINES[0]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [reel, setReel] = useState<CollectibleDef[]>([]);
  const [stopIdx, setStopIdx] = useState(0);
  const [wonItem, setWonItem] = useState<CollectibleDef | null>(null);
  const [spinIntensity, setSpinIntensity] = useState(0); // 0-2 for animation intensity
  const reelRef = useRef<HTMLDivElement>(null);

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
    // Set intensity based on machine tier: basic=0, premium=1, elite=2
    const intensities = { basic: 0, premium: 1, elite: 2 };
    setSpinIntensity(intensities[machine.id as keyof typeof intensities] ?? 0);
    setPhase('spinning');
  };

  // Animate reel with intensity-based effects
  useEffect(() => {
    if (phase !== 'spinning' || reel.length === 0) return;
    const el = reelRef.current;
    if (!el) return;

    const containerW = el.parentElement!.offsetWidth;
    const centerOffset = containerW / 2 - 80 / 2;
    const targetOffset = stopIdx * ITEM_STRIDE - centerOffset;

    el.style.transition = 'none';
    el.style.transform = 'translateX(0)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // More spins for higher intensity
        const spins = 5 + spinIntensity * 3; // 5-11 rotations
        const easing = ['cubic-bezier(0.10, 0.85, 0.18, 1)', 'cubic-bezier(0.05, 0.8, 0.1, 1)', 'cubic-bezier(0.02, 0.7, 0.05, 1)'][spinIntensity];
        el.style.transition = `transform ${3.5 + spinIntensity * 0.8}s ${easing}`;
        el.style.transform = `translateX(-${targetOffset}px) rotateZ(${spins * 360}deg)`;
      });
    });

    const t = setTimeout(() => {
      const won = reel[stopIdx];
      setWonItem(won);
      const collectible: Collectible = { ...won, obtainedAt: Date.now() };
      rollCollectible(collectible);
      setPhase('result');
    }, 3500 + spinIntensity * 800);

    return () => clearTimeout(t);
  }, [phase, reel]);

  const reset = () => { setPhase('idle'); setWonItem(null); setReel([]); };
  const leave = () => setActiveGame(null);

  const rarityLabel = (r: Collectible['rarity']) =>
    r.charAt(0).toUpperCase() + r.slice(1);

  return (
    <div className="game-view ts-wrap">
      <GameHeader title="TICKET SHOP" bank={gs.bank} onLeave={leave} />

      {/* Machine selector — single unified view */}
      <div className="ts-selector">
        <div className="ts-selector-title">Choose a vending machine:</div>
        <div className="ts-machines-row">
          {MACHINES.map(m => {
            const myTickets = ticketsForMachine(m.id);
            const canAfford = isDev || gs.bank >= m.ticketBuyCost;
            const canSpin = isDev || myTickets > 0;
            return (
              <div
                key={m.id}
                className={`ts-machine-card ${activeMachine.id === m.id ? 'ts-machine-selected' : ''}`}
                onClick={() => setActiveMachine(m)}
                style={{ '--mc': m.color } as React.CSSProperties}
              >
                <div className="ts-mc-emoji">{m.emoji}</div>
                <div className="ts-mc-name">{m.name}</div>
                <div className="ts-mc-price">{formatMoney(m.ticketBuyCost)}</div>
                <div className="ts-mc-tickets">
                  <span style={{ color: m.color }}>🎟 {isDev ? '∞' : myTickets}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active machine controls */}
      <div className="ts-machine-panel" style={{ '--mc': activeMachine.color } as React.CSSProperties}>
        <div className="ts-mp-header">
          <span className="ts-mp-emoji">{activeMachine.emoji}</span>
          <div className="ts-mp-info">
            <div className="ts-mp-name">{activeMachine.name}</div>
            <div className="ts-mp-desc">{activeMachine.description}</div>
          </div>
        </div>
        <div className="ts-mp-controls">
          <button
            className="ts-control-btn ts-buy-btn"
            disabled={!isDev && gs.bank < activeMachine.ticketBuyCost}
            onClick={() => handleBuyTicket(activeMachine)}
          >
            💳 BUY TICKET ({formatMoney(activeMachine.ticketBuyCost)})
          </button>
          <button
            className={`ts-control-btn ts-spin-btn ${ticketsForMachine(activeMachine.id) <= 0 && !isDev ? 'ts-spin-disabled' : ''}`}
            disabled={ticketsForMachine(activeMachine.id) <= 0 && !isDev}
            onClick={() => handleSpin(activeMachine)}
          >
            {phase === 'spinning' ? '🎰 SPINNING…' : '🎰 SPIN'}
          </button>
        </div>
      </div>

      {/* Reel animation */}
      {(phase === 'spinning' || phase === 'result') && (
        <div className="ts-reel-section" style={{ '--intensity': spinIntensity } as React.CSSProperties}>
          <div className="ts-reel-title" style={{ color: activeMachine.color }}>
            {phase === 'spinning' ? '🎲 SPINNING…' : wonItem ? `${wonItem.emoji} ${wonItem.name}` : ''}
          </div>

          <div className="ts-reel-outer">
            <div className="ts-reel-marker" style={{ borderColor: activeMachine.color }} />
            <div className="ts-reel-window">
              <div className={`ts-reel ${phase === 'spinning' ? 'ts-reel-active' : ''}`} ref={reelRef}>
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

          {/* Machine glow effect during spin */}
          {phase === 'spinning' && (
            <div className={`ts-machine-glow ts-glow-intensity-${spinIntensity}`} />
          )}

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
      {phase === 'idle' && (
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
      )}
    </div>
  );
}
