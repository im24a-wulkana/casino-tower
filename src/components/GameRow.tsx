import React from 'react';
import { Link } from 'react-router-dom';
import { GameCard } from './GameCard';

interface GameRowGame {
  id: string;
  name: string;
  icon: string;
  color: string;
  badge?: 'HOT' | 'NEW';
}

interface GameRowProps {
  title: string;
  icon: string;
  games: GameRowGame[];
  onSeeAll?: () => void;
}

export function GameRow({ title, icon, games, onSeeAll }: GameRowProps) {
  return (
    <section className="game-row">
      <div className="game-row-header">
        <h2 className="game-row-title">
          <span className="game-row-icon">{icon}</span>
          {title}
        </h2>
        {onSeeAll && (
          <button className="game-row-see-all" onClick={onSeeAll}>
            See All →
          </button>
        )}
      </div>

      <div className="game-row-scroll">
        {games.map(game => (
          <GameCard
            key={game.id}
            id={game.id}
            name={game.name}
            icon={game.icon}
            color={game.color}
            badge={game.badge}
          />
        ))}
      </div>
    </section>
  );
}
