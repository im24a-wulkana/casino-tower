export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceDown?: boolean;
}

export type GamePhase = 'playing' | 'day-end' | 'game-over' | 'victory';

export interface GameHistoryEntry {
  day: number;
  startBank: number;
  endBank: number;
  quotaHit: boolean;
  profit: number;
  penalty: number;
}

export interface GameState {
  day: number;
  floor: number;
  bank: number;
  quota: number;
  timeLeft: number;
  tickets: number;
  activeGame: string | null;
  gameHistory: GameHistoryEntry[];
  phase: GamePhase;
  dailyStartBank: number;
  availableGames: string[];
}

export type GameAction =
  | { type: 'SET_ACTIVE_GAME'; game: string | null }
  | { type: 'UPDATE_BANK'; delta: number }
  | { type: 'DECLARE_BANKRUPTCY' }
  | { type: 'TICK_TIMER' }
  | { type: 'END_DAY_MANUAL' }
  | { type: 'START_NEXT_DAY' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_FLOOR'; floor: number };
