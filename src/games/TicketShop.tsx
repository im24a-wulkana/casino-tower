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

const REEL_SIZE = 20;

type Phase = 'idle' | 'spinning' | 'result';

interface MachineTickets { basic: number; premium: number; elite: number }

function stopIdxForSpin(): number {
  return Math.floor(REEL_SIZE * 0.65) + Math.floor(Math.random() * 4);
}

export function TicketShop() {
  const { state: gs, updateBank, setActiveGame, buyTicket, rollCollectible, isDev } = useGame();

  const [phase, setPhase] = useState<Phase>('idle');
  const [spinningMachines, setSpinningMachines] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, CollectibleDef | null>>({});
  const [reels, setReels] = useState<Record<string, CollectibleDef[]>>({});
  const [stopIndices, setStopIndices] = useState<Record<string, number>>({});
  const [previewMachineId, setPreviewMachineId] = useState<string | null>(null);

  const reelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSpinsRef = useRef<Set<string>>(new Set());
  const timeoutIdsRef = useRef<Record<string, NodeJS.Timeout>>({});

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
    if (activeSpinsRef.current.has(machine.id)) return;

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

    activeSpinsRef.current.add(machine.id);
    setSpinningMachines(new Set(activeSpinsRef.current));
    setReels(prev => ({ ...prev, [machine.id]: reelItems }));
    setStopIndices(prev => ({ ...prev, [machine.id]: idx }));
    setResults(prev => ({ ...prev, [machine.id]: null }));
    setPhase('spinning');
  };

  // Animate each reel independently
  useEffect(() => {
    spinningMachines.forEach(machineId => {
      const el = reelRefs.current[machineId];
      if (!el || !reels[machineId]) return;

      const idx = stopIndices[machineId];
      const itemHeight = 150;
      const targetOffset = idx * itemHeight;

      el.style.transition = 'none';
      el.style.transform = 'translateY(0)';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 2.5s cubic-bezier(0.08, 0.82, 0.15, 1)';
          el.style.transform = `translateY(-${targetOffset}px)`;
        });
      });

      // Clear any existing timeout for this machine
      if (timeoutIdsRef.current[machineId]) {
        clearTimeout(timeoutIdsRef.current[machineId]);
      }

      const timeoutId = setTimeout(() => {
        const won = reels[machineId][idx];
        setResults(prev => ({ ...prev, [machineId]: won }));
        const collectible: Collectible = { ...won, obtainedAt: Date.now() };
        rollCollectible(collectible);

        activeSpinsRef.current.delete(machineId);
        delete timeoutIdsRef.current[machineId];

        if (activeSpinsRef.current.size === 0) {
          setPhase('result');
        }
        setSpinningMachines(new Set(activeSpinsRef.current));
      }, 2600);

      timeoutIdsRef.current[machineId] = timeoutId;
    });

    return () => {
      // Cleanup function - don't clear timeouts here, let them finish
    };
  }, [spinningMachines, reels, stopIndices, rollCollectible]);

  const reset = () => {
    // Clear any pending timeouts
    Object.values(timeoutIdsRef.current).forEach(id => clearTimeout(id));
    timeoutIdsRef.current = {};
    activeSpinsRef.current.clear();

    setPhase('idle');
    setResults({});
    setReels({});
    setSpinningMachines(new Set());
  };

  const leave = () => setActiveGame(null);

  const rarityLabel = (r: Collectible['rarity']) =>
    r.charAt(0).toUpperCase() + r.slice(1);

  const { claimDailyReward } = useGame();

  return (
    <div className="game-view ts-wrap">
      <GameHeader title="TICKET SHOP" bank={gs.bank} onLeave={leave} />

      {/* Daily Reward Button */}
      <div className="ts-daily-reward-section">
        <button
          className="ts-daily-reward-btn"
          disabled={gs.lastDailyRewardDay === gs.day}
          onClick={claimDailyReward}
        >
          {gs.lastDailyRewardDay === gs.day ? '✓ CLAIMED TODAY' : `📅 CLAIM DAILY REWARD — DAY ${gs.day}`}
        </button>
      </div>

      {/* 3 Vending Machines */}
      <div className="ts-machines-container">
        {MACHINES.map(machine => {
          const myTickets = ticketsForMachine(machine.id);
          const canAfford = isDev || gs.bank >= machine.ticketBuyCost;
          const canSpin = isDev || myTickets > 0;
          const isSpinning = spinningMachines.has(machine.id);
          const wonItem = results[machine.id];

          return (
            <div key={machine.id} className="ts-machine-wrapper" style={{ '--machine-color': machine.color } as React.CSSProperties}>
              {/* Vending Machine Body */}
              <div className="ts-vending-machine">
                {/* Preview button in top-right */}
                <button
                  className="ts-vm-preview-btn"
                  onClick={() => setPreviewMachineId(machine.id)}
                  style={{ color: machine.color, borderColor: machine.color }}
                >
                  👁
                </button>

                {/* Header with name and emoji */}
                <div className="ts-vm-header">
                  <span className="ts-vm-emoji">{machine.emoji}</span>
                  <span className="ts-vm-name">{machine.name}</span>
                </div>

                {/* Window showing current/winning item */}
                <div className="ts-vm-window">
                  {isSpinning && reels[machine.id] && (
                    <div className="ts-vm-reel" ref={el => { if (el) reelRefs.current[machine.id] = el; }}>
                      {reels[machine.id].map((item, i) => (
                        <div key={i} className="ts-vm-reel-item" style={{ '--item-color': rarityColor(item.rarity) } as React.CSSProperties}>
                          <span className="ts-ri-emoji">{item.emoji}</span>
                          <span className="ts-ri-name">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!isSpinning && wonItem && (
                    <div className="ts-vm-result">
                      <span className="ts-result-emoji">{wonItem.emoji}</span>
                      <span className="ts-result-name">{wonItem.name}</span>
                      <span className="ts-result-rarity" style={{ color: rarityColor(wonItem.rarity) }}>
                        {rarityLabel(wonItem.rarity)}
                      </span>
                    </div>
                  )}
                  {!isSpinning && !wonItem && (
                    <div className="ts-vm-empty">
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎲</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>Spin to win!</div>
                    </div>
                  )}
                </div>

                {/* Ticket price and count */}
                <div className="ts-vm-info">
                  <div className="ts-info-price">🎟 {formatMoney(machine.ticketBuyCost)}</div>
                  <div className="ts-info-tickets" style={{ color: machine.color }}>
                    Have: {isDev ? '∞' : myTickets}
                  </div>
                </div>

                {/* Controls */}
                <div className="ts-vm-controls">
                  <button
                    className="ts-btn ts-btn-buy"
                    disabled={!canAfford}
                    onClick={() => handleBuyTicket(machine)}
                  >
                    BUY TICKET
                  </button>
                  <button
                    className={`ts-btn ts-btn-spin ${!canSpin ? 'ts-btn-disabled' : ''} ${isSpinning ? 'ts-btn-spinning' : ''}`}
                    disabled={!canSpin || isSpinning}
                    onClick={() => handleSpin(machine)}
                  >
                    {isSpinning ? 'SPINNING…' : 'SPIN'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collection preview - only show when idle */}
      {phase === 'idle' && (
        <div className="ts-collection-preview">
          <div className="ts-cp-header">
            <div className="ts-cp-title">YOUR COLLECTION ({(gs.collectibles ?? []).length})</div>
          </div>
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

      {/* Results overlay when spinning done */}
      {phase === 'result' && Object.keys(results).length > 0 && (
        <div className="ts-result-overlay">
          <div className="ts-result-card">
            <div className="ts-result-title">🎉 YOU WON!</div>
            <div className="ts-result-items">
              {Object.entries(results).map(([machineId, item]) => {
                const machine = MACHINES.find(m => m.id === machineId);
                return item ? (
                  <div key={machineId} className="ts-result-item" style={{ borderColor: rarityColor(item.rarity) }}>
                    <span className="ts-ri-emoji">{item.emoji}</span>
                    <span className="ts-ri-name">{item.name}</span>
                    <span className="ts-ri-rarity" style={{ color: rarityColor(item.rarity) }}>
                      {rarityLabel(item.rarity)}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
            <div className="ts-result-actions">
              <button className="btn-primary" onClick={reset}>SPIN AGAIN</button>
              <button className="btn-secondary" onClick={leave}>LEAVE</button>
            </div>
          </div>
        </div>
      )}

      {/* Machine preview modal */}
      {previewMachineId && (
        <div className="ts-preview-backdrop" onClick={() => setPreviewMachineId(null)}>
          <div className="ts-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="ts-preview-header">
              <span>{MACHINES.find(m => m.id === previewMachineId)?.emoji}</span>
              <span>{MACHINES.find(m => m.id === previewMachineId)?.name} — Possible Drops</span>
              <button className="ts-preview-close" onClick={() => setPreviewMachineId(null)}>✕</button>
            </div>
            <div className="ts-preview-items">
              {(() => {
                const pool = COLLECTIBLE_POOL.filter(c => c.machineIds.includes(previewMachineId));
                const totalWeight = pool.reduce((s, c) => s + c.weight, 0);
                return pool
                  .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
                  .map((item, i) => {
                    const percent = ((item.weight / totalWeight) * 100).toFixed(2);
                    return (
                      <div key={i} className="ts-preview-item" style={{ borderColor: rarityColor(item.rarity) }}>
                        <span className="ts-pi-emoji">{item.emoji}</span>
                        <div className="ts-pi-info">
                          <span className="ts-pi-name">{item.name}</span>
                          <div className="ts-pi-details">
                            <span className="ts-pi-rarity" style={{ color: rarityColor(item.rarity) }}>
                              {rarityLabel(item.rarity)}
                            </span>
                            <span className="ts-pi-percent">{percent}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
