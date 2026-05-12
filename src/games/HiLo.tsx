import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';
import { BettingPanel, GameHeader, ResultActions, useGameToast, GameToast } from '../components/BettingPanel';
import { createDeck, shuffleDeck, suitSymbol, suitColor } from '../utils/cards';
import { Card, Rank } from '../types';

const RANK_ORDER: Record<Rank, number> = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13,
};
const MAX_ROUNDS = 8;
const MULT_PER = 1.9;

type Phase = 'betting' | 'playing' | 'result';

interface HiLoState {
  bet: number;
  deck: Card[];
  current: Card;
  next: Card | null;
  round: number;
  multiplier: number;
  result: 'win' | 'lose' | null;
}

function SmallCard({ card, hidden }: { card: Card; hidden?: boolean }) {
  if (hidden) return <div className="hilo-card hilo-card-back" />;
  const sym = suitSymbol(card.suit);
  const col = suitColor(card.suit);
  return (
    <div className="hilo-card hilo-card-face">
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

export function HiLo() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const [bet, setBet] = useState(Math.min(100, gs.bank));
  const [phase, setPhase] = useState<Phase>('betting');
  const [hl, setHl] = useState<HiLoState | null>(null);
  const { toast, show } = useGameToast();

  const startGame = () => {
    const seed = Math.floor(Math.random() * 0xFFFFFF);
    const deck = shuffleDeck(createDeck(1), seed);
    updateBank(-bet);
    setHl({ bet, deck: deck.slice(2), current: deck[0], next: null, round: 1, multiplier: 1, result: null });
    setPhase('playing');
  };

  const guess = (dir: 'higher' | 'lower') => {
    if (!hl || phase !== 'playing') return;
    const nextCard = hl.deck[0];
    const remaining = hl.deck.slice(1);
    const curVal = RANK_ORDER[hl.current.rank];
    const nextVal = RANK_ORDER[nextCard.rank];

    const tie = nextVal === curVal;
    const correct = (dir === 'higher' && nextVal > curVal) || (dir === 'lower' && nextVal < curVal);

    if (tie) {
      const returned = Math.round(hl.bet * hl.multiplier);
      updateBank(returned);
      show(true, 'PUSH — YOU WIN', returned - hl.bet);
      setHl(s => s && { ...s, next: nextCard, result: 'win' });
      setPhase('result');
      return;
    }

    if (!correct) {
      show(false, 'WRONG — YOU LOSE', -hl.bet);
      setHl(s => s && { ...s, next: nextCard, result: 'lose' });
      setPhase('result');
      return;
    }

    const newMult = Math.round(hl.multiplier * MULT_PER * 100) / 100;

    if (hl.round >= MAX_ROUNDS || remaining.length === 0) {
      const returned = Math.round(hl.bet * newMult);
      updateBank(returned);
      show(true, 'YOU WIN', returned - hl.bet);
      setHl(s => s && { ...s, next: nextCard, deck: remaining, round: hl.round + 1, multiplier: newMult, result: 'win' });
      setPhase('result');
    } else {
      setHl(s => s && { ...s, current: nextCard, next: null, deck: remaining, round: hl.round + 1, multiplier: newMult });
    }
  };

  const cashOut = () => {
    if (!hl || hl.round <= 1) return;
    const returned = Math.round(hl.bet * hl.multiplier);
    updateBank(returned);
    show(true, 'CASHED OUT — YOU WIN', returned - hl.bet);
    setHl(s => s && { ...s, result: 'win' });
    setPhase('result');
  };

  const reset = () => { setPhase('betting'); setHl(null); setBet(v => Math.min(v, gs.bank)); };
  const leave = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const net = hl
    ? (hl.result === 'win' ? Math.round(hl.bet * hl.multiplier) - hl.bet : -hl.bet)
    : 0;

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="HILO" bank={gs.bank} onLeave={leave} />

      {hl && (
        <div className="hilo-area">
          <div className="hilo-mult-bar">
            <span className="hilo-round">ROUND {hl.round}/{MAX_ROUNDS}</span>
            <span className="hilo-mult mono gold">{hl.multiplier.toFixed(2)}× multiplier</span>
          </div>

          <div className="hilo-cards">
            <SmallCard card={hl.current} />
            {hl.next ? <SmallCard card={hl.next} /> : <div className="hilo-card hilo-card-back" />}
          </div>

          <div className="hilo-card-label">
            {hl.next ? `NEXT: ${hl.next.rank}${suitSymbol(hl.next.suit)}` : 'NEXT CARD — HIGHER OR LOWER?'}
          </div>

          {phase === 'playing' && !hl.result && (
            <div className="hilo-buttons">
              <button className="btn-hilo btn-higher" onClick={() => guess('higher')}>HIGHER ↑</button>
              <button className="btn-hilo btn-lower" onClick={() => guess('lower')}>LOWER ↓</button>
              {hl.round > 1 && (
                <button className="btn-action" onClick={cashOut}>
                  CASH OUT ({formatMoney(Math.round(hl.bet * hl.multiplier))})
                </button>
              )}
            </div>
          )}
        </div>
      )}


      {phase === 'betting' && (
        <BettingPanel bank={gs.bank} value={bet} onChange={v => setBet(Math.max(1, Math.min(v, gs.bank)))} onConfirm={startGame} confirmLabel="START GAME" />
      )}
      {phase === 'result' && (
        <ResultActions bank={gs.bank} onPlayAgain={reset} onLeave={leave} onBankrupt={declareBankruptcy} playLabel="PLAY AGAIN" />
      )}
    </div>
  );
}
