export interface CaseItem {
  emoji: string;
  name: string;
  value: number;
  weight: number; // higher = more common
}

export interface CaseDef {
  id: string;
  name: string;
  price: number;
  emoji: string;
  color: string;
  items: CaseItem[];
}

function w(items: CaseItem[]): CaseItem[] {
  return items;
}

export const CASES: CaseDef[] = [
  {
    id: 'street',
    name: 'STREET CASE',
    price: 10_000,
    emoji: '📦',
    color: '#888',
    items: w([
      { emoji: '🧢', name: 'Cap',          value: 500,    weight: 40 },
      { emoji: '👟', name: 'Sneakers',     value: 1_500,  weight: 30 },
      { emoji: '🕶️', name: 'Shades',       value: 3_000,  weight: 18 },
      { emoji: '🎒', name: 'Bag',          value: 6_000,  weight: 8  },
      { emoji: '💎', name: 'Diamond Ring', value: 15_000, weight: 3  },
      { emoji: '🏆', name: 'Trophy',       value: 40_000, weight: 26 },
    ]),
  },
  {
    id: 'tech',
    name: 'TECH CASE',
    price: 20_000,
    emoji: '💻',
    color: '#4caaff',
    items: w([
      { emoji: '🖱️', name: 'Mouse',        value: 1_000,  weight: 35 },
      { emoji: '⌨️', name: 'Keyboard',     value: 3_000,  weight: 28 },
      { emoji: '🎧', name: 'Headset',      value: 7_000,  weight: 20 },
      { emoji: '📱', name: 'Smartphone',   value: 15_000, weight: 10 },
      { emoji: '💻', name: 'Laptop',       value: 35_000, weight: 5  },
      { emoji: '🖥️', name: 'Pro Monitor',  value: 80_000, weight: 23 },
    ]),
  },
  {
    id: 'wheels',
    name: 'WHEELS CASE',
    price: 35_000,
    emoji: '🚗',
    color: '#2dc653',
    items: w([
      { emoji: '🛴', name: 'Scooter',      value: 2_000,  weight: 35 },
      { emoji: '🏍️', name: 'Motorbike',    value: 8_000,  weight: 25 },
      { emoji: '🚗', name: 'Hatchback',    value: 20_000, weight: 20 },
      { emoji: '🚙', name: 'SUV',          value: 50_000, weight: 12 },
      { emoji: '🏎️', name: 'Sports Car',   value: 120_000,weight: 6  },
      { emoji: '🚀', name: 'Rocket Car',   value: 300_000,weight: 5  },
    ]),
  },
  {
    id: 'bling',
    name: 'BLING CASE',
    price: 50_000,
    emoji: '💍',
    color: '#c9a84c',
    items: w([
      { emoji: '🔗', name: 'Chain',        value: 3_000,  weight: 35 },
      { emoji: '💍', name: 'Ring',         value: 10_000, weight: 25 },
      { emoji: '⌚', name: 'Watch',        value: 25_000, weight: 20 },
      { emoji: '📿', name: 'Necklace',     value: 60_000, weight: 12 },
      { emoji: '👑', name: 'Crown',        value: 150_000,weight: 6  },
      { emoji: '🌟', name: 'Star Diamond', value: 400_000,weight: 7  },
    ]),
  },
  {
    id: 'penthouse',
    name: 'PENTHOUSE CASE',
    price: 75_000,
    emoji: '🏙️',
    color: '#b44cff',
    items: w([
      { emoji: '🛋️', name: 'Couch',        value: 5_000,  weight: 32 },
      { emoji: '🍾', name: 'Champagne',    value: 15_000, weight: 25 },
      { emoji: '🎨', name: 'Art Piece',    value: 40_000, weight: 20 },
      { emoji: '🏊', name: 'Pool',         value: 90_000, weight: 13 },
      { emoji: '🏙️', name: 'Penthouse',    value: 220_000,weight: 7  },
      { emoji: '🌆', name: 'Skyline View', value: 550_000,weight: 7  },
    ]),
  },
  {
    id: 'crypto',
    name: 'CRYPTO CASE',
    price: 100_000,
    emoji: '₿',
    color: '#ff9900',
    items: w([
      { emoji: '🪙', name: 'Altcoin',      value: 5_000,  weight: 32 },
      { emoji: '💰', name: 'ETH',          value: 18_000, weight: 24 },
      { emoji: '₿',  name: 'BTC Frag',     value: 50_000, weight: 18 },
      { emoji: '📈', name: 'Moon Call',    value: 110_000,weight: 14 },
      { emoji: '🏦', name: 'Vault',        value: 280_000,weight: 8  },
      { emoji: '💎', name: 'Diamond Hand', value: 700_000,weight: 7  },
    ]),
  },
  {
    id: 'war',
    name: 'WAR CHEST',
    price: 150_000,
    emoji: '⚔️',
    color: '#e63946',
    items: w([
      { emoji: '🛡️', name: 'Shield',       value: 8_000,  weight: 30 },
      { emoji: '⚔️', name: 'Sword',        value: 25_000, weight: 23 },
      { emoji: '🏹', name: 'Crossbow',     value: 60_000, weight: 18 },
      { emoji: '🔱', name: 'Trident',      value: 140_000,weight: 14 },
      { emoji: '💣', name: 'Nuke',         value: 350_000,weight: 10 },
      { emoji: '☢️', name: 'Warhead',      value: 900_000,weight: 9  },
    ]),
  },
  {
    id: 'space',
    name: 'SPACE CASE',
    price: 200_000,
    emoji: '🚀',
    color: '#00d4ff',
    items: w([
      { emoji: '🌙', name: 'Moon Rock',    value: 10_000, weight: 30 },
      { emoji: '🛸', name: 'UFO',          value: 35_000, weight: 22 },
      { emoji: '🌍', name: 'Globe',        value: 80_000, weight: 18 },
      { emoji: '🪐', name: 'Planet',       value: 180_000,weight: 14 },
      { emoji: '⭐', name: 'Star',         value: 450_000,weight: 11 },
      { emoji: '🌌', name: 'Galaxy',       value: 1_100_000,weight: 10 },
    ]),
  },
  {
    id: 'god',
    name: 'GOD CASE',
    price: 300_000,
    emoji: '⚡',
    color: '#ffe066',
    items: w([
      { emoji: '🌩️', name: 'Thunderbolt',  value: 15_000, weight: 28 },
      { emoji: '🔥', name: 'Hellfire',     value: 50_000, weight: 22 },
      { emoji: '🌊', name: 'Tsunami',      value: 120_000,weight: 18 },
      { emoji: '⚡', name: 'Lightning',    value: 280_000,weight: 14 },
      { emoji: '🌞', name: 'Sun',          value: 650_000,weight: 12 },
      { emoji: '✨', name: 'Divine Light', value: 1_500_000,weight: 11 },
    ]),
  },
  {
    id: 'omega',
    name: 'OMEGA CASE',
    price: 550_000,
    emoji: '🔴',
    color: '#ff4c4c',
    items: w([
      { emoji: '💀', name: 'Skull',        value: 20_000, weight: 25 },
      { emoji: '🖤', name: 'Black Heart',  value: 80_000, weight: 20 },
      { emoji: '🃏', name: 'Joker',        value: 200_000,weight: 18 },
      { emoji: '🔮', name: 'Crystal Ball', value: 500_000,weight: 15 },
      { emoji: '🌑', name: 'Black Moon',   value: 1_200_000,weight: 13 },
      { emoji: '🔴', name: 'THE OMEGA',    value: 2_200_000,weight: 13 },
    ]),
  },
];

export function rollItem(caseDef: CaseDef): CaseItem {
  const total = caseDef.items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of caseDef.items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return caseDef.items[caseDef.items.length - 1];
}

export function oddsPercent(item: CaseItem, caseDef: CaseDef): number {
  const total = caseDef.items.reduce((s, i) => s + i.weight, 0);
  return (item.weight / total) * 100;
}

export function formatVal(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}
