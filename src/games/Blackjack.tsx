import React, { useState, useCallback, useRef } from 'react';
import { Card } from '../types';
import { useGame } from '../store/gameStore';
import {
  createDeck,
  shuffleDeck,
  handValue,
  isBust,
  isBlackjack,
  suitSymbol,
  suitColor,
} from '../utils/cards';
import { formatMoney } from '../utils/gameLogic';

type BJPhase =
  | 'betting'
  | 'player-turn'
  | 'dealer-turn'
  | 'result';

type BJResult = 'win' | 'blackjack' | 'push' | 'lose' | 'bust';

interface BJState {
  phase: BJPhase;
  bet: number;
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  result: BJResult | null;
  payout: number; // net delta to bank (positive = win, negative = lose)
  canDouble: boolean;
}

function initialBJState(): BJState {
  return {
    phase: 'betting',
    bet: 0,
    playerHand: [],
    dealerHand: [],
    deck: [],
    result: null,
    payout: 0,
    canDouble: false,
  };
}

// Run dealer's hand to completion (stands on hard/soft 17+)
function runDealer(hand: Card[], deck: Card[]): { hand: Card[]; deck: Card[] } {
  let h = hand.map((c) => ({ ...c, faceDown: false }));
  let d = [...deck];
  while (handValue(h) < 17) {
    h = [...h, { ...d[0], faceDown: false }];
    d = d.slice(1);
  }
  return { hand: h, deck: d };
}

function determineResult(
  playerHand: Card[],
  dealerHand: Card[],
  bet: number
): { result: BJResult; payout: number } {
  const pv = handValue(playerHand);
  const dv = handValue(dealerHand);
  const pBJ = isBlackjack(playerHand);
  const dBJ = isBlackjack(dealerHand);

  if (isBust(playerHand)) return { result: 'bust', payout: -bet };
  if (pBJ && dBJ) return { result: 'push', payout: 0 };
  if (pBJ) return { result: 'blackjack', payout: Math.floor(bet * 1.5) };
  if (dBJ) return { result: 'lose', payout: -bet };
  if (isBust(dealerHand)) return { result: 'win', payout: bet };
  if (pv > dv) return { result: 'win', payout: bet };
  if (pv < dv) return { result: 'lose', payout: -bet };
  return { result: 'push', payout: 0 };
}

const RESULT_LABELS: Record<BJResult, string> = {
  win: 'YOU WIN!',
  blackjack: 'BLACKJACK! 🃏',
  push: 'PUSH',
  lose: 'DEALER WINS',
  bust: 'BUST',
};

const RESULT_COLORS: Record<BJResult, string> = {
  win: '#2dc653',
  blackjack: '#ffd700',
  push: '#aaa',
  lose: '#e63946',
  bust: '#e63946',
};

