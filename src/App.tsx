import React, { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './store/authStore';
import { GameProvider, useGame } from './store/gameStore';
import { AuthScreen } from './components/AuthScreen';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { GameGrid } from './components/GameGrid';
import { DayEndScreen } from './components/DayEndScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { VictoryScreen } from './components/VictoryScreen';

// Floor 1
import { Blackjack } from './games/Blackjack';
import { Roulette } from './games/Roulette';
import { Slots } from './games/Slots';
import { StreetCraps } from './games/StreetCraps';
import { WheelOfFortune } from './games/WheelOfFortune';
import { DuckRace } from './games/DuckRace';

// Floor 2
import { PenguinCross } from './games/PenguinCross';
import { Keno } from './games/Keno';
import { Crash } from './games/Crash';
import { HiLo } from './games/HiLo';
import { Plinko } from './games/Plinko';
import { MoneyWheel } from './games/MoneyWheel';

// Floor 3 + 4
import { DragonTower } from './games/DragonTower';
import { MineSweeper } from './games/MineSweeper';
import { Baccarat } from './games/Baccarat';
import { Poker } from './games/Poker';
import { CaseOpening } from './games/CaseOpening';
import { CaseBattle } from './games/CaseBattle';

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  blackjack:          Blackjack,
  roulette:           Roulette,
  slots:              Slots,
  'street-craps':     StreetCraps,
  'wheel-of-fortune': WheelOfFortune,
  'duck-race':        DuckRace,
  'penguin-cross':    PenguinCross,
  keno:               Keno,
  crash:              Crash,
  hilo:               HiLo,
  plinko:             Plinko,
  'money-wheel':      MoneyWheel,
  'dragon-tower':     DragonTower,
  'mine-sweeper':     MineSweeper,
  baccarat:           Baccarat,
  poker:              Poker,
  'case-opening':     CaseOpening,
  'case-battle':      CaseBattle,
};

function Casino() {
  const { state, isDev } = useGame();
  const { logout, username } = useAuth();
  const ActiveGame = state.activeGame ? GAME_COMPONENTS[state.activeGame] : null;

  return (
    <div className="app" data-floor={state.floor}>
      <TopBar onLogout={logout} username={username} isDev={isDev} />
      <div className="main-layout">
        <Sidebar />
        <main className="main-content">
          {ActiveGame ? <ActiveGame /> : <GameGrid />}
        </main>
      </div>
      {state.phase === 'day-end'   && <DayEndScreen />}
      {state.phase === 'game-over' && <GameOverScreen />}
      {state.phase === 'victory'   && <VictoryScreen />}
    </div>
  );
}

function AuthedApp() {
  const { username, isDev, saveGameState, loadGameState, onDBUpdate } = useAuth();
  const dbUpdateRef = useRef<((s: import('./types').GameState) => void) | null>(null);

  useEffect(() => {
    if (!username || isDev) return;
    const unsub = onDBUpdate((newState) => {
      dbUpdateRef.current?.(newState);
    });
    return unsub;
  }, [username, isDev, onDBUpdate]);

  if (!username) return <AuthScreen />;

  return (
    <GameProvider
      isDev={isDev}
      initialState={loadGameState()}
      onStateChange={saveGameState}
      onDBUpdateRef={dbUpdateRef}
    >
      <Casino />
    </GameProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}
