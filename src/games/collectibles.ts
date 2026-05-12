import { Collectible } from '../types';

export interface CollectibleDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Collectible['rarity'];
  weight: number;
  machineIds: string[]; // which machines can drop this
}

// ─── Collectible Pool ───────────────────────────────────────────────────────
// Three machine tiers: basic, premium, elite
// Each has different rarity distributions

export const COLLECTIBLE_POOL: CollectibleDef[] = [
  // ── BASIC machine drops (common-heavy) ───────────────────────────────────
  { id: 'lucky_chip',      name: 'Lucky Chip',       emoji: '🪙', rarity: 'common',    weight: 25, machineIds: ['basic', 'premium', 'elite'] },
  { id: 'card_ace',        name: 'Ace of Spades',    emoji: '🂡', rarity: 'common',    weight: 22, machineIds: ['basic', 'premium'] },
  { id: 'dice_pair',       name: 'Snake Eyes',       emoji: '🎲', rarity: 'common',    weight: 20, machineIds: ['basic', 'premium'] },
  { id: 'cocktail',        name: 'Casino Cocktail',  emoji: '🍸', rarity: 'common',    weight: 18, machineIds: ['basic'] },
  { id: 'bouncer',         name: 'Bouncer Badge',    emoji: '🪪', rarity: 'common',    weight: 15, machineIds: ['basic'] },
  { id: 'neon_light',      name: 'Neon Light',       emoji: '💡', rarity: 'common',    weight: 14, machineIds: ['basic'] },
  { id: 'poker_chip_red',  name: 'Red Chip',         emoji: '🔴', rarity: 'common',    weight: 12, machineIds: ['basic', 'premium'] },

  // ── BASIC rare / PREMIUM common ──────────────────────────────────────────
  { id: 'gold_ring',       name: 'Gold Ring',        emoji: '💍', rarity: 'rare',      weight: 14, machineIds: ['basic', 'premium', 'elite'] },
  { id: 'neon_sign',       name: 'Neon Sign',        emoji: '🪩', rarity: 'rare',      weight: 12, machineIds: ['basic', 'premium'] },
  { id: 'bronze_trophy',   name: 'Bronze Trophy',    emoji: '🏅', rarity: 'rare',      weight: 10, machineIds: ['basic', 'premium'] },
  { id: 'casino_card_set', name: 'Card Set',         emoji: '🃏', rarity: 'rare',      weight: 9,  machineIds: ['basic', 'premium'] },
  { id: 'money_clip',      name: 'Money Clip',       emoji: '💵', rarity: 'rare',      weight: 8,  machineIds: ['premium'] },
  { id: 'top_hat',         name: 'Top Hat',          emoji: '🎩', rarity: 'rare',      weight: 7,  machineIds: ['basic', 'premium'] },
  { id: 'magic_8ball',     name: 'Magic 8-Ball',     emoji: '🎱', rarity: 'rare',      weight: 6,  machineIds: ['premium'] },

  // ── PREMIUM epic / ELITE rare ────────────────────────────────────────────
  { id: 'diamond',         name: 'Diamond',          emoji: '💎', rarity: 'epic',      weight: 8,  machineIds: ['basic', 'premium', 'elite'] },
  { id: 'crown',           name: 'Crown',            emoji: '👑', rarity: 'epic',      weight: 6,  machineIds: ['premium', 'elite'] },
  { id: 'sports_car',      name: 'Sports Car',       emoji: '🏎️', rarity: 'epic',      weight: 5,  machineIds: ['premium', 'elite'] },
  { id: 'golden_gun',      name: 'Golden Gun',       emoji: '🔫', rarity: 'epic',      weight: 4,  machineIds: ['premium', 'elite'] },
  { id: 'yacht',           name: 'Yacht',            emoji: '🛥️', rarity: 'epic',      weight: 3,  machineIds: ['premium', 'elite'] },
  { id: 'private_jet',     name: 'Private Jet',      emoji: '✈️', rarity: 'epic',      weight: 3,  machineIds: ['elite'] },
  { id: 'penthouse_key',   name: 'Penthouse Key',    emoji: '🗝️', rarity: 'epic',      weight: 2,  machineIds: ['elite'] },

  // ── ELITE legendary ──────────────────────────────────────────────────────
  { id: 'casino_tower',    name: 'Casino Tower',     emoji: '🏙️', rarity: 'legendary', weight: 5,  machineIds: ['premium', 'elite'] },
  { id: 'black_diamond',   name: 'Black Diamond',    emoji: '🖤', rarity: 'legendary', weight: 3,  machineIds: ['elite'] },
  { id: 'golden_skull',    name: 'Golden Skull',     emoji: '💀', rarity: 'legendary', weight: 2,  machineIds: ['elite'] },
  { id: 'moon_rock',       name: 'Moon Rock',        emoji: '🌑', rarity: 'legendary', weight: 2,  machineIds: ['elite'] },
  { id: 'omega_chip',      name: 'OMEGA Chip',       emoji: '🔴', rarity: 'legendary', weight: 1,  machineIds: ['elite'] },
  { id: 'god_token',       name: 'God Token',        emoji: '⚡', rarity: 'legendary', weight: 1,  machineIds: ['elite'] },
];