export function Blackjack() {
  const { state: gameState, updateBank, declareBankruptcy, setActiveGame } = useGame();
  const [bj, setBJ] = useState<BJState>(initialBJState);
  const [betInput, setBetInput] = useState(100);
  const handCountRef = useRef(0);

  // --- Betting Actions ---
  const clampBet = (v: number) => Math.max(1, Math.min(v, gameState.bank));

  const deal = useCallback(() => {
    if (betInput <= 0 || betInput > gameState.bank) return;

    handCountRef.current += 1;
    const seed = Math.floor(Math.random() * 0xFFFFFFFF);
    const freshDeck = shuffleDeck(createDeck(6), seed);

    // Deal: player, dealer, player, dealer(face-down)
    const p1 = { ...freshDeck[0], faceDown: false };
    const d1 = { ...freshDeck[1], faceDown: false };
    const p2 = { ...freshDeck[2], faceDown: false };
    const d2 = { ...freshDeck[3], faceDown: true };
    const remaining = freshDeck.slice(4);

    const playerHand = [p1, p2];
    const dealerHand = [d1, d2];

    // Deduct bet immediately
    updateBank(-betInput);

    // Check instant blackjack
    if (isBlackjack(playerHand)) {
      // Reveal dealer hole card
      const revealedDealer = dealerHand.map((c) => ({ ...c, faceDown: false }));
      const { result, payout } = determineResult(playerHand, revealedDealer, betInput);
      // Return bet + payout
      updateBank(betInput + payout);
      setBJ({
        phase: 'result',
        bet: betInput,
        playerHand,
        dealerHand: revealedDealer,
        deck: remaining,
        result,
        payout,
        canDouble: false,
      });
      return;
    }

    setBJ({
      phase: 'player-turn',
      bet: betInput,
      playerHand,
      dealerHand,
      deck: remaining,
      result: null,
      payout: 0,
      canDouble: gameState.bank - betInput >= betInput, // enough to double
    });
  }, [betInput, gameState.bank, updateBank]);

  // --- Player Actions ---
  const hit = useCallback(() => {
    if (bj.phase !== 'player-turn') return;
    const newCard = { ...bj.deck[0], faceDown: false };
    const newHand = [...bj.playerHand, newCard];
    const newDeck = bj.deck.slice(1);

    if (isBust(newHand)) {
      const revealedDealer = bj.dealerHand.map((c) => ({ ...c, faceDown: false }));
      setBJ((s) => ({
        ...s,
        playerHand: newHand,
        dealerHand: revealedDealer,
        deck: newDeck,
        phase: 'result',
        result: 'bust',
        payout: -bj.bet,
        canDouble: false,
      }));
      return;
    }

    setBJ((s) => ({
      ...s,
      playerHand: newHand,
      deck: newDeck,
      canDouble: false,
    }));
  }, [bj]);

  const stand = useCallback(() => {
    if (bj.phase !== 'player-turn') return;
    const { hand: dealerFinal, deck: newDeck } = runDealer(bj.dealerHand, bj.deck);
    const { result, payout } = determineResult(bj.playerHand, dealerFinal, bj.bet);
    // Return bet + payout (payout can be negative = loss already taken at deal)
    updateBank(bj.bet + payout);
    setBJ((s) => ({
      ...s,
      dealerHand: dealerFinal,
      deck: newDeck,
      phase: 'result',
      result,
      payout,
      canDouble: false,
    }));
  }, [bj, updateBank]);

  const double = useCallback(() => {
    if (bj.phase !== 'player-turn' || !bj.canDouble) return;
    if (gameState.bank < bj.bet) return;
    // Deduct extra bet
    updateBank(-bj.bet);
    const newCard = { ...bj.deck[0], faceDown: false };
    const newHand = [...bj.playerHand, newCard];
    const newDeck = bj.deck.slice(1);
    const totalBet = bj.bet * 2;

    if (isBust(newHand)) {
      const revealedDealer = bj.dealerHand.map((c) => ({ ...c, faceDown: false }));
      setBJ((s) => ({
        ...s,
        bet: totalBet,
        playerHand: newHand,
        dealerHand: revealedDealer,
        deck: newDeck,
        phase: 'result',
        result: 'bust',
        payout: -totalBet,
        canDouble: false,
      }));
      return;
    }

    const { hand: dealerFinal, deck: finalDeck } = runDealer(bj.dealerHand, newDeck);
    const { result, payout } = determineResult(newHand, dealerFinal, totalBet);
    updateBank(totalBet + payout);
    setBJ((s) => ({
      ...s,
      bet: totalBet,
      playerHand: newHand,
      dealerHand: dealerFinal,
      deck: finalDeck,
      phase: 'result',
      result,
      payout,
      canDouble: false,
    }));
  }, [bj, updateBank]);

  const playAgain = useCallback(() => {
    if (gameState.bank <= 0) { declareBankruptcy(); return; }
    setBJ(initialBJState());
    setBetInput((prev) => Math.min(prev, gameState.bank));
  }, [gameState.bank, declareBankruptcy]);

  const leave = useCallback(() => {
    if (gameState.bank <= 0) { declareBankruptcy(); return; }
    setActiveGame(null);
  }, [gameState.bank, declareBankruptcy, setActiveGame]);

  return (
    <div className="game-view">
      {/* Header */}
      <div className="game-view-header">
        <button className="btn-back" onClick={leave}>
          ← BACK
        </button>
        <h2 className="game-view-title">BLACKJACK</h2>
        <div className="game-view-bank mono">{formatMoney(gameState.bank)}</div>
      </div>

      {/* Table */}
      <div className="bj-table">
        {/* Dealer Area */}
        <div className="bj-side dealer">
          <div className="bj-side-label">
            DEALER
            {bj.phase !== 'betting' && (
              <span className="bj-hand-value">
                {bj.phase === 'player-turn'
                  ? handValue(bj.dealerHand.filter((c) => !c.faceDown)) + '?'
                  : handValue(bj.dealerHand)}
              </span>
            )}
          </div>
          <div className="bj-hand">
            {bj.dealerHand.map((card, i) => (
              <PlayingCard key={i} card={card} index={i} />
            ))}
          </div>
        </div>

        {/* Result Banner */}
        {bj.result && (
          <div className="bj-result-banner" style={{ color: RESULT_COLORS[bj.result] }}>
            <div className="bj-result-label">{RESULT_LABELS[bj.result]}</div>
            <div className="bj-result-payout mono">
              {bj.payout > 0
                ? `+${formatMoney(bj.payout)}`
                : bj.payout < 0
                ? formatMoney(bj.payout)
                : 'PUSH — BET RETURNED'}
            </div>
          </div>
        )}

        {/* Player Area */}
        <div className="bj-side player">
          <div className="bj-side-label">
            YOU
            {bj.phase !== 'betting' && (
              <span
                className="bj-hand-value"
                style={{ color: isBust(bj.playerHand) ? '#e63946' : undefined }}
              >
                {handValue(bj.playerHand)}
                {isBust(bj.playerHand) ? ' BUST' : ''}
              </span>
            )}
          </div>
          <div className="bj-hand">
            {bj.playerHand.map((card, i) => (
              <PlayingCard key={i} card={card} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bj-controls">
        {bj.phase === 'betting' && (
          <BettingPanel
            bank={gameState.bank}
            value={betInput}
            onChange={(v) => setBetInput(clampBet(v))}
            onDeal={deal}
          />
        )}

        {bj.phase === 'player-turn' && (
          <div className="bj-actions">
            <div className="bj-bet-display">
              BET: <span className="mono gold">{formatMoney(bj.bet)}</span>
            </div>
            <div className="bj-action-row">
              <button className="btn-action" onClick={hit}>HIT</button>
              <button className="btn-action" onClick={stand}>STAND</button>
              {bj.canDouble && (
                <button className="btn-action btn-double" onClick={double}>
                  DOUBLE ({formatMoney(bj.bet * 2)})
                </button>
              )}
            </div>
          </div>
        )}

        {bj.phase === 'result' && (
          <div className="bj-result-actions">
            {gameState.bank <= 0 ? (
              <button className="btn-primary" onClick={declareBankruptcy}>
                GAME OVER
              </button>
            ) : (
              <>
                <button className="btn-primary" onClick={playAgain}>
                  DEAL AGAIN
                </button>
                <button className="btn-secondary" onClick={leave}>
                  LEAVE TABLE
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Betting Panel ────────────────────────────────────────────────────────────

function BettingPanel({
  bank,
  value,
  onChange,
  onDeal,
}: {
  bank: number;
  value: number;
  onChange: (v: number) => void;
  onDeal: () => void;
}) {
  const presets = [
    { label: 'MIN', v: 10 },
    { label: '$100', v: 100 },
    { label: '$500', v: 500 },
    { label: '$1K', v: 1000 },
    { label: 'ALL IN', v: bank },
  ];

  return (
    <div className="betting-panel">
      <div className="betting-title">PLACE YOUR BET</div>
      <div className="betting-presets">
        {presets.map((p) => (
          <button
            key={p.label}
            className={`btn-preset ${value === Math.min(p.v, bank) ? 'btn-preset-active' : ''}`}
            onClick={() => onChange(Math.min(p.v, bank))}
            disabled={p.v > bank}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="betting-input-row">
        <button className="btn-adj" onClick={() => onChange(Math.max(1, value - 100))}>−</button>
        <input
          className="betting-input mono"
          type="number"
          min={1}
          max={bank}
          value={value}
          onChange={(e) => onChange(Math.min(bank, Math.max(1, parseInt(e.target.value) || 1)))}
        />
        <button className="btn-adj" onClick={() => onChange(Math.min(bank, value + 100))}>+</button>
      </div>
      <button
        className="btn-primary btn-deal"
        onClick={onDeal}
        disabled={value <= 0 || value > bank}
      >
        DEAL — {formatMoney(value)}
      </button>
    </div>
  );
}

// ─── Playing Card ─────────────────────────────────────────────────────────────

function PlayingCard({ card, index }: { card: Card; index: number }) {
  if (card.faceDown) {
    return (
      <div className="playing-card card-back" style={{ animationDelay: `${index * 80}ms` }}>
        <div className="card-back-pattern" />
      </div>
    );
  }

  const symbol = suitSymbol(card.suit);
  const color = suitColor(card.suit);

  return (
    <div
      className="playing-card card-face"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="card-corner top-left" style={{ color }}>
        <div className="card-rank">{card.rank}</div>
        <div className="card-suit-small">{symbol}</div>
      </div>
      <div className="card-center-suit" style={{ color }}>
        {symbol}
      </div>
      <div className="card-corner bottom-right" style={{ color }}>
        <div className="card-rank">{card.rank}</div>
        <div className="card-suit-small">{symbol}</div>
      </div>
    </div>
  );
}
