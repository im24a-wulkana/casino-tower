import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';
import { createDeck, shuffleDeck, suitSymbol, suitColor } from '../utils/cards';
import { Card } from '../types';

function baccVal(card: Card): number {
  if (['10','J','Q','K'].includes(card.rank)) return 0;
  if (card.rank === 'A') return 1;
  return parseInt(card.rank, 10);
}

function handTotal(hand: Card[]): number {
  return hand.reduce((sum, c) => (sum + baccVal(c)) % 10, 0);
}

function dealHands(deck: Card[]): { player: Card[]; banker: Card[]; remaining: Card[] } {
  const p = [deck[0], deck[2]];
  const b = [deck[1], deck[3]];
  let rest = deck.slice(4);
  const pt = handTotal(p);
  const bt = handTotal(b);

  const natural = pt >= 8 || bt >= 8;

  let p3: Card | null = null;
  if (!natural && pt <= 5) { p3 = rest[0]; rest = rest.slice(1); p.push(p3); }

  if (!natural) {
    const p3val = p3 ? baccVal(p3) : null;
    const needsBanker = p3val === null ? bt <= 5 :
      bt <= 2 ? true :
      bt === 3 ? p3val !== 8 :
      bt === 4 ? p3val >= 2 && p3val <= 7 :
      bt === 5 ? p3val >= 4 && p3val <= 7 :
      bt === 6 ? p3val === 6 || p3val === 7 : false;
    if (needsBanker) { b.push(rest[0]); rest = rest.slice(1); }
  }

  return { player: p, banker: b, remaining: rest };
}

type BetType = 'player' | 'banker' | 'tie';
type Phase = 'betting' | 'result';

function BaccCard({ card }: { card: Card }) {
  const sym = suitSymbol(card.suit);
  const col = suitColor(card.suit);
  return (
    <div className="playing-card card-face" style={{ width: 60, height: 84 }}>
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
  );
}

export function Baccarat() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [betType, setBetType] = useState<BetType>('player');
  const [phase, setPhase] = useState<Phase>('betting');
  const [hands, setHands] = useState<{ player: Card[]; banker: Card[] } | null>(null);
  const [result, setResult] = useState<{ winner: string; net: number } | null>(null);
  const { toast, show } = useGameToast();

  const deal = () => {
    const seed = Math.floor(Math.random() * 0xFFFFFF);
    const deck = shuffleDeck(createDeck(6), seed);
    const { player, banker } = dealHands(deck);
    const pt = handTotal(player);
    const bt = handTotal(banker);

    let winner: 'player' | 'banker' | 'tie';
    if (pt > bt) winner = 'player';
    else if (bt > pt) winner = 'banker';
    else winner = 'tie';

    const won = winner === betType;
    const mult = betType === 'tie' ? (winner === 'tie' ? 9 : 0) : (won ? (betType === 'banker' ? 1.95 : 2) : 0);
    const returned = Math.round(bet * mult);

    updateBank(-bet);
    if (returned > 0) updateBank(returned);
    const net = returned - bet;
    setHands({ player, banker });
    setResult({ winner: `${winner.toUpperCase()} WINS`, net });
    show(net >= 0, `${winner.toUpperCase()} WINS — ${net >= 0 ? 'YOU WIN' : 'YOU LOSE'}`, net);
    setPhase('result');
  };

  const reset = () => { setPhase('betting'); setHands(null); setResult(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="BACCARAT" bank={gs.bank} onLeave={leave} />

      {hands && (
        <div className="bacc-table">
          {['banker', 'player'].map(side => {
            const cards = side === 'banker' ? hands.banker : hands.player;
            const total = handTotal(cards);
            return (
              <div key={side} className="bacc-side">
                <div className="bacc-side-label">{side.toUpperCase()} — <span className="mono gold">{total}</span></div>
                <div className="bj-hand">
                  {cards.map((c, i) => <BaccCard key={i} card={c} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {phase === 'betting' && (
        <div className="bacc-controls">
          <div className="bacc-bet-select">
            {(['player', 'banker', 'tie'] as BetType[]).map(t => (
              <button key={t} className={`btn-bacc ${betType === t ? 'bacc-sel' : ''}`} onClick={() => setBetType(t)}>
                {t.toUpperCase()}
                <span className="bacc-odds mono">{t === 'tie' ? '8:1' : t === 'banker' ? '0.95:1' : '1:1'}</span>
              </button>
            ))}
          </div>
          <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={deal} confirmLabel="DEAL" />
        </div>
      )}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="DEAL AGAIN" />
      )}
    </div>
  );
}
