import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { GameState, GameAction } from '../types';
import {
  createInitialState,
  getFloorForDay,
  getAvailableGames,
  quotaForDay,
  applyDayEnd,
} from '../utils/gameLogic';

// All games on all floors — used for dev mode
const ALL_GAMES = [
  'blackjack', 'roulette', 'slots', 'street-craps', 'wheel-of-fortune', 'duck-race',
  'penguin-cross', 'keno', 'crash', 'hilo', 'plinko', 'money-wheel',
  'dragon-tower', 'mine-sweeper', 'baccarat', 'poker',
];

function makeDevState(): GameState {
  return {
    ...createInitialState(),
    bank: 999_999_999,
    floor: 4,
    quota: 0,
    availableGames: [
      'blackjack', 'roulette', 'slots', 'street-craps', 'wheel-of-fortune', 'duck-race',
      'penguin-cross', 'keno', 'crash', 'hilo', 'plinko', 'money-wheel',
      'dragon-tower', 'mine-sweeper', 'baccarat', 'poker',
      'case-opening', 'case-battle',
    ],
  };
}

function gameReducer(state: GameState, action: GameAction & { isDev?: boolean }): GameState {
  switch (action.type) {
    case 'SET_ACTIVE_GAME':
      return { ...state, activeGame: action.game };

    case 'UPDATE_BANK': {
      // Dev mode: bank never changes
      if (action.isDev) return state;
      const newBank = Math.max(0, state.bank + action.delta);
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
      const lastEntry = state.gameHistory[state.gameHistory.length - 1];
      if (lastEntry && !lastEntry.quotaHit && state.day < 12) {
        return { ...state, phase: 'game-over' };
      }
      if (state.day >= 12) {
        return { ...state, phase: state.bank >= 500_000 ? 'victory' : 'game-over' };
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
      return createInitialState();

    case 'LOAD_STATE':
      return { ...action.state };

    case 'SET_FLOOR': {
      const floor = Math.max(1, Math.min(4, action.floor));
      const FLOOR_GAMES: Record<number, string[]> = {
        1: ['blackjack', 'roulette', 'slots', 'street-craps', 'wheel-of-fortune', 'duck-race'],
        2: ['penguin-cross', 'keno', 'crash', 'hilo', 'plinko', 'money-wheel'],
        3: ['dragon-tower', 'mine-sweeper', 'baccarat', 'poker'],
        4: ['case-opening', 'case-battle', 'dragon-tower', 'mine-sweeper', 'baccarat', 'poker', 'plinko', 'hilo', 'crash', 'blackjack'],
      };
      return {
        ...state,
        floor,
        activeGame: null,
        availableGames: FLOOR_GAMES[floor] ?? ALL_GAMES,
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
  resetGame: () => void;
  setFloor: (floor: number) => void;
  loadExternalState: (s: GameState) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: React.ReactNode;
  isDev: boolean;
  initialState?: GameState | null;
  onStateChange?: (state: GameState) => void;
  onDBUpdateRef?: React.MutableRefObject<((s: GameState) => void) | null>;
}

export function GameProvider({ children, isDev, initialState, onStateChange, onDBUpdateRef }: GameProviderProps) {
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

  // Timer tick
  useEffect(() => {
    if (isDev) return;
    if (state.phase !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000);
    return () => clearInterval(id);
  }, [state.phase, isDev]);

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
    resetGame: useCallback(() => dispatch({ type: 'RESET_GAME' }), []),
    setFloor: useCallback((floor) => dispatch({ type: 'SET_FLOOR', floor }), []),
    loadExternalState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
