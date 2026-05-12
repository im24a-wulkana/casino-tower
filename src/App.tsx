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
import { PauseScreen } from './components/PauseScreen';

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
import { TicketShop } from './games/TicketShop';

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
  'ticket-shop':      TicketShop,
};

function Casino() {
  const { state, isDev, pause, setActiveGame } = useGame();
  const { logout, username } = useAuth();

  // Get game from URL or state
  const urlPath = window.location.pathname;
  const gameIdFromUrl = urlPath.split('/').pop();
  const isValidGameUrl = gameIdFromUrl && gameIdFromUrl !== '' && Object.keys(GAME_COMPONENTS).includes(gameIdFromUrl);
  const activeGameId = isValidGameUrl ? gameIdFromUrl : state.activeGame;
  const ActiveGame = activeGameId ? GAME_COMPONENTS[activeGameId] : null;

  // Sync URL with state when activeGame changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    const expectedPath = state.activeGame ? `/${state.activeGame}` : '/';
    if (currentPath !== expectedPath) {
      window.history.replaceState(null, '', expectedPath);
    }
  }, [state.activeGame]);

  // When setting active game from grid, update URL
  const handleSetActiveGame = (gameId: string) => {
    setActiveGame(gameId);
  };

  return (
    <div className="app" data-floor={state.floor}>
      <TopBar onLogout={logout} username={username} isDev={isDev} onPause={state.phase === 'playing' ? pause : undefined} />
      <div className="main-layout">
        <Sidebar />
        <main className="main-content">
          {ActiveGame ? <ActiveGame /> : <GameGrid onSelectGame={handleSetActiveGame} />}
        </main>
      </div>
      {state.phase === 'paused'    && <PauseScreen />}
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
