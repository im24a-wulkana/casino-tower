export interface CaseItem {
  emoji: string;
  name: string;
  value: number;
  weight: number;
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
  // LOW RISK - 90% RTP (10% house edge)
  {
    id: 'starter',
    name: 'STARTER CASE',
    price: 5_000,
    emoji: '🎁',
    color: '#aaa',
    risk: 'low',
    items: w([
      { emoji: '📝', name: 'Notepad',      value: 1_200,    weight: 50 },
      { emoji: '✏️', name: 'Pencil Set',   value: 3_600,    weight: 30 },
      { emoji: '📚', name: 'Book',         value: 9_500,    weight: 15 },
      { emoji: '🎓', name: 'Diploma',      value: 28_500,   weight: 5  },
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
      { emoji: '🧢', name: 'Cap',          value: 2_400,    weight: 50 },
      { emoji: '👟', name: 'Sneakers',     value: 7_100,    weight: 30 },
      { emoji: '🕶️', name: 'Shades',       value: 19_000,   weight: 15 },
      { emoji: '🎒', name: 'Bag',          value: 57_000,   weight: 5  },
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
      { emoji: '🖱️', name: 'Mouse',        value: 4_700,    weight: 50 },
      { emoji: '⌨️', name: 'Keyboard',     value: 14_200,   weight: 30 },
      { emoji: '🎧', name: 'Headset',      value: 37_900,   weight: 15 },
      { emoji: '📱', name: 'Smartphone',   value: 113_700,  weight: 5  },
    ]),
  },

  // MEDIUM RISK - 85% RTP (15% house edge)
  {
    id: 'wheels',
    name: 'WHEELS CASE',
    price: 35_000,
    emoji: '🚗',
    color: '#2dc653',
    risk: 'medium',
    items: w([
      { emoji: '🛴', name: 'Scooter',      value: 7_800,    weight: 50 },
      { emoji: '🏍️', name: 'Motorbike',    value: 23_500,   weight: 30 },
      { emoji: '🚗', name: 'Hatchback',    value: 62_600,   weight: 15 },
      { emoji: '🚙', name: 'SUV',          value: 187_900,  weight: 5  },
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
      { emoji: '🔗', name: 'Chain',        value: 11_200,   weight: 50 },
      { emoji: '💍', name: 'Ring',         value: 33_600,   weight: 30 },
      { emoji: '⌚', name: 'Watch',        value: 89_500,   weight: 15 },
      { emoji: '📿', name: 'Necklace',     value: 268_400,  weight: 5  },
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
      { emoji: '🛋️', name: 'Couch',        value: 16_800,   weight: 50 },
      { emoji: '🍾', name: 'Champagne',    value: 50_300,   weight: 30 },
      { emoji: '🎨', name: 'Art Piece',    value: 134_200,  weight: 15 },
      { emoji: '🏊', name: 'Pool',         value: 402_600,  weight: 5  },
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
      { emoji: '🪙', name: 'Altcoin',      value: 22_400,   weight: 50 },
      { emoji: '💰', name: 'ETH',          value: 67_100,   weight: 30 },
      { emoji: '₿',  name: 'BTC Frag',     value: 178_900,  weight: 15 },
      { emoji: '📈', name: 'Moon Call',    value: 536_800,  weight: 5  },
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
      { emoji: '🧪', name: 'Health Potion', value: 26_800,  weight: 50 },
      { emoji: '💜', name: 'Mana Potion',  value: 80_500,   weight: 30 },
      { emoji: '🌟', name: 'Star Vial',    value: 214_700,  weight: 15 },
      { emoji: '⚡', name: 'Power Elixir', value: 644_200,  weight: 5  },
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
      { emoji: '🛡️', name: 'Shield',       value: 33_600,   weight: 50 },
      { emoji: '⚔️', name: 'Sword',        value: 100_700,  weight: 30 },
      { emoji: '🏹', name: 'Crossbow',     value: 268_400,  weight: 15 },
      { emoji: '🔱', name: 'Trident',      value: 805_300,  weight: 5  },
    ]),
  },

  // HIGH RISK - 70% RTP (30% house edge)
  {
    id: 'space',
    name: 'SPACE CASE',
    price: 200_000,
    emoji: '🚀',
    color: '#00d4ff',
    risk: 'high',
    items: w([
      { emoji: '🌙', name: 'Moon Rock',    value: 36_800,   weight: 50 },
      { emoji: '🛸', name: 'UFO',          value: 110_500,  weight: 30 },
      { emoji: '🌍', name: 'Globe',        value: 294_700,  weight: 15 },
      { emoji: '🪐', name: 'Planet',       value: 884_200,  weight: 5  },
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
      { emoji: '🦁', name: 'Lion',         value: 46_100,   weight: 50 },
      { emoji: '🐉', name: 'Dragon',       value: 138_200,  weight: 30 },
      { emoji: '🦄', name: 'Unicorn',      value: 368_400,  weight: 15 },
      { emoji: '👿', name: 'Demon',        value: 1_105_300, weight: 5  },
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
      { emoji: '🌩️', name: 'Thunderbolt',  value: 55_300,   weight: 50 },
      { emoji: '🔥', name: 'Hellfire',     value: 165_800,  weight: 30 },
      { emoji: '🌊', name: 'Tsunami',      value: 442_100,  weight: 15 },
      { emoji: '⚡', name: 'Lightning',    value: 1_326_300, weight: 5  },
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
      { emoji: '🦀', name: 'Crab',         value: 73_700,   weight: 50 },
      { emoji: '🐙', name: 'Octopus',      value: 221_100,  weight: 30 },
      { emoji: '🦈', name: 'Great White',  value: 589_500,  weight: 15 },
      { emoji: '🐳', name: 'Whale',        value: 1_768_400, weight: 5  },
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
      { emoji: '💀', name: 'Skull',        value: 101_300,  weight: 50 },
      { emoji: '🖤', name: 'Black Heart',  value: 303_900,  weight: 30 },
      { emoji: '🃏', name: 'Joker',        value: 810_500,  weight: 15 },
      { emoji: '🔮', name: 'Crystal Ball', value: 2_431_600, weight: 5  },
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
      { emoji: '💰', name: 'Gold Bar',     value: 184_200,  weight: 50 },
      { emoji: '💎', name: 'Diamond',      value: 552_600,  weight: 30 },
      { emoji: '👑', name: 'Crown',        value: 1_473_700, weight: 15 },
      { emoji: '🏆', name: 'Trophy',       value: 4_421_100, weight: 5  },
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
      { emoji: '🎲', name: 'Lucky Dice',   value: 368_400,  weight: 50 },
      { emoji: '🃏', name: 'Wild Card',    value: 1_105_300, weight: 30 },
      { emoji: '🎰', name: 'Jackpot',      value: 2_947_400, weight: 15 },
      { emoji: '💥', name: 'Explosion',    value: 8_842_100, weight: 5  },
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
      { emoji: '💪', name: 'Strength',     value: 921_100,  weight: 50 },
      { emoji: '🗿', name: 'Ancient Rune', value: 2_763_200, weight: 30 },
      { emoji: '⛰️', name: 'Mountain',     value: 7_368_400, weight: 15 },
      { emoji: '🌋', name: 'Volcano',      value: 22_105_300, weight: 5  },
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
      { emoji: '👁️', name: 'THE ABYSS',    value: 1_000_000_000,  weight: 1  },
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
      { emoji: '🪐', name: 'Planet',       value: 9_210_500,   weight: 50 },
      { emoji: '🌠', name: 'Comet',        value: 27_631_600,  weight: 30 },
      { emoji: '⭐', name: 'Star',         value: 73_684_200,  weight: 15 },
      { emoji: '🌌', name: 'Nebula',       value: 221_052_600, weight: 5  },
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
      { emoji: '🔷', name: 'Gem',          value: 36_842_100,   weight: 50 },
      { emoji: '💫', name: 'Crystal',      value: 110_526_300,  weight: 30 },
      { emoji: '✨', name: 'Essence',      value: 294_736_800,  weight: 15 },
      { emoji: '🌀', name: 'Vortex',       value: 884_210_500,  weight: 5  },
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
      { emoji: '🕰️', name: 'Clock',        value: 184_210_500,    weight: 50 },
      { emoji: '⏳', name: 'Hourglass',     value: 552_631_600,    weight: 30 },
      { emoji: '♾️', name: 'Infinity',     value: 1_473_684_200,  weight: 15 },
      { emoji: '⌛', name: 'Eternity',      value: 4_421_052_600,  weight: 5  },
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
      { emoji: '💎', name: 'JACKPOT',      value: 10_000_000_000, weight: 10 },
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
      { emoji: '👼', name: 'Angel',        value: 18_421_052_600,   weight: 50 },
      { emoji: '🙏', name: 'Prayer',       value: 55_263_157_900,   weight: 30 },
      { emoji: '😇', name: 'Blessed',      value: 147_368_421_100,  weight: 15 },
      { emoji: '👑', name: 'God Crown',    value: 442_105_263_200,  weight: 5  },
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
