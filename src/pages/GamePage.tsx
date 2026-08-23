import React, { useEffect } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { GameProvider } from '../store/gameStore';
import { GAMES_REGISTRY } from '../games/registry';

function GamePageContent() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? GAMES_REGISTRY[gameId] : null;
  const location = useLocation();

  useEffect(() => {
    if (game) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Add to recent games
      const recent = JSON.parse(localStorage.getItem('recent_games') || '[]');
      const filtered = recent.filter((g: any) => g.id !== gameId);
      const updated = [{ id: gameId, name: game.name, icon: game.icon }, ...filtered].slice(0, 5);
      localStorage.setItem('recent_games', JSON.stringify(updated));
    }
  }, [gameId, game]);

  if (!game) {
    return <Navigate to="/play" replace />;
  }

  const isSurvivalMode = location.pathname.startsWith('/survival');

  return (
    <div className="game-page">
      <div className="game-page-breadcrumb">
        <Link to={isSurvivalMode ? '/survival' : '/play'} className="breadcrumb-link">← Lobby</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{game.name}</span>
      </div>

      <div className="game-page-container">
        <div className="game-main">
          <game.Component />
        </div>
      </div>
    </div>
  );
}

export function GamePage() {
  const location = useLocation();
  const isSurvivalMode = location.pathname.startsWith('/survival');

  return (
    <GameProvider isDev={false} initialState={{
      bank: isSurvivalMode ? 500 : 1000,
      activeGame: null,
      mode: isSurvivalMode ? 'survival' : 'free-play',
      cursedUsers: {}
    }}>
      <GamePageContent />
    </GameProvider>
  );
}
