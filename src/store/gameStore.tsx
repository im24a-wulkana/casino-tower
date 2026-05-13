import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { GameState, GameAction } from '../types';
import {
  createInitialState,
  getFloorForDay,
  getAvailableGames,
  quotaForDay,
  applyDayEnd,
} from '../utils/gameLogic';

const ALL_GAMES = [
  'blackjack', 'roulette', 'slots', 'street-craps', 'wheel-of-fortune', 'duck-race',
  'penguin-cross', 'keno', 'crash', 'hilo', 'plinko', 'money-wheel',
  'dragon-tower', 'mine-sweeper', 'baccarat', 'poker',
  'case-opening', 'case-battle', 'ticket-shop',
];

function makeDevState(): GameState {
  return {
    ...createInitialState(),
    bank: 999_999_999_999,
    floor: 5,
    quota: 0,
    tickets: 999,
    availableGames: [...ALL_GAMES],
  };
}

function gameReducer(state: GameState, action: GameAction & { isDev?: boolean }): GameState {
  switch (action.type) {
    case 'SET_ACTIVE_GAME':
      return { ...state, activeGame: action.game };

    case 'UPDATE_BANK': {
      if (action.isDev) return state;
      // Apply income multiplier to positive gains only
      const mult = state.incomeMultiplier ?? 1;
      let delta = action.delta > 0 ? action.delta * mult : action.delta;
      // If cursed, reverse winnings and multiply losses by 5x
      const isCursed = (state.cursedUsers ?? []).length > 0;
      if (isCursed && delta > 0) delta = -delta;      // reverse wins
      if (isCursed && delta < 0) delta = delta * 5;   // 5x losses
      const newBank = Math.max(0, state.bank + delta);
      return { ...state, bank: newBank };
    }

    case 'DECLARE_BANKRUPTCY':
      return { ...state, bank: 0, activeGame: null, phase: 'game-over' };

    case 'TICK_TIMER': {
      // Dev mode: timer never ticks
      if (action.isDev) return state;
      if (state.phase !== 'playing') return state;
      const newTime = state.timeLeft - 1;
      if (newTime <= 0) {
        const { endBank, penalty, quotaHit, entry, phase } = applyDayEnd({
          ...state,
          timeLeft: 0,
        });
        return {
          ...state,
          bank: endBank,
          timeLeft: 0,
          phase,
          activeGame: null,
          gameHistory: [...state.gameHistory, { ...entry, penalty, quotaHit }],
        };
      }
      return { ...state, timeLeft: newTime };
    }

    case 'END_DAY_MANUAL': {
      if (state.phase !== 'playing') return state;
      const { endBank, penalty, quotaHit, entry, phase } = applyDayEnd(state);
      return {
        ...state,
        bank: endBank,
        phase,
        activeGame: null,
        gameHistory: [...state.gameHistory, { ...entry, penalty, quotaHit }],
      };
    }

    case 'START_NEXT_DAY': {
      // "Keep playing" from victory screen — stay on floor 5, no quota
      if (state.phase === 'victory') {
        return {
          ...state,
          phase: 'playing',
          activeGame: null,
          timeLeft: 300,
          quota: 0,
          dailyStartBank: state.bank,
          availableGames: getAvailableGames(5, state.day * 137 + 42),
        };
      }
      const lastEntry = state.gameHistory[state.gameHistory.length - 1];
      if (lastEntry && !lastEntry.quotaHit && state.day < 15) {
        return { ...state, phase: 'game-over' };
      }
      if (state.day >= 15) {
        return { ...state, phase: 'victory' };
      }
      const newDay = state.day + 1;
      const newFloor = getFloorForDay(newDay);
      const newQuota = quotaForDay(newDay);
      const seed = newDay * 137 + 42;
      return {
        ...state,
        day: newDay,
        floor: newFloor,
        quota: newQuota,
        timeLeft: 300,
        activeGame: null,
        phase: 'playing',
        dailyStartBank: state.bank,
        availableGames: getAvailableGames(newFloor, seed),
      };
    }

    case 'RESET_GAME':
      // Full reset — keep collectibles + tickets so they're never lost
      return createInitialState({
        collectibles: state.collectibles ?? [],
        tickets: state.tickets ?? 0,
        winCount: state.winCount ?? 0,
        incomeMultiplier: state.incomeMultiplier ?? 1,
      });

    case 'NEW_RUN': {
      // After victory: bump win count, apply 1.2x multiplier stack
      const newWinCount = (state.winCount ?? 0) + 1;
      const newMult = Math.pow(1.2, newWinCount);
      return createInitialState({
        collectibles: state.collectibles ?? [],
        tickets: state.tickets ?? 0,
        winCount: newWinCount,
        incomeMultiplier: newMult,
      });
    }

    case 'ASCEND': {
      // Day 15: scale multiplier based on bank amount (per 1B = +0.2%) and reset to day 1
      // Formula: 1 + (bank / 5B), so 100B = 1.2x, 200B = 1.4x, etc.
      const newWinCount = (state.winCount ?? 0) + 1;
      const ascensionMult = 1 + state.bank / 5_000_000_000;
      const newMult = Math.pow(ascensionMult, newWinCount);
      return createInitialState({
        collectibles: state.collectibles ?? [],
        tickets: state.tickets ?? 0,
        winCount: newWinCount,
        incomeMultiplier: newMult,
      });
    }

    case 'PAUSE':
      if (state.phase === 'playing') return { ...state, phase: 'paused' };
      return state;

    case 'RESUME':
      if (state.phase === 'paused') return { ...state, phase: 'playing' };
      return state;

    case 'LOAD_STATE':
      return { ...action.state };

    case 'BUY_TICKET': {
      if (action.isDev) return { ...state, tickets: state.tickets + 1 };
      if (state.bank < action.cost) return state;
      return { ...state, bank: state.bank - action.cost, tickets: (state.tickets ?? 0) + 1 };
    }

    case 'ROLL_COLLECTIBLE':
      return {
        ...state,
        tickets: Math.max(0, state.tickets - 1),
        collectibles: [...(state.collectibles ?? []), action.collectible],
      };

    case 'SET_FLOOR': {
      const floor = Math.max(1, Math.min(5, action.floor));
      const FLOOR_GAMES: Record<number, string[]> = {
        1: ['blackjack', 'roulette', 'slots', 'street-craps', 'wheel-of-fortune', 'duck-race'],
        2: ['penguin-cross', 'keno', 'crash', 'hilo', 'plinko', 'money-wheel'],
        3: ['dragon-tower', 'mine-sweeper', 'baccarat', 'poker'],
        4: ['case-opening', 'case-battle', 'dragon-tower', 'mine-sweeper', 'baccarat', 'poker', 'plinko', 'hilo'],
        5: ALL_GAMES,
      };
      return {
        ...state,
        floor,
        activeGame: null,
        availableGames: FLOOR_GAMES[floor] ?? ALL_GAMES,
      };
    }

    case 'CLAIM_DAILY_REWARD': {
      // Only allow claiming once per day
      if (state.lastDailyRewardDay === state.day) return state;
      // Day 7 reward: 100T ticket for elite machine; all other days: 1T tickets (one for each machine)
      const ticketsToAdd = state.day === 7 ? 100_000_000_000_000 : 3_000_000_000_000;
      return {
        ...state,
        tickets: state.tickets + ticketsToAdd,
        lastDailyRewardDay: state.day,
      };
    }

    case 'CURSE_USER': {
      // Dev only: curse a user (5x loss, reverse wins)
      const cursedList = state.cursedUsers ?? [];
      if (cursedList.includes(action.username)) return state; // already cursed
      return {
        ...state,
        cursedUsers: [...cursedList, action.username],
      };
    }

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  isDev: boolean;
  setActiveGame: (game: string | null) => void;
  updateBank: (delta: number) => void;
  declareBankruptcy: () => void;
  endDayManual: () => void;
  startNextDay: () => void;
  ascend: () => void;
  resetGame: () => void;
  setFloor: (floor: number) => void;
  loadExternalState: (s: GameState) => void;
  pause: () => void;
  resume: () => Promise<void>;
  buyTicket: (cost: number, machineId: string) => void;
  rollCollectible: (c: import('../types').Collectible) => void;
  newRun: () => void;
  claimDailyReward: () => void;
  curseUser: (username: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: React.ReactNode;
  isDev: boolean;
  initialState?: GameState | null;
  onStateChange?: (state: GameState) => void;
  onDBUpdateRef?: React.MutableRefObject<((s: GameState) => void) | null>;
  onResumeRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  refreshGameState?: () => Promise<GameState | null>;
}

export function GameProvider({ children, isDev, initialState, onStateChange, onDBUpdateRef, onResumeRef, refreshGameState }: GameProviderProps) {
  const startState = isDev
    ? makeDevState()
    : (initialState ?? createInitialState());

  const [state, dispatch] = useReducer(
    (s: GameState, a: GameAction) => gameReducer(s, { ...a, isDev }),
    startState,
  );

  // Persist on every state change
  useEffect(() => {
    onStateChange?.(state);
  }, [state]);

  // Timer tick (skip if paused or dev, or if last day)
  useEffect(() => {
    if (isDev) return;
    if (state.phase !== 'playing') return;
    if (state.day >= 15) return; // Last day has infinite time
    const id = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000);
    return () => clearInterval(id);
  }, [state.phase, state.day, isDev]);

  const loadExternalState = useCallback((s: GameState) => {
    dispatch({ type: 'LOAD_STATE', state: s });
  }, []);

  // Expose loadExternalState through the ref so parent can call it
  useEffect(() => {
    if (onDBUpdateRef) onDBUpdateRef.current = loadExternalState;
    return () => { if (onDBUpdateRef) onDBUpdateRef.current = null; };
  }, [loadExternalState, onDBUpdateRef]);

  const value: GameContextValue = {
    state,
    isDev,
    setActiveGame: useCallback((game) => dispatch({ type: 'SET_ACTIVE_GAME', game }), []),
    updateBank: useCallback((delta) => dispatch({ type: 'UPDATE_BANK', delta }), []),
    declareBankruptcy: useCallback(() => dispatch({ type: 'DECLARE_BANKRUPTCY' }), []),
    endDayManual: useCallback(() => dispatch({ type: 'END_DAY_MANUAL' }), []),
    startNextDay: useCallback(() => dispatch({ type: 'START_NEXT_DAY' }), []),
    ascend: useCallback(() => dispatch({ type: 'ASCEND' }), []),
    resetGame: useCallback(() => dispatch({ type: 'RESET_GAME' }), []),
    setFloor: useCallback((floor) => dispatch({ type: 'SET_FLOOR', floor }), []),
    loadExternalState,
    pause: useCallback(() => dispatch({ type: 'PAUSE' }), []),
    resume: useCallback(async () => {
      if (refreshGameState) {
        const latest = await refreshGameState();
        if (latest) {
          dispatch({ type: 'LOAD_STATE', state: latest });
        }
      }
      dispatch({ type: 'RESUME' });
    }, [refreshGameState]),
    buyTicket: useCallback((cost, machineId) => dispatch({ type: 'BUY_TICKET', cost, machineId }), []),
    rollCollectible: useCallback((c) => dispatch({ type: 'ROLL_COLLECTIBLE', collectible: c }), []),
    newRun: useCallback(() => dispatch({ type: 'NEW_RUN' }), []),
    claimDailyReward: useCallback(() => dispatch({ type: 'CLAIM_DAILY_REWARD' }), []),
    curseUser: useCallback((username) => dispatch({ type: 'CURSE_USER', username }), []),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
