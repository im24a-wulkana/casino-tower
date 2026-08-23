import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BannerSlide {
  gameId: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  cta: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    gameId: 'dragon-tower',
    title: 'Dragon Tower',
    subtitle: 'Climb floors, avoid bombs, cash out for huge multipliers',
    icon: '🐉',
    color: '#3a1a1a',
    cta: 'PLAY NOW →',
  },
  {
    gameId: 'plinko',
    title: 'Plinko',
    subtitle: 'Drop the ball, watch it bounce through pegs for big multipliers',
    icon: '🔵',
    color: '#1a3a5c',
    cta: 'DROP NOW →',
  },
  {
    gameId: 'case-battle',
    title: 'Case Battles',
    subtitle: 'Open cases against other players and win big',
    icon: '⚔️',
    color: '#3a1a2a',
    cta: 'BATTLE →',
  },
];

export function FeaturedBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const slide = BANNER_SLIDES[currentSlide];

  return (
    <div
      className="featured-banner"
      style={{
        background: `linear-gradient(135deg, ${slide.color}40 0%, ${slide.color}10 100%)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="banner-content">
        <div className="banner-text">
          <div className="banner-icon">{slide.icon}</div>
          <h2 className="banner-title">{slide.title}</h2>
          <p className="banner-subtitle">{slide.subtitle}</p>
          <Link to={`/play/${slide.gameId}`} className="banner-cta">
            {slide.cta}
          </Link>
        </div>
      </div>

      <div className="banner-dots">
        {BANNER_SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={`banner-dot ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
