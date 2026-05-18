import { GameState, GameHistoryEntry, GamePhase } from '../types';
import { createRNG } from './rng';

export const FLOOR_LABELS: Record<number, string> = {
  1: 'LOBBY',
  2: 'MEZZANINE',
  3: 'HIGH STAKES',
  4: 'PENTHOUSE',
  5: 'LEGEND',
};

const FLOOR_GAMES: Record<number, string[]> = {
  1: ['blackjack', 'roulette', 'slots', 'street-craps', 'wheel-of-fortune', 'duck-race'],
  2: ['penguin-cross', 'keno', 'crash', 'hilo', 'plinko', 'money-wheel'],
  3: ['dragon-tower', 'mine-sweeper', 'baccarat', 'poker'],
  4: ['dragon-tower', 'mine-sweeper', 'baccarat', 'poker', 'plinko', 'hilo'],
};

const FLOOR4_FIXED = ['case-opening', 'case-battle'];

const ALL_GAMES_F5 = [
  'blackjack', 'roulette', 'slots', 'street-craps', 'wheel-of-fortune', 'duck-race',
  'penguin-cross', 'keno', 'crash', 'hilo', 'plinko', 'money-wheel',
  'dragon-tower', 'mine-sweeper', 'baccarat', 'poker',
  'case-opening', 'case-battle', 'ticket-shop',
];

export function getFloorForDay(day: number): number {
  if (day <= 3) return 1;
  if (day <= 6) return 2;
  if (day <= 9) return 3;
  if (day <= 12) return 4;
  return 5;
}

export function getAvailableGames(floor: number, seed: number): string[] {
  if (floor === 5) return ALL_GAMES_F5;
  const pool = [...(FLOOR_GAMES[floor] ?? FLOOR_GAMES[1])];
  const rng = createRNG(seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  if (floor === 4) {
    return [...FLOOR4_FIXED, ...pool.slice(0, 2)];
  }
  return pool.slice(0, Math.min(4, pool.length));
}

export function quotaForDay(day: number): number {
  // Days 13-15: floor 5 — escalating quotas (smoothed progression)
  if (day === 13) return 1_000_000;         // $1M (was $5M — smoother from day 12)
  if (day === 14) return 25_000_000;        // $25M (was $75M)
  if (day === 15) return 500_000_000;       // $500M (was $1B)
  let q = 2000;
  for (let i = 1; i < day; i++) q = Math.round(q * 1.6);
  return q;
}

export function penaltyForMiss(bank: number, quota: number): number {
  if (bank >= quota) return 0;
  // 25% of bank, capped at the shortfall amount
  const shortfall = quota - bank;
  return Math.min(Math.round(bank * 0.25), shortfall);
}

export function applyDayEnd(state: GameState): {
  endBank: number;
  penalty: number;
  quotaHit: boolean;
  entry: GameHistoryEntry;
  phase: GamePhase;
} {
  const quotaHit = state.bank >= state.quota;
  const penalty = quotaHit ? 0 : penaltyForMiss(state.bank, state.quota);
  const endBank = Math.max(0, state.bank - penalty);

  const entry: GameHistoryEntry = {
    day: state.day,
    startBank: state.dailyStartBank,
    endBank,
    quotaHit,
    profit: endBank - state.dailyStartBank,
    penalty,
  };

  let phase: GamePhase;
  if (endBank <= 0) {
    phase = 'game-over';
  } else if (state.day >= 15) {
    phase = 'victory';
  } else {
    phase = 'day-end';
  }

  return { endBank, penalty, quotaHit, entry, phase };
}

export function createInitialState(overrides?: Partial<GameState>): GameState {
  const day = 1;
  const floor = 1;
  const bank = 1000;
  const quota = quotaForDay(day);
  return {
    day,
    floor,
    bank,
    quota,
    timeLeft: 300,
    tickets: overrides?.tickets ?? 0,
    collectibles: overrides?.collectibles ?? [],
    activeGame: null,
    gameHistory: [],
    phase: 'playing',
    dailyStartBank: bank,
    availableGames: getAvailableGames(floor, day * 137 + 42),
    winCount: overrides?.winCount ?? 0,
    incomeMultiplier: overrides?.incomeMultiplier ?? 1,
    lastDailyRewardDay: overrides?.lastDailyRewardDay ?? 0,
    cursedUsers: overrides?.cursedUsers ?? {},
  };
}

export function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000)     return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000)         return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)             return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}$${abs.toLocaleString()}`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const GAME_META: Record<string, { name: string; floor: number; description: string }> = {
  blackjack: { name: 'Blackjack', floor: 1, description: 'Beat the dealer to 21. BJ pays 3:2.' },
  roulette: { name: 'Roulette', floor: 1, description: 'Bet on number, color, or dozen.' },
  slots: { name: 'Slots', floor: 1, description: '3×7=10x, 3×other=5x, 2-match=1.2x.' },
  'street-craps': { name: 'Street Craps', floor: 1, description: '7/11 win. 2/3/12 lose. Roll the point.' },
  'wheel-of-fortune': { name: 'Wheel of Fortune', floor: 1, description: 'Spin for 2x–10x or LOSE.' },
  'duck-race': { name: 'Duck Race', floor: 1, description: '5 ducks race. Pick yours. YARL pays 8:1.' },
  'penguin-cross': { name: 'Penguin Cross', floor: 2, description: '6 lanes, 1.2x each. Avoid the cars.' },
  keno: { name: 'Keno', floor: 2, description: 'Pick 5 numbers. Match 3–5 for prizes.' },
  crash: { name: 'Crash', floor: 2, description: 'Cash out before the rocket crashes.' },
  hilo: { name: 'HiLo', floor: 2, description: 'Higher or lower? 8 rounds, cash out anytime.' },
  plinko: { name: 'Plinko', floor: 2, description: 'Drop a ball for up to 24x.' },
  'money-wheel': { name: 'Money Wheel', floor: 2, description: 'Big wheel with SKULL segments.' },
  'dragon-tower': { name: 'Dragon Tower', floor: 3, description: '5 rows of eggs. Avoid the bomb.' },
  'mine-sweeper': { name: 'Minesweeper', floor: 3, description: '5x5 grid, 5 mines. Tile up your multiplier.' },
  baccarat: { name: 'Baccarat', floor: 3, description: 'Player, Banker, or Tie. Tie pays 8:1.' },
  poker: { name: '1P Poker', floor: 3, description: '5-card draw vs. house. Swap up to 3 cards.' },
  'case-opening': { name: 'Case Opening', floor: 4, description: 'Open one of 10 cases. High risk, massive rewards.' },
  'case-battle': { name: 'Case Battle', floor: 4, description: '1v1, 2v2, FFA or CRAZY. Highest value takes the pot.' },
  'ticket-shop': { name: 'Ticket Shop', floor: 5, description: 'Buy tickets, spin for collectibles. 3 machine tiers.' },
};
