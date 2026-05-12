import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';
import { createDeck, shuffleDeck, suitSymbol, suitColor } from '../utils/cards';
import { Card, Rank } from '../types';

const RANK_VAL: Record<Rank, number> = {
  'A':14,'K':13,'Q':12,'J':11,'10':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2
};

function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => RANK_VAL[b.rank] - RANK_VAL[a.rank]);
}

function rankCounts(hand: Card[]): Record<string, number> {
  return hand.reduce((m, c) => ({ ...m, [c.rank]: (m[c.rank] || 0) + 1 }), {} as Record<string, number>);
}

function isFlush(hand: Card[]): boolean { return new Set(hand.map(c => c.suit)).size === 1; }

function isStraight(hand: Card[]): boolean {
  const vals = sortHand(hand).map(c => RANK_VAL[c.rank]);
  // normal straight
  if (vals[0] - vals[4] === 4 && new Set(vals).size === 5) return true;
  // A-2-3-4-5
  const low = [14,5,4,3,2];
  return vals.every((v,i) => v === low[i]);
}

interface HandResult { name: string; mult: number; }

function evalHand(hand: Card[]): HandResult {
  const flush = isFlush(hand);
  const straight = isStraight(hand);
  const counts = rankCounts(hand);
  const vals = Object.values(counts).sort((a, b) => b - a);
  const sorted = sortHand(hand);

  if (flush && straight) {
    if (sorted[0].rank === 'A' && sorted[1].rank === 'K') return { name: 'Royal Flush', mult: 250 };
    return { name: 'Straight Flush', mult: 50 };
  }
  if (vals[0] === 4) return { name: 'Four of a Kind', mult: 25 };
  if (vals[0] === 3 && vals[1] === 2) return { name: 'Full House', mult: 10 };
  if (flush) return { name: 'Flush', mult: 7 };
  if (straight) return { name: 'Straight', mult: 5 };
  if (vals[0] === 3) return { name: 'Three of a Kind', mult: 3 };
  if (vals[0] === 2 && vals[1] === 2) return { name: 'Two Pair', mult: 2 };
  if (vals[0] === 2) return { name: 'Pair', mult: 1 };
  return { name: 'High Card', mult: 0 };
}

type Phase = 'betting' | 'dealt' | 'result';

function PokerCard({ card, held, onToggle, disabled }: { card: Card; held?: boolean; onToggle?: () => void; disabled?: boolean }) {
  const sym = suitSymbol(card.suit);
  const col = suitColor(card.suit);
  return (
    <div className={`poker-card-wrap ${held ? 'poker-held' : ''}`} onClick={!disabled ? onToggle : undefined}>
      <div className="playing-card card-face">
        <div className="card-corner top-left" style={{ color: col }}>
          <div className="card-rank">{card.rank}</div>
          <div className="card-suit-small">{sym}</div>
        </div>
        <div className="card-center-suit" style={{ color: col }}>{sym}</div>
        <div className="card-corner bottom-right" style={{ color: col }}>
          <div className="card-rank">{card.rank}</div>
          <div className="card-suit-small">{sym}</div>
        </div>
      </div>
      {onToggle && !disabled && (
        <div className={`poker-hold-label ${held ? 'hold-active' : ''}`}>{held ? 'HOLD' : 'SWAP'}</div>
      )}
    </div>
  );
}

export function Poker() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false,false,false,false,false]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [result, setResult] = useState<HandResult & { net: number } | null>(null);
  const { toast, show } = useGameToast();

  const deal = () => {
    const seed = Math.floor(Math.random() * 0xFFFFFF);
    const d = shuffleDeck(createDeck(1), seed);
    updateBank(-bet);
    setHand(d.slice(0, 5));
    setDeck(d.slice(5));
    setHeld([false,false,false,false,false]);
    setResult(null);
    setPhase('dealt');
  };

  const draw = () => {
    let di = 0;
    const newHand = hand.map((c, i) => {
      if (held[i]) return c;
      const nc = deck[di++];
      return nc;
    });
    const ev = evalHand(newHand);
    const returned = ev.mult > 0 ? Math.round(bet * ev.mult) : 0;
    if (returned > 0) updateBank(returned);
    const net = returned - bet;
    setHand(newHand);
    setResult({ ...ev, net });
    show(net >= 0, net >= 0 ? `${ev.name} — YOU WIN` : `${ev.name} — YOU LOSE`, net);
    setPhase('result');
  };

  const toggleHold = (i: number) => setHeld(prev => prev.map((h, idx) => idx === i ? !h : h));

  const reset = () => { setPhase('betting'); setResult(null); setHand([]); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="1P POKER" bank={gs.bank} onLeave={leave} />

      {hand.length > 0 && (
        <div className="poker-area">
          {phase === 'dealt' && <div className="poker-hint">Click cards to HOLD them, then DRAW</div>}
          <div className="poker-hand">
            {hand.map((card, i) => (
              <PokerCard key={i} card={card} held={held[i]} onToggle={() => toggleHold(i)} disabled={phase !== 'dealt'} />
            ))}
          </div>
        </div>
      )}


      <div className="poker-paytable">
        {[['Royal Flush','250×'],['Str. Flush','50×'],['4 of a Kind','25×'],['Full House','10×'],['Flush','7×'],
          ['Straight','5×'],['3 of a Kind','3×'],['Two Pair','2×'],['Pair','1×']].map(([n,m]) => (
          <span key={n}>{n} <span className="gold">{m}</span></span>
        ))}
      </div>

      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={deal} confirmLabel="DEAL CARDS" />
      )}
      {phase === 'dealt' && (
        <div className="craps-controls">
          <div className="craps-bet-show">BET: <span className="mono gold">{formatMoney(bet)}</span></div>
          <button className="btn-primary" onClick={draw}>DRAW CARDS</button>
        </div>
      )}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="DEAL AGAIN" />
      )}
    </div>
  );
}
