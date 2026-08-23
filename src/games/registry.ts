import { Plinko } from './Plinko';
import { DragonTower } from './DragonTower';
import { MineSweeper } from './MineSweeper';
import { MoneyWheel } from './MoneyWheel';
import { WheelOfFortune } from './WheelOfFortune';
import { DuckRace } from './DuckRace';
import { Blackjack } from './Blackjack';
import { Roulette } from './Roulette';
import { Slots } from './Slots';
import { StreetCraps } from './StreetCraps';
import { Baccarat } from './Baccarat';
import { Poker } from './Poker';
import { HiLo } from './HiLo';
import { Keno } from './Keno';
import { Crash } from './Crash';
import { PenguinCross } from './PenguinCross';
import { CaseOpening } from './CaseOpening';
import { CaseBattle } from './CaseBattle';

export const GAMES_REGISTRY: Record<
  string,
  {
    name: string;
    icon: string;
    color: string;
    category: 'arcade' | 'wheel' | 'card' | 'dice' | 'cases';
    badge?: 'HOT' | 'NEW';
    Component: React.ComponentType;
  }
> = {
  plinko: {
    name: 'Plinko',
    icon: '🔵',
    color: '#1a3a5c',
    category: 'arcade',
    badge: 'HOT',
    Component: Plinko,
  },
  'dragon-tower': {
    name: 'Dragon Tower',
    icon: '🐉',
    color: '#3a1a1a',
    category: 'arcade',
    badge: 'HOT',
    Component: DragonTower,
  },
  'mine-sweeper': {
    name: 'Minesweeper',
    icon: '💣',
    color: '#1a3a1a',
    category: 'arcade',
    Component: MineSweeper,
  },
  'money-wheel': {
    name: 'Money Wheel',
    icon: '🎡',
    color: '#3a2a1a',
    category: 'wheel',
    Component: MoneyWheel,
  },
  'wheel-of-fortune': {
    name: 'Wheel of Fortune',
    icon: '🎪',
    color: '#2a3a1a',
    category: 'wheel',
    Component: WheelOfFortune,
  },
  'duck-race': {
    name: 'Duck Race',
    icon: '🦆',
    color: '#1a2a3a',
    category: 'arcade',
    Component: DuckRace,
  },
  blackjack: {
    name: 'Blackjack',
    icon: '🃏',
    color: '#1a3a2a',
    category: 'card',
    Component: Blackjack,
  },
  roulette: {
    name: 'Roulette',
    icon: '🎰',
    color: '#2a1a3a',
    category: 'wheel',
    Component: Roulette,
  },
  slots: {
    name: 'Slots',
    icon: '🎯',
    color: '#3a3a1a',
    category: 'dice',
    Component: Slots,
  },
  'street-craps': {
    name: 'Street Craps',
    icon: '🎲',
    color: '#2a3a3a',
    category: 'dice',
    Component: StreetCraps,
  },
  baccarat: {
    name: 'Baccarat',
    icon: '♠️',
    color: '#1a1a3a',
    category: 'card',
    Component: Baccarat,
  },
  poker: {
    name: 'Video Poker',
    icon: '♥️',
    color: '#3a1a1a',
    category: 'card',
    Component: Poker,
  },
  hilo: {
    name: 'HiLo',
    icon: '📈',
    color: '#1a3a1a',
    category: 'card',
    Component: HiLo,
  },
  keno: {
    name: 'Keno',
    icon: '🎰',
    color: '#2a1a2a',
    category: 'dice',
    Component: Keno,
  },
  crash: {
    name: 'Crash',
    icon: '🚀',
    color: '#1a2a1a',
    category: 'arcade',
    Component: Crash,
  },
  'penguin-cross': {
    name: 'Penguin Cross',
    icon: '🐧',
    color: '#1a2a3a',
    category: 'arcade',
    Component: PenguinCross,
  },
  'case-opening': {
    name: 'Case Opening',
    icon: '📦',
    color: '#2a1a3a',
    category: 'cases',
    badge: 'NEW',
    Component: CaseOpening,
  },
  'case-battle': {
    name: 'Case Battle',
    icon: '⚔️',
    color: '#3a1a2a',
    category: 'cases',
    badge: 'NEW',
    Component: CaseBattle,
  },
};
