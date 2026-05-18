import { Card, Rank, Suit } from '../types';
import { createRNG } from './rng';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(numDecks = 6): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[], seed: number): Card[] {
  const rng = createRNG(seed);
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function cardNumericValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

export function handValue(cards: Card[]): number {
  const visible = cards.filter((c) => !c.faceDown);
  let total = 0;
  let aces = 0;
  for (const c of visible) {
    const v = cardNumericValue(c.rank);
    if (c.rank === 'A') aces++;
    total += v;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isBust(cards: Card[]): boolean {
  return handValue(cards) > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

export function isSoft17(cards: Card[]): boolean {
  const hasAce = cards.some((c) => c.rank === 'A' && !c.faceDown);
  return hasAce && handValue(cards) === 17;
}

export function suitSymbol(suit: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}

export function suitColor(suit: Suit): string {
  if (suit === 'hearts' || suit === 'diamonds') return '#cc2233'; // deep red
  return '#111111'; // near-black for clubs/spades
}
