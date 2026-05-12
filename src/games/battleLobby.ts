// Shared localStorage-based battle lobby
// Simulates an online lobby for same-device multiplayer / "watching" other battles

import { CaseDef, CaseItem, rollItem } from './cases';

export type SlotType = 'human' | 'bot' | 'empty';
export type BattleMode = '1v1' | '2v2' | '1v1v1' | '1v1v1v1' | 'crazy';
export type BattleStatus = 'waiting' | 'running' | 'done';

export interface LobbyPlayer {
  slotId: string;
  type: SlotType;
  name: string;
  teamIdx: number;
  items: CaseItem[];   // one item per case opened
  done: boolean;
}

export interface LobbyBattle {
  id: string;
  mode: BattleMode;
  caseIds: string[];          // ordered list of case ids, all players open these
  status: BattleStatus;
  createdAt: number;
  hostName: string;
  players: LobbyPlayer[];
  teamTotals: number[];
  winningTeams: number[];
}

const KEY = 'ct_battles';
const MAX_AGE_MS = 10 * 60 * 1000; // prune battles older than 10 min

export function readBattles(): LobbyBattle[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const all: LobbyBattle[] = JSON.parse(raw);
    const cutoff = Date.now() - MAX_AGE_MS;
    return all.filter(b => b.createdAt > cutoff);
  } catch { return []; }
}

export function writeBattles(battles: LobbyBattle[]) {
  localStorage.setItem(KEY, JSON.stringify(battles));
}

export function saveBattle(battle: LobbyBattle) {
  const all = readBattles();
  const idx = all.findIndex(b => b.id === battle.id);
  if (idx >= 0) all[idx] = battle;
  else all.push(battle);
  writeBattles(all);
}

export function deleteBattle(id: string) {
  writeBattles(readBattles().filter(b => b.id !== id));
}

export function getBattle(id: string): LobbyBattle | null {
  return readBattles().find(b => b.id === id) ?? null;
}

export function modeConfig(mode: BattleMode): { teams: number; perTeam: number } {
  switch (mode) {
    case '1v1':     return { teams: 2, perTeam: 1 };
    case '2v2':     return { teams: 2, perTeam: 2 };
    case '1v1v1':   return { teams: 3, perTeam: 1 };
    case '1v1v1v1': return { teams: 4, perTeam: 1 };
    case 'crazy':   return { teams: 2, perTeam: 2 };
  }
}

export function totalSlots(mode: BattleMode): number {
  const { teams, perTeam } = modeConfig(mode);
  return teams * perTeam;
}

export function isFFA(mode: BattleMode): boolean {
  return mode === '1v1v1' || mode === '1v1v1v1';
}

export function entryFee(battle: LobbyBattle, cases: CaseDef[]): number {
  return battle.caseIds.reduce((sum, id) => {
    const c = cases.find(x => x.id === id);
    return sum + (c?.price ?? 0);
  }, 0);
}

export function totalPot(battle: LobbyBattle, cases: CaseDef[]): number {
  return entryFee(battle, cases) * totalSlots(battle.mode);
}

export function makeBattle(
  mode: BattleMode,
  caseIds: string[],
  hostName: string,
  hostSlotId: string,
): LobbyBattle {
  const { teams, perTeam } = modeConfig(mode);
  const players: LobbyPlayer[] = [];
  let slotCounter = 0;
  for (let t = 0; t < teams; t++) {
    for (let p = 0; p < perTeam; p++) {
      const isHost = slotCounter === 0;
      players.push({
        slotId: isHost ? hostSlotId : `slot-${slotCounter}`,
        type: isHost ? 'human' : 'empty',
        name: isHost ? hostName : '',
        teamIdx: t,
        items: [],
        done: false,
      });
      slotCounter++;
    }
  }
  return {
    id: `battle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    mode,
    caseIds,
    status: 'waiting',
    createdAt: Date.now(),
    hostName,
    players,
    teamTotals: [],
    winningTeams: [],
  };
}

export function resolveBattle(
  battle: LobbyBattle,
  cases: CaseDef[],
): LobbyBattle {
  const { teams } = modeConfig(battle.mode);
  const totals = Array(teams).fill(0);
  battle.players.forEach(p => {
    totals[p.teamIdx] += p.items.reduce((s, i) => s + i.value, 0);
  });
  const isCrazy = battle.mode === 'crazy';
  const best = isCrazy ? Math.min(...totals) : Math.max(...totals);
  const winners = totals.map((t, i) => t === best ? i : -1).filter(i => i >= 0);
  return { ...battle, status: 'done', teamTotals: totals, winningTeams: winners };
}

export function rollAllItems(battle: LobbyBattle, cases: CaseDef[]): LobbyBattle {
  const updated = {
    ...battle,
    status: 'running' as BattleStatus,
    players: battle.players.map(p => {
      const items = battle.caseIds.map(id => {
        const c = cases.find(x => x.id === id)!;
        return rollItem(c);
      });
      return { ...p, items, done: true };
    }),
  };
  return resolveBattle(updated, cases);
}
