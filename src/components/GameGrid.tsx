import React from 'react';
import { useGame } from '../store/gameStore';
import { GAME_META } from '../utils/gameLogic';

const FLOOR_COLORS: Record<number, string> = {
  1: '#c9a84c',
  2: '#4caaff',
  3: '#b44cff',
  4: '#ff4c4c',
};

// All games are now implemented
const IMPLEMENTED = new Set([
  'blackjack','roulette','slots','street-craps','wheel-of-fortune','duck-race',
  'penguin-cross','keno','crash','hilo','plinko','money-wheel',
  'dragon-tower','mine-sweeper','baccarat','poker',
  'case-opening','case-battle',
]);

export function GameGrid() {
  const { state, setActiveGame } = useGame();

  return (
    <div className="game-grid-wrap">
      <div className="game-grid-header">
        <h2 className="game-grid-title">FLOOR {state.floor} — SELECT A GAME</h2>
        <p className="game-grid-sub">{state.availableGames.length} games available today</p>
      </div>
      <div className="game-grid">
        {state.availableGames.map((id) => {
          const meta = GAME_META[id];
          if (!meta) return null;
          const available = IMPLEMENTED.has(id);
          const accent = FLOOR_COLORS[meta.floor] ?? '#c9a84c';

          return (
            <button
              key={id}
              className={`game-card ${available ? 'game-card-available' : 'game-card-locked'}`}
              style={{ '--accent': accent } as React.CSSProperties}
              onClick={() => available && setActiveGame(id)}
              disabled={!available}
            >
              <div className="game-card-floor">FLOOR {meta.floor}</div>
              <div className="game-card-name">{meta.name}</div>
              <div className="game-card-desc">{meta.description}</div>
              {available
                ? <div className="game-card-play">PLAY →</div>
                : <div className="game-card-soon">COMING SOON</div>}
              <div className="game-card-glow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
