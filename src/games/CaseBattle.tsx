import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../store/gameStore';
import { useAuth } from '../store/authStore';
import { GameHeader, useGameToast, GameToast } from '../components/BettingPanel';
import { CASES, CaseDef, CaseItem, oddsPercent, formatVal } from './cases';
import {
  LobbyBattle, LobbyPlayer,
  BattleMode, BattleStatus,
  readBattles, saveBattle, deleteBattle, getBattle,
  makeBattle, entryFee, totalPot, totalSlots,
  modeConfig, isFFA,
} from './battleLobby';
import { rollItem } from './cases';

const BATTLE_MODES: { mode: BattleMode; label: string; desc: string }[] = [
  { mode: '1v1',     label: '1v1',      desc: 'Classic duel' },
  { mode: '2v2',     label: '2v2',      desc: 'Team battle' },
  { mode: '1v1v1',   label: '1v1v1',    desc: '3-way FFA' },
  { mode: '1v1v1v1', label: '1v1v1v1',  desc: '4-way FFA' },
  { mode: 'crazy',   label: '🔥 CRAZY', desc: 'Lowest wins!' },
];

const TEAM_COLORS = ['#4caaff', '#ff4c4c', '#2dc653', '#c9a84c'];
const TEAM_LABELS = ['TEAM A', 'TEAM B', 'TEAM C', 'TEAM D'];
const BOT_NAMES   = ['GHOST','VIPER','NOVA','BLAZE','WRAITH','JINX','ACE','ROOK','STORM','PIXEL'];

type Screen = 'lobby' | 'create' | 'battle';

// ─── Helper: render a single player card ────────────────────────────────────

