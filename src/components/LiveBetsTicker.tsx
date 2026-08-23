import React, { useEffect, useState } from 'react';
import { GAMES_REGISTRY } from '../games/registry';

interface Win {
  id: string;
  username: string;
  game: string;
  amount: number;
  timestamp: number;
}

export function LiveBetsTicker() {
  const [wins, setWins] = useState<Win[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Simulate live wins - in production, this would subscribe to Supabase Realtime
  useEffect(() => {
    const interval = setInterval(() => {
      const gameIds = Object.keys(GAMES_REGISTRY);
      const randomGame = gameIds[Math.floor(Math.random() * gameIds.length)];
      const game = GAMES_REGISTRY[randomGame];
      const amount = Math.floor(Math.random() * 5000) + 50;

      const newWin: Win = {
        id: Math.random().toString(36),
        username: `Player${Math.floor(Math.random() * 9000) + 1000}`,
        game: game.name,
        amount,
        timestamp: Date.now(),
      };

      setWins(prev => [newWin, ...prev].slice(0, 20));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Duplicate wins for seamless scrolling
  const displayWins = [...wins, ...wins];

  return (
    <div className="live-ticker" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className={`ticker-track ${isPaused ? 'paused' : ''}`}>
        {displayWins.map((win, idx) => {
          const gameKey = Object.keys(GAMES_REGISTRY).find(k => GAMES_REGISTRY[k].name === win.game);
          const icon = gameKey ? GAMES_REGISTRY[gameKey].icon : '🎰';
          return (
          <div key={`${win.id}-${idx}`} className="ticker-item">
            <span className="ticker-icon">
              {icon}
            </span>
            <span className="ticker-text">
              {win.username} won ${win.amount.toLocaleString()} on {win.game}
            </span>
            <span className="ticker-separator">·</span>
          </div>
        );
        })}
      </div>
    </div>
  );
}
