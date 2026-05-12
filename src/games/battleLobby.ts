import { supabase } from '../lib/supabase';
import { CaseDef, CaseItem, rollItem } from './cases';

export type SlotType = 'human' | 'bot' | 'empty';
export type BattleMode = '1v1' | '2v2' | '1v1v1' | '1v1v1v1' | 'crazy';
export type BattleStatus = 'waiting' | 'running' | 'done';

export interface LobbyPlayer {
  slotId: string;
  type: SlotType;
  name: string;
  teamIdx: number;
  items: CaseItem[];
  done: boolean;
}

export interface LobbyBattle {
  id: string;
  mode: BattleMode;
  caseIds: string[];
  status: BattleStatus;
  createdAt: number;
  hostName: string;
  players: LobbyPlayer[];
  teamTotals: number[];
  winningTeams: number[];
}

// ── DB row ↔ LobbyBattle conversion ─────────────────────────────────────────

function fromRow(row: Record<string, unknown>): LobbyBattle {
  return {
    id:           row.id as string,
    mode:         row.mode as BattleMode,
    caseIds:      row.case_ids as string[],
    status:       row.status as BattleStatus,
    createdAt:    new Date(row.created_at as string).getTime(),
    hostName:     row.host_name as string,
    players:      row.players as LobbyPlayer[],
    teamTotals:   row.team_totals as number[],
    winningTeams: row.winning_teams as number[],
  };
}

function toRow(b: LobbyBattle) {
  return {
    id:            b.id,
    mode:          b.mode,
    case_ids:      b.caseIds,
    status:        b.status,
    host_name:     b.hostName,
    players:       b.players,
    team_totals:   b.teamTotals,
    winning_teams: b.winningTeams,
  };
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function readBattles(): Promise<LobbyBattle[]> {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('battles')
    .select('*')
    .gt('created_at', cutoff)
    .neq('status', 'done');
  return (data ?? []).map(fromRow);
}

export async function saveBattle(battle: LobbyBattle): Promise<void> {
  await supabase.from('battles').upsert(toRow(battle));
}

export async function deleteBattle(id: string): Promise<void> {
  await supabase.from('battles').delete().eq('id', id);
}

export async function getBattle(id: string): Promise<LobbyBattle | null> {
  const { data } = await supabase.from('battles').select('*').eq('id', id).maybeSingle();
  return data ? fromRow(data) : null;
}

// ── Realtime subscription ────────────────────────────────────────────────────

export function subscribeToBattle(
  battleId: string,
  onChange: (battle: LobbyBattle) => void,
) {
  const channel = supabase
    .channel(`battle:${battleId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'battles', filter: `id=eq.${battleId}` },
      payload => {
        if (payload.new && typeof payload.new === 'object') {
          onChange(fromRow(payload.new as Record<string, unknown>));
        }
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToLobby(
  onChange: (battles: LobbyBattle[]) => void,
) {
  const channel = supabase
    .channel('lobby')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'battles' },
      async () => {
        const battles = await readBattles();
        onChange(battles);
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

export function resolveBattle(battle: LobbyBattle): LobbyBattle {
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
  return resolveBattle(updated);
}