function PlayerCard({
  player, caseIds, isMe, phase,
}: {
  player: LobbyPlayer;
  caseIds: string[];
  isMe: boolean;
  phase: BattleStatus;
}) {
  const teamColor = TEAM_COLORS[player.teamIdx];
  return (
    <div className={`cb-arena-player ${isMe ? 'cb-arena-player-me' : ''}`}>
      <div className="cb-arena-player-name" style={{ color: isMe ? teamColor : undefined }}>
        {player.type === 'bot' ? '🤖' : '👤'} {player.name}
      </div>
      {caseIds.map((cId, ci) => {
        const caseDef = CASES.find(c => c.id === cId)!;
        const item: CaseItem | undefined = player.items[ci];
        return (
          <div key={ci} className="cb-arena-case" style={{ borderTopColor: caseDef?.color }}>
            {phase === 'waiting' && (
              <div className="cb-waiting"><span>{caseDef?.emoji}</span></div>
            )}
            {phase === 'running' && !item && (
              <div className="cb-rolling">
                <span className="cb-rolling-emoji">{caseDef?.emoji}</span>
                <span className="cb-rolling-dots">…</span>
              </div>
            )}
            {item && (
              <div className="cb-item-result">
                <span className="cb-item-emoji">{item.emoji}</span>
                <span className="cb-item-name">{item.name}</span>
                <span className="cb-item-value" style={{ color: caseDef?.color }}>{formatVal(item.value)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function CaseBattle() {
  const { state: gs, updateBank, setActiveGame, declareBankruptcy } = useGame();
  const { username } = useAuth();
  const { toast, show } = useGameToast();

  const [screen, setScreen]           = useState<Screen>('lobby');
  const [lobbies, setLobbies]         = useState<LobbyBattle[]>([]);
  const [activeBattle, setActiveBattle] = useState<LobbyBattle | null>(null);
  const [previewCase, setPreviewCase] = useState<CaseDef | null>(null);
  const mySlotId = useRef(`player-${username ?? 'you'}-${Math.random().toString(36).slice(2,6)}`);

  // ── Create form state
  const [mode, setMode]               = useState<BattleMode>('1v1');
  const [pickedCases, setPickedCases] = useState<string[]>(['street']);

  // ── Poll lobby every second
  useEffect(() => {
    const poll = () => setLobbies(readBattles().filter(b => b.status !== 'done'));
    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Poll active battle
  useEffect(() => {
    if (!activeBattle) return;
    const id = setInterval(() => {
      const fresh = getBattle(activeBattle.id);
      if (fresh) setActiveBattle(fresh);
    }, 500);
    return () => clearInterval(id);
  }, [activeBattle?.id]);

  // ── Derived
  const fee        = pickedCases.reduce((s, id) => s + (CASES.find(c => c.id === id)?.price ?? 0), 0);
  const numSlots   = totalSlots(mode);
  const canAfford  = gs.bank >= fee;
  const myName     = username ?? 'YOU';

  // ── Case list helpers
  const addCase    = (id: string) => setPickedCases(prev => [...prev, id]);
  const removeCase = (idx: number) => setPickedCases(prev => prev.filter((_, i) => i !== idx));

  // ── Create battle
  const createBattle = () => {
    if (!canAfford || pickedCases.length === 0) return;
    updateBank(-fee);
    const battle = makeBattle(mode, pickedCases, myName, mySlotId.current);
    saveBattle(battle);
    setActiveBattle(battle);
    setScreen('battle');
  };

  // ── Join battle
  const joinBattle = (battle: LobbyBattle) => {
    const fee2 = entryFee(battle, CASES);
    if (gs.bank < fee2) return;
    const emptySlot = battle.players.find(p => p.type === 'empty');
    if (!emptySlot) return;
    updateBank(-fee2);
    const updated: LobbyBattle = {
      ...battle,
      players: battle.players.map(p =>
        p.slotId === emptySlot.slotId
          ? { ...p, slotId: mySlotId.current, type: 'human', name: myName }
          : p
      ),
    };
    saveBattle(updated);
    setActiveBattle(updated);
    setScreen('battle');
  };

  // ── Fill slot with bot
  const fillBot = (slotId: string) => {
    if (!activeBattle) return;
    const usedNames = activeBattle.players.map(p => p.name);
    const name = BOT_NAMES.find(n => !usedNames.includes(n)) ?? 'BOT';
    const updated: LobbyBattle = {
      ...activeBattle,
      players: activeBattle.players.map(p =>
        p.slotId === slotId ? { ...p, type: 'bot', name } : p
      ),
    };
    saveBattle(updated);
    setActiveBattle(updated);
  };

  const fillAllBots = () => {
    if (!activeBattle) return;
    let battle = { ...activeBattle, players: [...activeBattle.players] };
    const usedNames = battle.players.map(p => p.name);
    let namePool = BOT_NAMES.filter(n => !usedNames.includes(n));
    battle.players = battle.players.map(p => {
      if (p.type !== 'empty') return p;
      const name = namePool.shift() ?? 'BOT';
      return { ...p, type: 'bot', name };
    });
    saveBattle(battle);
    setActiveBattle(battle);
  };

  // ── Start battle (host only)
  const startBattle = useCallback(() => {
    if (!activeBattle) return;
    const allFilled = activeBattle.players.every(p => p.type !== 'empty');
    if (!allFilled) return;

    // Show rolling state first
    const running: LobbyBattle = { ...activeBattle, status: 'running' };
    saveBattle(running);
    setActiveBattle(running);

    // Stagger reveals per player
    const { teams, perTeam } = modeConfig(activeBattle.mode);
    const numPlayers = teams * perTeam;

    activeBattle.players.forEach((_, idx) => {
      const delay = 600 + idx * 700 + Math.random() * 300;
      setTimeout(() => {
        setActiveBattle(prev => {
          if (!prev) return prev;
          const fresh = getBattle(prev.id) ?? prev;

          // Roll items for this player
          const items: CaseItem[] = prev.caseIds.map(cId => {
            const caseDef = CASES.find(c => c.id === cId)!;
            return rollItem(caseDef);
          });

          const next: LobbyBattle = {
            ...fresh,
            players: fresh.players.map((p, i) =>
              i === idx ? { ...p, items, done: true } : p
            ),
          };

          // If all done, resolve
          if (next.players.every(p => p.done)) {
            const resolved = resolveAndPay(next);
            saveBattle(resolved);
            return resolved;
          }

          saveBattle(next);
          return next;
        });
      }, delay);
    });
  }, [activeBattle]);

  // ── Resolve and pay out
  const resolveAndPay = (battle: LobbyBattle): LobbyBattle => {
    const { teams } = modeConfig(battle.mode);
    const totals = Array(teams).fill(0);
    battle.players.forEach(p => {
      totals[p.teamIdx] += p.items.reduce((s, i) => s + i.value, 0);
    });

    const isCrazyMode = battle.mode === 'crazy';
    const best = isCrazyMode ? Math.min(...totals) : Math.max(...totals);
    const winners = totals.map((t, i) => t === best ? i : -1).filter(i => i >= 0);

    const pot = totalPot(battle, CASES);
    const myPlayer = battle.players.find(p => p.slotId === mySlotId.current);
    if (myPlayer) {
      const myTeam = myPlayer.teamIdx;
      const { perTeam } = modeConfig(battle.mode);
      if (winners.includes(myTeam)) {
        const share = Math.floor(pot / winners.length / perTeam);
        updateBank(share * perTeam);
        const net = share * perTeam - entryFee(battle, CASES);
        show(true, `TEAM ${String.fromCharCode(65 + myTeam)} WINS!`, net);
      } else {
        show(false, 'YOU LOSE', -entryFee(battle, CASES));
      }
    }

    return { ...battle, status: 'done', teamTotals: totals, winningTeams: winners };
  };

  // ── Leave / reset
  const leaveBattle = () => {
    if (activeBattle && activeBattle.status === 'waiting') {
      const isHost = activeBattle.players[0].slotId === mySlotId.current;
      if (isHost) deleteBattle(activeBattle.id);
    }
    setActiveBattle(null);
    setScreen('lobby');
  };

  const leaveGame = () => gs.bank <= 0 ? declareBankruptcy() : setActiveGame(null);

  const amHost = activeBattle?.players[0]?.slotId === mySlotId.current;
  const mySlot = activeBattle?.players.find(p => p.slotId === mySlotId.current);
  const allFilled = activeBattle?.players.every(p => p.type !== 'empty') ?? false;
  const ffa = activeBattle ? isFFA(activeBattle.mode) : false;
  const byTeam = activeBattle
    ? Array.from({ length: modeConfig(activeBattle.mode).teams }, (_, t) =>
        activeBattle.players.filter(p => p.teamIdx === t))
    : [];

  return (
    <div className="game-view">
      <GameToast toast={toast} />
      <GameHeader title="CASE BATTLE" bank={gs.bank} onLeave={leaveGame} />

      {/* Case preview modal */}
      {previewCase && (
        <div className="case-modal-backdrop" onClick={() => setPreviewCase(null)}>
          <div className="case-modal" onClick={e => e.stopPropagation()}>
            <div className="case-modal-header">
              <span className="case-modal-emoji">{previewCase.emoji}</span>
              <span className="case-modal-name">{previewCase.name}</span>
              <span className="case-modal-price">{formatVal(previewCase.price)}</span>
              <button className="case-modal-close" onClick={() => setPreviewCase(null)}>✕</button>
            </div>
            <div className="case-modal-items">
              {[...previewCase.items].sort((a, b) => b.value - a.value).map((item, i) => (
                <div key={i} className="case-modal-item">
                  <span className="cmi-emoji">{item.emoji}</span>
                  <span className="cmi-name">{item.name}</span>
                  <span className="cmi-value">{formatVal(item.value)}</span>
                  <span className="cmi-odds">{oddsPercent(item, previewCase).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOBBY SCREEN ── */}
      {screen === 'lobby' && (
        <div className="cb-lobby">
          <div className="cb-lobby-header">
            <div>
              <div className="cb-lobby-title">BATTLE LOBBY</div>
              <div className="cb-lobby-sub">{lobbies.length} active battle{lobbies.length !== 1 ? 's' : ''}</div>
            </div>
            <button className="btn-primary" onClick={() => setScreen('create')}>+ CREATE BATTLE</button>
          </div>

          {lobbies.length === 0 && (
            <div className="cb-lobby-empty">No open battles. Create one and wait for friends to join!</div>
          )}

          <div className="cb-lobby-list">
            {lobbies.map(battle => {
              const fee2 = entryFee(battle, CASES);
              const pot2 = totalPot(battle, CASES);
              const openSlots = battle.players.filter(p => p.type === 'empty').length;
              const caseList = [...new Set(battle.caseIds)];
              return (
                <div key={battle.id} className="cb-lobby-row">
                  <div className="cb-lobby-row-left">
                    <span className="cb-lobby-mode">{battle.mode.toUpperCase()}</span>
                    <div className="cb-lobby-cases">
                      {caseList.map(id => {
                        const c = CASES.find(x => x.id === id);
                        return c ? (
                          <span key={id} className="cb-lobby-case-chip"
                            style={{ borderColor: c.color, color: c.color }}>
                            {c.emoji} {battle.caseIds.filter(x => x === id).length > 1
                              ? `×${battle.caseIds.filter(x => x === id).length}` : ''}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <span className="cb-lobby-host">by {battle.hostName}</span>
                  </div>
                  <div className="cb-lobby-row-right">
                    <div className="cb-lobby-pot">POT: <strong>{formatVal(pot2)}</strong></div>
                    <div className="cb-lobby-slots">{openSlots} slot{openSlots !== 1 ? 's' : ''} open</div>
                    {openSlots > 0 && battle.status === 'waiting' ? (
                      <button
                        className="btn-primary cb-join-btn"
                        disabled={gs.bank < fee2}
                        onClick={() => joinBattle(battle)}
                      >
                        JOIN — {formatVal(fee2)}
                      </button>
                    ) : (
                      <button className="btn-secondary cb-join-btn"
                        onClick={() => { setActiveBattle(battle); setScreen('battle'); }}>
                        WATCH
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CREATE SCREEN ── */}
      {screen === 'create' && (
        <div className="cb-setup">
          <div className="cb-setup-nav">
            <button className="cb-back-btn" onClick={() => setScreen('lobby')}>← LOBBY</button>
            <span className="cb-section-label">CREATE A BATTLE</span>
          </div>

          <div className="cb-section-label">BATTLE MODE</div>
          <div className="cb-mode-row">
            {BATTLE_MODES.map(m => (
              <button key={m.mode}
                className={`cb-mode-btn ${mode === m.mode ? 'cb-mode-active' : ''}`}
                onClick={() => setMode(m.mode)}>
                <span className="cb-mode-label">{m.label}</span>
                <span className="cb-mode-desc">{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="cb-section-label">
            YOUR CASES — entry fee: {formatVal(fee)} · pot: {formatVal(fee * numSlots)}
          </div>

          {/* Selected cases list */}
          <div className="cb-picked-cases">
            {pickedCases.map((id, idx) => {
              const c = CASES.find(x => x.id === id)!;
              return (
                <div key={idx} className="cb-picked-case"
                  style={{ '--case-color': c.color } as React.CSSProperties}>
                  <span className="cb-picked-emoji">{c.emoji}</span>
                  <span className="cb-picked-name">{c.name}</span>
                  <span className="cb-picked-price">{formatVal(c.price)}</span>
                  <button className="cb-picked-remove" onClick={() => removeCase(idx)}>✕</button>
                </div>
              );
            })}
            {pickedCases.length === 0 && (
              <div className="cb-no-cases">Add at least one case below</div>
            )}
          </div>

          <div className="cb-section-label">ADD CASES</div>
          <div className="cb-case-row">
            {CASES.map(c => (
              <div key={c.id}
                className={`cb-case-chip ${gs.bank < fee + c.price ? 'cb-case-cant' : ''}`}
                style={{ '--case-color': c.color } as React.CSSProperties}>
                <button className="cb-case-pick" onClick={() => addCase(c.id)}>
                  <span>{c.emoji}</span>
                  <span className="cb-case-chip-name">{c.name}</span>
                  <span className="cb-case-chip-price">{formatVal(c.price)}</span>
                </button>
                <button className="cb-preview-btn" onClick={() => setPreviewCase(c)}>👁</button>
              </div>
            ))}
          </div>

          <div className="cb-actions">
            <button className="btn-secondary" onClick={() => setScreen('lobby')}>CANCEL</button>
            <button className="btn-primary"
              disabled={!canAfford || pickedCases.length === 0}
              onClick={createBattle}>
              CREATE — {formatVal(fee)}
            </button>
          </div>
          {!canAfford && <div className="cb-cant-afford">Insufficient funds</div>}
        </div>
      )}

      {/* ── BATTLE SCREEN ── */}
      {screen === 'battle' && activeBattle && (
        <div className="cb-arena">
          {/* Pot + status bar */}
          <div className="cb-arena-pot">
            <span className="cb-pot-label">POT</span>
            <span className="cb-pot-value">{formatVal(totalPot(activeBattle, CASES))}</span>
            <span className={`cb-battle-status cb-status-${activeBattle.status}`}>
              {activeBattle.status === 'waiting' ? '⏳ WAITING' : activeBattle.status === 'running' ? '⚡ LIVE' : '✅ DONE'}
            </span>
            {activeBattle.mode === 'crazy' && <span className="cb-crazy-badge">🔥 CRAZY — LOWEST WINS</span>}
          </div>

          {/* Case headers */}
          <div className="cb-arena-case-headers">
            {activeBattle.caseIds.map((id, i) => {
              const c = CASES.find(x => x.id === id)!;
              return (
                <div key={i} className="cb-arena-case-header" style={{ color: c.color }}>
                  {c.emoji} {c.name}
                </div>
              );
            })}
          </div>

          {/* Teams */}
          <div className={`cb-arena-teams ${ffa ? 'cb-ffa' : ''}`}>
            {byTeam.map((team, tIdx) => {
              const isWinner = activeBattle.winningTeams.includes(tIdx);
              const isLoser  = activeBattle.status === 'done' && !isWinner;
              return (
                <div key={tIdx}
                  className={`cb-arena-team ${isWinner ? 'cb-arena-win' : ''} ${isLoser ? 'cb-arena-lose' : ''}`}
                  style={{ '--team-color': TEAM_COLORS[tIdx] } as React.CSSProperties}>
                  {!ffa && (
                    <div className="cb-arena-team-label">
                      {TEAM_LABELS[tIdx]}
                      {activeBattle.status === 'done' && activeBattle.teamTotals[tIdx] !== undefined && (
                        <span className="cb-arena-team-total">{formatVal(activeBattle.teamTotals[tIdx])}</span>
                      )}
                    </div>
                  )}
                  {team.map((player, pIdx) => {
                    const isMe = player.slotId === mySlotId.current;
                    if (player.type === 'empty') {
                      return (
                        <div key={pIdx} className="cb-empty-slot">
                          {amHost ? (
                            <button className="cb-slot cb-slot-empty" onClick={() => fillBot(player.slotId)}>
                              <span>＋</span><span>ADD BOT</span>
                            </button>
                          ) : (
                            <div className="cb-slot cb-slot-empty" style={{ cursor: 'default' }}>
                              <span>⏳</span><span>WAITING…</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <PlayerCard key={pIdx}
                        player={player}
                        caseIds={activeBattle.caseIds}
                        isMe={isMe}
                        phase={activeBattle.status} />
                    );
                  })}
                  {isWinner && <div className="cb-winner-badge">🏆 WINNER</div>}
                  {ffa && activeBattle.status === 'done' && activeBattle.teamTotals[tIdx] !== undefined && (
                    <div className="cb-ffa-total" style={{ color: TEAM_COLORS[tIdx] }}>
                      {formatVal(activeBattle.teamTotals[tIdx])}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Waiting — host controls */}
          {activeBattle.status === 'waiting' && amHost && (
            <div className="cb-host-controls">
              <button className="btn-secondary" onClick={fillAllBots}>FILL WITH BOTS</button>
              <button className="btn-primary" disabled={!allFilled} onClick={startBattle}>
                START BATTLE
              </button>
            </div>
          )}
          {activeBattle.status === 'waiting' && !amHost && (
            <div className="cb-waiting-msg">Waiting for host to start…</div>
          )}

          {/* Result */}
          {activeBattle.status === 'done' && (
            <div className="cb-result-actions">
              {activeBattle.winningTeams.includes(mySlot?.teamIdx ?? -1) && (
                <div className="cb-payout-info">
                  You receive: <strong>
                    {formatVal(Math.floor(
                      totalPot(activeBattle, CASES) /
                      activeBattle.winningTeams.length /
                      modeConfig(activeBattle.mode).perTeam
                    ))}
                  </strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" onClick={leaveBattle}>BATTLE AGAIN</button>
                <button className="btn-secondary" onClick={leaveGame}>LEAVE</button>
              </div>
            </div>
          )}

          {activeBattle.status !== 'done' && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button className="btn-secondary" onClick={leaveBattle}>← BACK TO LOBBY</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
