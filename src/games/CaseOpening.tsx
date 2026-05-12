import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { GameHeader, useGameToast, GameToast } from '../components/BettingPanel';
import { CASES, CaseDef, CaseItem, rollItem, oddsPercent, formatVal } from './cases';

type Phase = 'select' | 'preview' | 'spinning' | 'result';

const REEL_ITEMS = 40; // items shown in the reel strip
const ITEM_W = 96;     // px per item in reel

export function CaseOpening() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCase, setSelectedCase] = useState<CaseDef | null>(null);
  const [previewCase, setPreviewCase] = useState<CaseDef | null>(null);
  const [wonItem, setWonItem] = useState<CaseItem | null>(null);
  const [reelItems, setReelItems] = useState<CaseItem[]>([]);
  const [reelOffset, setReelOffset] = useState(0);
  const reelRef = useRef<HTMLDivElement>(null);
  const { toast, show } = useGameToast();

  const canAfford = (c: CaseDef) => gs.bank >= c.price;

  const STOP_IDX = REEL_ITEMS - 6; // reel stops here, winner placed at this index

  const openCase = (c: CaseDef) => {
    if (gs.bank < c.price) return;
    updateBank(-c.price);
    setSelectedCase(c);

    // Build reel: random items, winner placed exactly at STOP_IDX
    const result = rollItem(c);
    const reel: CaseItem[] = Array.from({ length: REEL_ITEMS }, (_, i) =>
      i === STOP_IDX ? result : rollItem(c)
    );
    setReelItems(reel);
    setReelOffset(0);
    setWonItem(null);
    setPhase('spinning');
  };

  // Animate the reel once spinning starts
  useEffect(() => {
    if (phase !== 'spinning' || reelItems.length === 0) return;
    const el = reelRef.current;
    if (!el) return;

    const containerW = el.parentElement!.offsetWidth;
    const centerOffset = containerW / 2 - ITEM_W / 2;
    // Sub-item random jitter so reel doesn't always stop dead-center
    const jitter = (Math.random() - 0.5) * (ITEM_W * 0.6);
    const targetOffset = STOP_IDX * ITEM_W - centerOffset + jitter;

    el.style.transition = 'none';
    el.style.transform = 'translateX(0)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 4s cubic-bezier(0.12, 0.8, 0.2, 1)';
        el.style.transform = `translateX(-${targetOffset}px)`;
      });
    });

    const timeout = setTimeout(() => {
      const won = reelItems[STOP_IDX];
      setWonItem(won);
      updateBank(won.value);
      const net = won.value - selectedCase!.price;
      show(net >= 0, `${won.emoji} ${won.name}`, won.value);
      setPhase('result');
    }, 4300);

    return () => clearTimeout(timeout);
  }, [phase, reelItems]);

  const reset = () => {
    setPhase('select');
    setSelectedCase(null);
    setWonItem(null);
    setReelItems([]);
  };

  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="CASE OPENING" bank={gs.bank} onLeave={leave} />

      {/* Case preview modal */}
      {previewCase && (
        <div className="case-modal-backdrop" onClick={() => setPreviewCase(null)}>
          <div className="case-modal" onClick={e => e.stopPropagation()}>
            <div className="case-modal-header">
              <span className="case-modal-emoji">{previewCase.emoji}</span>
              <span className="case-modal-name">{previewCase.name}</span>
              <span className="case-modal-price">{formatVal(previewCase.price)}</span>
              <button className="case-modal-close" onClick={() => setPreviewCase(null)}>✕</button>
            </div>
            <div className="case-modal-items">
              {[...previewCase.items].sort((a, b) => b.value - a.value).map((item, i) => (
                <div key={i} className="case-modal-item">
                  <span className="cmi-emoji">{item.emoji}</span>
                  <span className="cmi-name">{item.name}</span>
                  <span className="cmi-value">{formatVal(item.value)}</span>
                  <span className="cmi-odds">{oddsPercent(item, previewCase).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'select' && (
        <div className="case-select-wrap">
          <div className="case-select-title">SELECT A CASE TO OPEN</div>
          <div className="case-grid">
            {CASES.map(c => (
              <div key={c.id} className={`case-card ${!canAfford(c) ? 'case-card-locked' : ''}`}
                style={{ '--case-color': c.color } as React.CSSProperties}>
                <button className="case-preview-btn" onClick={() => setPreviewCase(c)}>PREVIEW</button>
                <div className="case-card-emoji">{c.emoji}</div>
                <div className="case-card-name">{c.name}</div>
                <div className="case-card-price">{formatVal(c.price)}</div>
                <button
                  className="case-open-btn"
                  disabled={!canAfford(c)}
                  onClick={() => openCase(c)}
                >
                  OPEN
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === 'spinning' || phase === 'result') && selectedCase && (
        <div className="case-spin-wrap">
          <div className="case-spin-title">
            {phase === 'spinning' ? `OPENING ${selectedCase.name}…` : wonItem ? `${wonItem.emoji} ${wonItem.name}` : ''}
          </div>

          <div className="case-reel-outer">
            <div className="case-reel-marker" />
            <div className="case-reel-window">
              <div className="case-reel" ref={reelRef}>
                {reelItems.map((item, i) => (
                  <div key={i} className="case-reel-item"
                    style={{ '--case-color': selectedCase.color } as React.CSSProperties}>
                    <span className="cri-emoji">{item.emoji}</span>
                    <span className="cri-name">{item.name}</span>
                    <span className="cri-value">{formatVal(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {phase === 'result' && wonItem && (
            <div className="case-result">
              <div className="case-result-value" style={{ color: selectedCase.color }}>
                {formatVal(wonItem.value)}
              </div>
              <div className="case-result-net" style={{ color: wonItem.value >= selectedCase.price ? '#2dc653' : '#e63946' }}>
                {wonItem.value >= selectedCase.price ? '+' : ''}{formatVal(wonItem.value - selectedCase.price)}
              </div>
              <div className="case-result-actions">
                <button className="btn-primary" onClick={reset}>OPEN AGAIN</button>
                <button className="btn-secondary" onClick={leave}>LEAVE</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