// ─── Machine Definitions ────────────────────────────────────────────────────

export interface MachineDef {
  id: string;
  name: string;
  emoji: string;
  ticketCost: number;       // tickets per pull
  ticketBuyCost: number;    // $ to buy 1 ticket for this machine
  color: string;
  description: string;
}

export const MACHINES: MachineDef[] = [
  {
    id: 'basic',
    name: 'STREET VENDOR',
    emoji: '🎪',
    ticketCost: 1,
    ticketBuyCost: 1_000_000_000,          // $1B
    color: '#2dc653',
    description: 'Common & rare drops. Cheap tickets.',
  },
  {
    id: 'premium',
    name: 'HIGH ROLLER',
    emoji: '🎰',
    ticketCost: 1,
    ticketBuyCost: 100_000_000_000,        // $100B
    color: '#4caaff',
    description: 'Rare, epic & some legendary drops.',
  },
  {
    id: 'elite',
    name: 'THE VAULT',
    emoji: '🔒',
    ticketCost: 1,
    ticketBuyCost: 100_000_000_000_000,    // $100T
    color: '#c9a84c',
    description: 'Epic & legendary only. Ultimate rarities.',
  },
];

// ─── Rarity display ─────────────────────────────────────────────────────────

const RARITY_COLORS: Record<Collectible['rarity'], string> = {
  common:    '#888',
  rare:      '#4caaff',
  epic:      '#b44cff',
  legendary: '#c9a84c',
};

export function rarityColor(r: Collectible['rarity']): string {
  return RARITY_COLORS[r];
}

export const RARITY_ORDER: Record<Collectible['rarity'], number> = {
  common: 0, rare: 1, epic: 2, legendary: 3,
};

// ─── Roll logic ─────────────────────────────────────────────────────────────

export function rollFromMachine(machineId: string): CollectibleDef {
  const pool = COLLECTIBLE_POOL.filter(c => c.machineIds.includes(machineId));
  const total = pool.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= c.weight;
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}

// Spin preview: generate a reel of N random items for the animation
export function buildSpinReel(machineId: string, winner: CollectibleDef, reelSize = 40): CollectibleDef[] {
  const pool = COLLECTIBLE_POOL.filter(c => c.machineIds.includes(machineId));
  const stopIdx = Math.floor(reelSize * 0.65) + Math.floor(Math.random() * 8);
  return Array.from({ length: reelSize }, (_, i) =>
    i === stopIdx ? winner : pool[Math.floor(Math.random() * pool.length)]
  );
}

export function getStopIdx(reelSize = 40): number {
  return Math.floor(reelSize * 0.65) + Math.floor(Math.random() * 8);
}

// For backward compat (sidebar previously used this)
export { rollFromMachine as rollCollectible };
