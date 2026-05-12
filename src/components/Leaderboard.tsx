import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Collectible } from '../types';
import { rarityColor, RARITY_ORDER } from '../games/collectibles';
import { formatMoney } from '../utils/gameLogic';

interface LeaderEntry {
  username: string;
  topCollectible: Collectible | null;
  totalCollectibles: number;
  bank: number;
  winCount: number;
}

function getBestCollectible(collectibles: Collectible[]): Collectible | null {
  if (!collectibles || collectibles.length === 0) return null;
  return collectibles.reduce((best, c) =>
    RARITY_ORDER[c.rarity] > RARITY_ORDER[best.rarity] ? c : best
  );
}

export function Leaderboard({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rarity' | 'collection' | 'bank'>('rarity');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('username, game_state')
        .limit(100);

      if (error || !data) { setLoading(false); return; }

      const parsed: LeaderEntry[] = data
        .map(row => {
          const gs = (row.game_state ?? {}) as Record<string, unknown>;
          const collectibles = (gs.collectibles ?? []) as Collectible[];
          return {
            username: row.username as string,
            topCollectible: getBestCollectible(collectibles),
            totalCollectibles: collectibles.length,
            bank: typeof gs.bank === 'number' ? gs.bank : 0,
            winCount: typeof gs.winCount === 'number' ? gs.winCount : 0,
          };
        })
        .filter(e => e.totalCollectibles > 0 || e.bank > 0);

      setEntries(parsed);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (tab === 'rarity') {
      const ra = a.topCollectible ? RARITY_ORDER[a.topCollectible.rarity] : -1;
      const rb = b.topCollectible ? RARITY_ORDER[b.topCollectible.rarity] : -1;
      if (rb !== ra) return rb - ra;
      return b.totalCollectibles - a.totalCollectibles;
    }
    if (tab === 'collection') return b.totalCollectibles - a.totalCollectibles;
    return b.bank - a.bank;
  });

  return (
    <div className="lb-backdrop" onClick={onClose}>
      <div className="lb-modal" onClick={e => e.stopPropagation()}>
        <div className="lb-header">
          <span className="lb-title">🏆 LEADERBOARD</span>
          <button className="lb-close" onClick={onClose}>✕</button>
        </div>

        <div className="lb-tabs">
          <button className={`lb-tab ${tab === 'rarity' ? 'lb-tab-active' : ''}`} onClick={() => setTab('rarity')}>
            RAREST DROP
          </button>
          <button className={`lb-tab ${tab === 'collection' ? 'lb-tab-active' : ''}`} onClick={() => setTab('collection')}>
            COLLECTION
          </button>
          <button className={`lb-tab ${tab === 'bank' ? 'lb-tab-active' : ''}`} onClick={() => setTab('bank')}>
            RICHEST
          </button>
        </div>

        <div className="lb-list">
          {loading && <div className="lb-loading">Loading…</div>}
          {!loading && sorted.length === 0 && <div className="lb-empty">No data yet.</div>}
          {sorted.map((e, i) => (
            <div key={e.username} className={`lb-row ${i < 3 ? `lb-top-${i + 1}` : ''}`}>
              <span className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
              <span className="lb-user">{e.username}</span>
              {tab === 'rarity' && e.topCollectible && (
                <span className="lb-detail" style={{ color: rarityColor(e.topCollectible.rarity) }}>
                  {e.topCollectible.emoji} {e.topCollectible.name}
                  <span className="lb-rarity"> [{e.topCollectible.rarity.toUpperCase()}]</span>
                </span>
              )}
              {tab === 'rarity' && !e.topCollectible && (
                <span className="lb-detail lb-none">No collectibles</span>
              )}
              {tab === 'collection' && (
                <span className="lb-detail">{e.totalCollectibles} collectibles</span>
              )}
              {tab === 'bank' && (
                <span className="lb-detail gold">{formatMoney(e.bank)}</span>
              )}
              {e.winCount > 0 && <span className="lb-wins">🔄×{e.winCount}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
