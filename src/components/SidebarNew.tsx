import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../store/gameStore';

interface SidebarProps {
  isOpen: boolean;
}

const NAV_ITEMS = [
  { label: 'Lobby', icon: '🏠', path: '/play' },
  { label: 'Originals', icon: '⭐', path: '/play?cat=originals' },
  { label: 'Arcade', icon: '🎮', path: '/play?cat=arcade' },
  { label: 'Table Games', icon: '🃏', path: '/play?cat=table' },
];

const BOTTOM_NAV = [
  { label: 'Leaderboard', icon: '🏆', path: '/leaderboard' },
  { label: 'My Stats', icon: '📊', path: '/stats' },
  { label: 'Settings', icon: '⚙️', path: '/settings' },
  { label: 'Help', icon: '❓', path: '/help' },
];

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const [recentGames, setRecentGames] = useState<Array<{ id: string; name: string; icon: string }>>([]);

  // Load recent games from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_games');
    if (saved) {
      try {
        setRecentGames(JSON.parse(saved).slice(0, 3));
      } catch (e) {
        console.error('Failed to load recent games:', e);
      }
    }
  }, []);

  const isActive = (path: string) => {
    if (path.includes('?')) {
      const basePath = path.split('?')[0];
      return location.pathname === basePath;
    }
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {recentGames.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-header">Recent</div>
            {recentGames.map((game) => (
              <Link
                key={game.id}
                to={`/play/${game.id}`}
                className="sidebar-recent-game"
                title={game.name}
              >
                <span className="game-icon-small">{game.icon}</span>
                <span className="sidebar-label">{game.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <nav className="sidebar-bottom">
        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            title={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
