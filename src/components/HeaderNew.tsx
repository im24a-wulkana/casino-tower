import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/gameLogic';

interface HeaderProps {
  onSidebarToggle: () => void;
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const { user, username, logout } = useAuth();
  const { state } = useGame();
  const navigate = useNavigate();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    setShowAvatarMenu(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="sidebar-toggle"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
        >
          ≡
        </button>
        <Link to="/" className="logo">
          🎰 CASINO TOWER
        </Link>
      </div>

      <div className="header-center">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        {user ? (
          <>
            <div className="balance-chip">
              <span className="balance-icon">💰</span>
              <span className="balance-value">
                ${formatMoney(state.bank)}
              </span>
            </div>

            <button className="btn-add-chips">
              +
            </button>

            <div className="avatar-container">
              <button
                className="avatar-button"
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              >
                {username?.[0].toUpperCase() ?? 'U'}
              </button>

              {showAvatarMenu && (
                <div className="avatar-dropdown">
                  <div className="avatar-menu-item">{username}</div>
                  <hr className="avatar-menu-divider" />
                  <button
                    className="avatar-menu-item"
                    onClick={() => { setShowAvatarMenu(false); navigate('/stats'); }}
                  >
                    📊 My Stats
                  </button>
                  <button
                    className="avatar-menu-item"
                    onClick={() => { setShowAvatarMenu(false); navigate('/settings'); }}
                  >
                    ⚙️ Settings
                  </button>
                  <hr className="avatar-menu-divider" />
                  <button
                    className="avatar-menu-item avatar-logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-ghost">
              Log In
            </Link>
            <Link to="/register" className="btn-gold">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
