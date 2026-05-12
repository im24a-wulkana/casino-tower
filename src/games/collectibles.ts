import { Collectible } from '../types';

export interface CollectibleDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Collectible['rarity'];
  weight: number;
}

export const COLLECTIBLE_POOL: CollectibleDef[] = [
  // Common (60%)
  { id: 'lucky_chip',    name: 'Lucky Chip',     emoji: '🪙', rarity: 'common',    weight: 20 },
  { id: 'card_ace',      name: 'Ace of Spades',  emoji: '🂡', rarity: 'common',    weight: 18 },
  { id: 'dice_pair',     name: 'Snake Eyes',     emoji: '🎲', rarity: 'common',    weight: 15 },
  { id: 'cocktail',      name: 'Casino Cocktail',emoji: '🍸', rarity: 'common',    weight: 12 },
  // Rare (25%)
  { id: 'gold_ring',     name: 'Gold Ring',      emoji: '💍', rarity: 'rare',      weight: 10 },
  { id: 'neon_sign',     name: 'Neon Sign',      emoji: '🪩', rarity: 'rare',      weight: 8  },
  { id: 'trophy_small',  name: 'Bronze Trophy',  emoji: '🏅', rarity: 'rare',      weight: 7  },
  // Epic (12%)
  { id: 'diamond',       name: 'Diamond',        emoji: '💎', rarity: 'epic',      weight: 5  },
  { id: 'crown',         name: 'Crown',          emoji: '👑', rarity: 'epic',      weight: 4  },
  { id: 'sports_car',    name: 'Sports Car',     emoji: '🏎️', rarity: 'epic',      weight: 3  },
  // Legendary (3%)
  { id: 'casino_tower',  name: 'Casino Tower',   emoji: '🏙️', rarity: 'legendary', weight: 2  },
  { id: 'money_bag',     name: 'Money Bag',      emoji: '💰', rarity: 'legendary', weight: 1  },
];

const RARITY_COLORS: Record<Collectible['rarity'], string> = {
  common:    '#888',
  rare:      '#4caaff',
  epic:      '#b44cff',
  legendary: '#c9a84c',
};

export function rarityColor(r: Collectible['rarity']): string {
  return RARITY_COLORS[r];
}

export function rollCollectible(): CollectibleDef {
  const total = COLLECTIBLE_POOL.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of COLLECTIBLE_POOL) {
    r -= c.weight;
    if (r <= 0) return c;
  }
  return COLLECTIBLE_POOL[COLLECTIBLE_POOL.length - 1];
}

export const TICKET_COST = 1_000_000_000; // $1B per ticket
