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
  risk: 'low' | 'medium' | 'high';
  items: CaseItem[];
}

function w(items: CaseItem[]): CaseItem[] {
  return items;
}

export const CASES: CaseDef[] = [
  {
    id: 'starter',
    name: 'STARTER CASE',
    price: 5_000,
    emoji: '🎁',
    color: '#aaa',
    risk: 'low',
    items: w([
      { emoji: '📝', name: 'Notepad',      value: 300,    weight: 45 },
      { emoji: '✏️', name: 'Pencil Set',   value: 800,    weight: 35 },
      { emoji: '📚', name: 'Book',         value: 1_500,  weight: 18 },
      { emoji: '🎓', name: 'Diploma',      value: 3_000,  weight: 2  },
    ]),
  },
  {
    id: 'street',
    name: 'STREET CASE',
    price: 10_000,
    emoji: '📦',
    color: '#888',
    risk: 'low',
    items: w([
      { emoji: '🧢', name: 'Cap',          value: 600,    weight: 40 },
      { emoji: '👟', name: 'Sneakers',     value: 1_600,  weight: 32 },
      { emoji: '🕶️', name: 'Shades',       value: 3_200,  weight: 20 },
      { emoji: '🎒', name: 'Bag',          value: 6_200,  weight: 8  },
    ]),
  },
  {
    id: 'tech',
    name: 'TECH CASE',
    price: 20_000,
    emoji: '💻',
    color: '#4caaff',
    risk: 'low',
    items: w([
      { emoji: '🖱️', name: 'Mouse',        value: 1_200,  weight: 35 },
      { emoji: '⌨️', name: 'Keyboard',     value: 3_600,  weight: 30 },
      { emoji: '🎧', name: 'Headset',      value: 7_800,  weight: 22 },
      { emoji: '📱', name: 'Smartphone',   value: 16_800, weight: 13 },
    ]),
  },
  {
    id: 'wheels',
    name: 'WHEELS CASE',
    price: 35_000,
    emoji: '🚗',
    color: '#2dc653',
    risk: 'medium',
    items: w([
      { emoji: '🛴', name: 'Scooter',      value: 2_200,  weight: 32 },
      { emoji: '🏍️', name: 'Motorbike',    value: 8_800,  weight: 28 },
      { emoji: '🚗', name: 'Hatchback',    value: 22_000, weight: 24 },
      { emoji: '🚙', name: 'SUV',          value: 52_000, weight: 14 },
      { emoji: '🏎️', name: 'Sports Car',   value: 140_000,weight: 2  },
    ]),
  },
  {
    id: 'bling',
    name: 'BLING CASE',
    price: 50_000,
    emoji: '💍',
    color: '#c9a84c',
    risk: 'medium',
    items: w([
      { emoji: '🔗', name: 'Chain',        value: 3_400,  weight: 32 },
      { emoji: '💍', name: 'Ring',         value: 11_000, weight: 28 },
      { emoji: '⌚', name: 'Watch',        value: 27_000, weight: 24 },
      { emoji: '📿', name: 'Necklace',     value: 64_000, weight: 14 },
      { emoji: '👑', name: 'Crown',        value: 170_000,weight: 2  },
    ]),
  },
  {
    id: 'penthouse',
    name: 'PENTHOUSE CASE',
    price: 75_000,
    emoji: '🏙️',
    color: '#b44cff',
    risk: 'medium',
    items: w([
      { emoji: '🛋️', name: 'Couch',        value: 5_600,  weight: 30 },
      { emoji: '🍾', name: 'Champagne',    value: 16_500, weight: 26 },
      { emoji: '🎨', name: 'Art Piece',    value: 42_000, weight: 22 },
      { emoji: '🏊', name: 'Pool',         value: 95_000, weight: 16 },
      { emoji: '🏙️', name: 'Penthouse',    value: 240_000,weight: 6  },
    ]),
  },
  {
    id: 'crypto',
    name: 'CRYPTO CASE',
    price: 100_000,
    emoji: '₿',
    color: '#ff9900',
    risk: 'medium',
    items: w([
      { emoji: '🪙', name: 'Altcoin',      value: 5_600,  weight: 30 },
      { emoji: '💰', name: 'ETH',          value: 19_200, weight: 26 },
      { emoji: '₿',  name: 'BTC Frag',     value: 52_000, weight: 22 },
      { emoji: '📈', name: 'Moon Call',    value: 112_000,weight: 16 },
      { emoji: '🏦', name: 'Vault',        value: 300_000,weight: 6  },
    ]),
  },
  {
    id: 'potion',
    name: 'POTION CASE',
    price: 120_000,
    emoji: '🧪',
    color: '#00e5b0',
    risk: 'medium',
    items: w([
      { emoji: '🧪', name: 'Health Potion', value: 6_000,  weight: 30 },
      { emoji: '💜', name: 'Mana Potion',  value: 18_000, weight: 26 },
      { emoji: '🌟', name: 'Star Vial',    value: 48_000, weight: 22 },
      { emoji: '⚡', name: 'Power Elixir',  value: 115_000,weight: 16 },
      { emoji: '👑', name: 'Divine Brew',  value: 360_000,weight: 6  },
    ]),
  },
  {
    id: 'war',
    name: 'WAR CHEST',
    price: 150_000,
    emoji: '⚔️',
    color: '#e63946',
    risk: 'medium',
    items: w([
      { emoji: '🛡️', name: 'Shield',       value: 8_800,  weight: 28 },
      { emoji: '⚔️', name: 'Sword',        value: 26_500, weight: 24 },
      { emoji: '🏹', name: 'Crossbow',     value: 63_000, weight: 20 },
      { emoji: '🔱', name: 'Trident',      value: 150_000,weight: 18 },
      { emoji: '💣', name: 'Nuke',         value: 420_000,weight: 10 },
    ]),
  },
  {
    id: 'space',
    name: 'SPACE CASE',
    price: 200_000,
    emoji: '🚀',
    color: '#00d4ff',
    risk: 'high',
    items: w([
      { emoji: '🌙', name: 'Moon Rock',    value: 8_000,  weight: 28 },
      { emoji: '🛸', name: 'UFO',          value: 32_000, weight: 24 },
      { emoji: '🌍', name: 'Globe',        value: 75_000, weight: 20 },
      { emoji: '🪐', name: 'Planet',       value: 170_000,weight: 18 },
      { emoji: '⭐', name: 'Star',         value: 520_000,weight: 10 },
    ]),
  },
  {
    id: 'myth',
    name: 'MYTH CASE',
    price: 250_000,
    emoji: '🐉',
    color: '#ff6b6b',
    risk: 'high',
    items: w([
      { emoji: '🦁', name: 'Lion',         value: 10_000, weight: 26 },
      { emoji: '🐉', name: 'Dragon',       value: 40_000, weight: 24 },
      { emoji: '🦄', name: 'Unicorn',      value: 95_000, weight: 22 },
      { emoji: '👿', name: 'Demon',        value: 215_000,weight: 18 },
      { emoji: '🌠', name: 'Celestial',    value: 650_000,weight: 10 },
    ]),
  },
  {
    id: 'god',
    name: 'GOD CASE',
    price: 300_000,
    emoji: '⚡',
    color: '#ffe066',
    risk: 'high',
    items: w([
      { emoji: '🌩️', name: 'Thunderbolt',  value: 12_000, weight: 26 },
      { emoji: '🔥', name: 'Hellfire',     value: 45_000, weight: 24 },
      { emoji: '🌊', name: 'Tsunami',      value: 105_000,weight: 22 },
      { emoji: '⚡', name: 'Lightning',    value: 240_000,weight: 18 },
      { emoji: '🌞', name: 'Sun',          value: 750_000,weight: 10 },
    ]),
  },
  {
    id: 'ocean',
    name: 'OCEAN CASE',
    price: 400_000,
    emoji: '🌊',
    color: '#0099ff',
    risk: 'high',
    items: w([
      { emoji: '🦀', name: 'Crab',         value: 15_000, weight: 24 },
      { emoji: '🐙', name: 'Octopus',      value: 50_000, weight: 22 },
      { emoji: '🦈', name: 'Great White',  value: 120_000,weight: 20 },
      { emoji: '🐳', name: 'Whale',        value: 280_000,weight: 18 },
      { emoji: '🌊', name: 'Poseidon',     value: 950_000,weight: 16 },
    ]),
  },
  {
    id: 'omega',
    name: 'OMEGA CASE',
    price: 550_000,
    emoji: '🔴',
    color: '#ff4c4c',
    risk: 'high',
    items: w([
      { emoji: '💀', name: 'Skull',        value: 18_000, weight: 24 },
      { emoji: '🖤', name: 'Black Heart',  value: 72_000, weight: 22 },
      { emoji: '🃏', name: 'Joker',        value: 180_000,weight: 20 },
      { emoji: '🔮', name: 'Crystal Ball', value: 450_000,weight: 18 },
      { emoji: '🌑', name: 'Black Moon',   value: 1_500_000,weight: 16 },
    ]),
  },
  {
    id: 'vault',
    name: 'VAULT CASE',
    price: 1_000_000,
    emoji: '🔐',
    color: '#ffd700',
    risk: 'high',
    items: w([
      { emoji: '💰', name: 'Gold Bar',     value: 35_000, weight: 24 },
      { emoji: '💎', name: 'Diamond',      value: 125_000,weight: 22 },
      { emoji: '👑', name: 'Crown',        value: 300_000,weight: 20 },
      { emoji: '🏆', name: 'Trophy',       value: 750_000,weight: 18 },
      { emoji: '🔐', name: 'Treasure',     value: 2_500_000,weight: 16 },
    ]),
  },
  {
    id: 'degen',
    name: 'DEGEN CASE',
    price: 2_000_000,
    emoji: '🎲',
    color: '#ff00ff',
    risk: 'high',
    items: w([
      { emoji: '🎲', name: 'Lucky Dice',   value: 50_000, weight: 22 },
      { emoji: '🃏', name: 'Wild Card',    value: 200_000,weight: 20 },
      { emoji: '🎰', name: 'Jackpot',      value: 500_000,weight: 18 },
      { emoji: '💥', name: 'Explosion',    value: 1_200_000,weight: 20 },
      { emoji: '🌟', name: 'Legendary',    value: 4_500_000,weight: 20 },
    ]),
  },
  {
    id: 'titan',
    name: 'TITAN CASE',
    price: 5_000_000,
    emoji: '🗿',
    color: '#8888aa',
    risk: 'high',
    items: w([
      { emoji: '💪', name: 'Strength',     value: 100_000, weight: 22 },
      { emoji: '🗿', name: 'Ancient Rune', value: 350_000, weight: 20 },
      { emoji: '⛰️', name: 'Mountain',     value: 900_000, weight: 18 },
      { emoji: '🌋', name: 'Volcano',      value: 2_200_000,weight: 20 },
      { emoji: '🪨', name: 'Titan Stone',  value: 7_500_000,weight: 20 },
    ]),
  },
  {
    id: 'abyss',
    name: 'ABYSS CASE',
    price: 10_000_000,
    emoji: '🕳️',
    color: '#6600ff',
    risk: 'high',
    items: w([
      { emoji: '🪨', name: 'Nothing',      value: 1,              weight: 99 },
      { emoji: '👁️', name: 'THE ABYSS',    value: 950_000_000,    weight: 1  },
    ]),
  },
  {
    id: 'cosmos',
    name: 'COSMOS CASE',
    price: 50_000_000,
    emoji: '🌌',
    color: '#003366',
    risk: 'high',
    items: w([
      { emoji: '🪐', name: 'Planet',       value: 500_000, weight: 22 },
      { emoji: '🌠', name: 'Comet',        value: 2_000_000,weight: 20 },
      { emoji: '⭐', name: 'Star',         value: 5_000_000,weight: 18 },
      { emoji: '🌌', name: 'Nebula',       value: 12_000_000,weight: 20 },
      { emoji: '🌟', name: 'Big Bang',     value: 45_000_000,weight: 20 },
    ]),
  },
  {
    id: 'nexus',
    name: 'NEXUS CASE',
    price: 200_000_000,
    emoji: '🔷',
    color: '#00ffcc',
    risk: 'high',
    items: w([
      { emoji: '🔷', name: 'Gem',          value: 2_000_000, weight: 22 },
      { emoji: '💫', name: 'Crystal',      value: 8_000_000, weight: 20 },
      { emoji: '✨', name: 'Essence',      value: 20_000_000,weight: 18 },
      { emoji: '🌀', name: 'Vortex',       value: 50_000_000,weight: 20 },
      { emoji: '🔷', name: 'Nexus Core',   value: 180_000_000,weight: 20 },
    ]),
  },
  {
    id: 'eternal',
    name: 'ETERNAL CASE',
    price: 1_000_000_000,
    emoji: '♾️',
    color: '#ccaa00',
    risk: 'high',
    items: w([
      { emoji: '🕰️', name: 'Clock',        value: 10_000_000, weight: 22 },
      { emoji: '⏳', name: 'Hourglass',     value: 40_000_000, weight: 20 },
      { emoji: '♾️', name: 'Infinity',     value: 100_000_000,weight: 18 },
      { emoji: '⌛', name: 'Eternity',      value: 250_000_000,weight: 20 },
      { emoji: '🌠', name: 'Eternal Light', value: 900_000_000,weight: 20 },
    ]),
  },
  {
    id: 'divine',
    name: 'DIVINE CASE',
    price: 100_000_000_000,
    emoji: '🌟',
    color: '#ffffff',
    risk: 'high',
    items: w([
      { emoji: '👼', name: 'Angel',        value: 1_000_000_000, weight: 22 },
      { emoji: '🙏', name: 'Prayer',       value: 4_000_000_000, weight: 20 },
      { emoji: '😇', name: 'Blessed',      value: 10_000_000_000,weight: 18 },
      { emoji: '👑', name: 'God Crown',    value: 25_000_000_000,weight: 20 },
      { emoji: '🌟', name: 'Divine Power', value: 90_000_000_000,weight: 20 },
    ]),
  },
  {
    id: 'jackpot',
    name: 'JACKPOT CASE',
    price: 1_000_000_000,
    emoji: '💰',
    color: '#ffd700',
    risk: 'high',
    items: w([
      { emoji: '🪙', name: 'Dud',          value: 1,              weight: 90 },
      { emoji: '🪙', name: 'Dud',          value: 1,              weight: 90 },
      { emoji: '💎', name: 'JACKPOT',      value: 10_000_000_000, weight: 20 },
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
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000)     return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)         return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)             return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}
