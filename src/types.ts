export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceDown?: boolean;
}

export type GamePhase = 'playing' | 'paused' | 'day-end' | 'game-over' | 'victory';

export interface GameHistoryEntry {
  day: number;
  startBank: number;
  endBank: number;
  quotaHit: boolean;
  profit: number;
  penalty: number;
}

export interface Collectible {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  obtainedAt: number; // timestamp
}

export interface GameState {
  day: number;
  floor: number;
  bank: number;
  quota: number;
  timeLeft: number;
  tickets: number;
  collectibles: Collectible[];
  activeGame: string | null;
  gameHistory: GameHistoryEntry[];
  phase: GamePhase;
  dailyStartBank: number;
  availableGames: string[];
  // Persist across resets
  winCount: number;          // how many times player has cleared floor 5
  incomeMultiplier: number;  // 1.2^winCount — applied to all bank gains
  lastDailyRewardDay: number; // track which day player last claimed daily reward
  cursedUsers: Record<string, number>; // dev only: username -> expiration timestamp (0 = permanent)
}

export type GameAction =
  | { type: 'SET_ACTIVE_GAME'; game: string | null }
  | { type: 'UPDATE_BANK'; delta: number }
  | { type: 'DECLARE_BANKRUPTCY' }
  | { type: 'TICK_TIMER' }
  | { type: 'END_DAY_MANUAL' }
  | { type: 'START_NEXT_DAY' }
  | { type: 'ASCEND' }              // on day 15: bump multiplier, reset to day 1
  | { type: 'RESET_GAME' }          // fresh start (game-over / new-game button)
  | { type: 'NEW_RUN' }             // after victory: preserve collectibles + bump multiplier
  | { type: 'PAUSE' }               // pause game
  | { type: 'RESUME' }              // resume game
  | { type: 'SET_FLOOR'; floor: number }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'BUY_TICKET'; cost: number; machineId: string }
  | { type: 'ROLL_COLLECTIBLE'; collectible: Collectible }
  | { type: 'CLAIM_DAILY_REWARD' } // claim daily reward tickets
  | { type: 'CURSE_USER'; username: string; duration?: number } // dev only: curse a user (duration in ms, 0=permanent)
  | { type: 'UNCURSE_USER'; username: string }; // dev only: remove curse from a user
