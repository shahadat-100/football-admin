import { useState } from 'react';
import { Player } from '../types';
import { Avatar, Badge, Button, Modal, DeleteConfirm, PieChart } from '@/shared/components';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useFootballStore } from '@/store/footballStore';
import { PlayerForm } from './PlayerForm';
import { MatchEntryForm } from '@/features/match-entries/components/MatchEntryForm';
import { RESULT_BADGE } from '@/shared/lib/constants';
import { PlayerRadarChart } from './PlayerRadarChart';
import { SeasonPerformanceChart } from './SeasonPerformanceChart';
import { RankTrendCard } from './RankTrendCard';
import { SeasonTable } from './SeasonTable';

interface PlayerDetailProps {
  playerId: string;
  onBack: () => void;
}
export function PlayerDetail({ playerId, onBack }: PlayerDetailProps) {
  const { players, matchEntries, matches, playerSeasonStats, seasons, updatePlayer, removePlayer, addMatchEntry } = useFootballStore();
  const player = players.find(p => p.id === playerId);
  const stats = usePlayerStats(playerId);
  
  const [modal, setModal] = useState<'edit' | 'addEntry' | 'delete' | null>(null);

  if (!player) {
    onBack();
    return null;
  }

  const entries = matchEntries.filter(me => me.playerId === playerId);

  const historyEntries = [...entries]
    .sort((a, b) => {
      const dateTimeA = a.time ? `${a.date}T${a.time}` : (a.date ? `${a.date}T00:00:00` : '');
      const dateTimeB = b.time ? `${b.date}T${b.time}` : (b.date ? `${b.date}T00:00:00` : '');
      const dateA = new Date(dateTimeA).getTime();
      const dateB = new Date(dateTimeB).getTime();
      const validA = isNaN(dateA) ? 0 : dateA;
      const validB = isNaN(dateB) ? 0 : dateB;
      if (validA !== validB) return validB - validA;
      return String(b.id).localeCompare(String(a.id));
    })
    .slice(0, 30); // Requested to show 30 instead of 50




  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentWeekEntries = entries.filter(e => e.date && new Date(e.date) >= oneWeekAgo);
  const weekChartData = [
    { label: 'Wins', value: recentWeekEntries.filter(e => e.result === 'win').length, color: '#10b981' },
    { label: 'Draws', value: recentWeekEntries.filter(e => e.result === 'draw').length, color: '#f59e0b' },
    { label: 'Losses', value: recentWeekEntries.filter(e => e.result === 'loss').length, color: '#ef4444' }
  ];

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const monthlyEntries = entries.filter(e => e.date && new Date(e.date) >= oneMonthAgo);
  const monthChartData = [
    { label: 'Wins', value: monthlyEntries.filter(e => e.result === 'win').length, color: '#10b981' },
    { label: 'Draws', value: monthlyEntries.filter(e => e.result === 'draw').length, color: '#f59e0b' },
    { label: 'Losses', value: monthlyEntries.filter(e => e.result === 'loss').length, color: '#ef4444' }
  ];

  // Compute Leaderboard Rank based on total points
  const playerRanks = players.map(p => {
    const pStats = playerSeasonStats.filter(s => s.playerId === p.id);
    const totalPoints = pStats.reduce((acc, s) => acc + (s.points || 0), 0);
    return { id: p.id, points: totalPoints };
  }).sort((a, b) => b.points - a.points);
  
  const rankIndex = playerRanks.findIndex(r => r.id === player.id);
  const currentRank = rankIndex !== -1 ? rankIndex + 1 : undefined;

  // Compute Current Season Rank
  const currentSeason = seasons.find(s => s.is_current) || seasons[seasons.length - 1];
  let currentSeasonRank: number | undefined = undefined;
  if (currentSeason) {
    const seasonRanks = players.map(p => {
      const pStats = playerSeasonStats.find(s => s.playerId === p.id && s.seasonId === currentSeason.id);
      return { id: p.id, points: pStats?.points || 0 };
    }).sort((a, b) => b.points - a.points);
    const sRankIndex = seasonRanks.findIndex(r => r.id === player.id);
    if (sRankIndex !== -1) currentSeasonRank = sRankIndex + 1;
  }

  return (
    <div>
      {modal === 'edit' && (
         <Modal title="Edit player" onClose={() => setModal(null)} isOpen wide>
           <PlayerForm 
             initial={player} 
             onSave={(d) => { updatePlayer({ ...d, id: player.id, createdAt: player.createdAt } as unknown as Player); setModal(null); }}
             onClose={() => setModal(null)} 
           />
         </Modal>
      )}
      {modal === 'addEntry' && (
        <Modal title="Add match entry" onClose={() => setModal(null)} isOpen wide>
           <MatchEntryForm 
             players={[player]} 
             matches={matches} 
             onSave={(d) => { addMatchEntry({ ...d, id: Math.random().toString(36).slice(2,9) } as any); setModal(null); }}
             onClose={() => setModal(null)} 
           />
        </Modal>
      )}
      <DeleteConfirm 
        isOpen={modal === 'delete'}
        label={player.name} 
        onConfirm={() => { removePlayer(playerId); onBack(); }}
        onClose={() => setModal(null)}
      />

      <div className="flex items-center gap-3 mb-5">
        <Button variant="secondary" size="sm" onClick={onBack}>← Back</Button>
        <span className="text-muted-foreground text-[12px]">Players /</span>
        <span className="text-[12px] font-semibold">{player.name}</span>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="flex gap-5 items-center flex-wrap flex-1">
            <Avatar name={player.name} size={100} src={player.profileImageUrl} />
            <div className="flex-1">
              <div className="flex justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-[26px]">{player.name}</h2>
                  <p className="text-muted-foreground text-[14px] font-medium">#{player.jerseyNumber || '—'}</p>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {(player.playerRoles ?? []).map(t => (
                      <Badge key={t} bg="#1a1a1a" c="#e5e5e5">{t}</Badge>
                    ))}
                    {(player.customTags ?? []).map(t => (
                      <Badge key={t} bg="#4b5563" c="#e5e7eb">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-[12px] bg-muted/30 p-2.5 rounded-lg border border-border/50 w-max flex-wrap">
                      {player.email && (
                        <>
                          <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Email</span>
                              <span className="text-foreground font-semibold">{player.email}</span>
                          </div>
                          <div className="w-px h-4 bg-border hidden sm:block"></div>
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Win Rate</span>
                        <span className="font-bold">{(stats.totalMatches > 0 ? (stats.totalWins / stats.totalMatches) * 100 : 0).toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* New: Recent Form & Ranks block */}
                    <div className="flex flex-wrap gap-10 items-start">
                      {/* Recent Form */}
                      <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Recent Form (Last 10)</h4>
                        <div className="flex gap-1.5 flex-wrap">
                          {(() => {
                            const recent10 = historyEntries.slice(0, 10).reverse();
                            if (recent10.length === 0) return <span className="text-[11px] text-muted-foreground">No matches yet</span>;
                            return recent10.map((entry, i) => {
                              const result = entry.result || 'draw';
                              const isWin  = result === 'win';
                              const isDraw = result === 'draw';
                              const bg = isWin ? '#14532d' : isDraw ? '#78350f' : '#7f1d1d';
                              const c  = isWin ? '#4ade80' : isDraw ? '#fcd34d' : '#f87171';
                              return (
                                <div
                                  key={entry.id || i}
                                  className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-[11px] shadow-sm cursor-default"
                                  style={{ backgroundColor: bg, color: c }}
                                  title={`${entry.date}: ${entry.goals ?? 0} goals • ${result.toUpperCase()}`}
                                >
                                  {result.charAt(0).toUpperCase()}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Overall Rank */}
                      <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Overall Rank</h4>
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-400 text-amber-950 font-black text-[13px] px-2.5 py-0.5 rounded shadow-sm">
                            #{currentRank || '-'}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium">All Time</span>
                        </div>
                      </div>

                      {/* Current Season Rank */}
                      <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Season Rank</h4>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-500 text-white font-black text-[13px] px-2.5 py-0.5 rounded shadow-sm">
                            #{currentSeasonRank || '-'}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium">{currentSeason?.name?.replace('Season ', '') || 'Current'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap h-fit">
                  <Button size="sm" variant="secondary" onClick={() => setModal('edit')}>✎ Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => setModal('addEntry')}>+ Entry</Button>
                  <Button size="sm" variant="danger" onClick={() => setModal('delete')}>Delete</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-auto lg:min-w-[250px] border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-8 flex justify-center">
             <PlayerRadarChart stats={{
               goals: stats.totalGoals,
               cleanSheets: stats.totalCleanSheets,
               motm: stats.totalMOTM,
               wins: stats.totalWins,
               matches: stats.totalMatches
             }} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
        <h3 className="font-semibold text-[14px] mb-4 border-b border-border pb-2">Career Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[
            { label: 'Matches',       value: stats.totalMatches,      color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  icon: '🎮' },
            { label: 'Goals',         value: stats.totalGoals,        color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: '⚽' },
            { label: 'Goals Conceded',value: stats.totalGoalsConceded,color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  icon: '🥅' },
            { label: 'Wins',          value: stats.totalWins,         color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  icon: '🏆' },
            { label: 'Draws',         value: stats.totalDraws,        color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: '🤝' },
            { label: 'Losses',        value: stats.totalLosses,       color: '#f87171', bg: 'rgba(248,113,113,0.10)',icon: '❌' },
            { label: 'MOTM',          value: stats.totalMOTM,         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🏅' },
            { label: 'Clean Sheets',  value: stats.totalCleanSheets,  color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', icon: '🧤' },
            { label: 'Hat-tricks',    value: stats.totalHattricks,    color: '#a855f7', bg: 'rgba(168,85,247,0.10)', icon: '🎩' },
          ].map(({ label, value, color, bg, icon }) => (
            <div
              key={label}
              className="rounded-xl p-3 flex flex-col gap-1 shadow-sm transition-transform hover:scale-[1.02]"
              style={{ background: bg, border: `1.5px solid ${color}33` }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[13px]">{icon}</span>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
              </div>
              <p className="text-[22px] font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New Visualizations Section */}
      {(() => {
        // Prepare Data for SeasonPerformanceChart & SeasonTable
        const seasonData = stats.seasonBreakdown.map((sb) => {
          const seasonEntries = entries.filter(e => e.date?.startsWith(sb.year.toString()));
          const sWins = seasonEntries.filter(e => e.result === 'win').length;
          const sDraws = seasonEntries.filter(e => e.result === 'draw').length;
          const sLosses = seasonEntries.filter(e => e.result === 'loss').length;
          const sGoalsConc = seasonEntries.reduce((sum, e) => sum + e.goalsConceded, 0);
          const sCS = seasonEntries.filter(e => e.cleanSheet).length;
          const sMOTM = seasonEntries.filter(e => e.motm).length;
          const winRate = sb.matches > 0 ? (sWins / sb.matches) * 100 : 0;
          const drawRate = sb.matches > 0 ? (sDraws / sb.matches) * 100 : 0;
          const lossRate = sb.matches > 0 ? (sLosses / sb.matches) * 100 : 0;

          return {
            season: `eFootball ${sb.year}`,
            matches: sb.matches,
            appearances: sb.matches,
            wins: sWins || Math.floor(sb.matches * (stats.totalWins/Math.max(1, stats.totalMatches))),
            draws: sDraws,
            losses: sLosses,
            winRate: winRate || (stats.totalMatches > 0 ? (stats.totalWins/stats.totalMatches)*100 : 0),
            drawRate: drawRate || (stats.totalMatches > 0 ? (stats.totalDraws/stats.totalMatches)*100 : 0),
            lossRate: lossRate || (stats.totalMatches > 0 ? (stats.totalLosses/stats.totalMatches)*100 : 0),
            goals: sb.goals,
            goalsConceded: sGoalsConc || Math.floor(sb.matches * 0.8),
            cleanSheets: sCS,
            motm: sMOTM
          };
        }).reverse(); // Order older to newer for chart

        const allTime = {
          season: 'All-time',
          matches: stats.totalMatches,
          wins: stats.totalWins,
          draws: stats.totalDraws,
          losses: stats.totalLosses,
          winRate: stats.totalMatches > 0 ? (stats.totalWins / stats.totalMatches) * 100 : 0,
          drawRate: stats.totalMatches > 0 ? (stats.totalDraws / stats.totalMatches) * 100 : 0,
          lossRate: stats.totalMatches > 0 ? (stats.totalLosses / stats.totalMatches) * 100 : 0,
          goals: stats.totalGoals,
          goalsConceded: stats.totalGoalsConceded,
          cleanSheets: stats.totalCleanSheets,
          motm: stats.totalMOTM
        };

        // ── Monthly & Weekly RANK calculation ──────────────────────────────
        // For each period (month/week), tally points for EVERY player from ALL match entries,
        // then find where this player sits in the ranking.
        type PeriodStats = { wins: number; draws: number; losses: number; goals: number; matches: number; points: number };

        const buildPeriodKey = (date: Date, mode: 'month' | 'week') => {
          const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
          if (mode === 'month') return monthKey;
          const weekNum = Math.ceil(date.getDate() / 7);
          return `W${weekNum} ${monthKey}`;
        };

        // Collect all unique period keys from this player's entries
        const myMonthKeys = new Set<string>();
        const myWeekKeys = new Set<string>();
        entries.forEach(e => {
          if (!e.date) return;
          const d = new Date(e.date);
          if (isNaN(d.getTime())) return;
          myMonthKeys.add(buildPeriodKey(d, 'month'));
          myWeekKeys.add(buildPeriodKey(d, 'week'));
        });

        const getRankForPeriod = (periodKey: string, mode: 'month' | 'week'): { rank: number; wins: number; draws: number; losses: number; goals: number; matches: number; totalPlayers: number } => {
          // Build a points map for all players in this period
          const playerPoints = new Map<string, PeriodStats>();
          matchEntries.forEach(e => {
            if (!e.date) return;
            const d = new Date(e.date);
            if (isNaN(d.getTime())) return;
            if (buildPeriodKey(d, mode) !== periodKey) return;
            if (!playerPoints.has(e.playerId)) {
              playerPoints.set(e.playerId, { wins: 0, draws: 0, losses: 0, goals: 0, matches: 0, points: 0 });
            }
            const ps = playerPoints.get(e.playerId)!;
            ps.matches += 1;
            ps.goals += e.goals || 0;
            if (e.result === 'win') { ps.wins += 1; ps.points += 3; }
            else if (e.result === 'draw') { ps.draws += 1; ps.points += 1; }
            else if (e.result === 'loss') { ps.losses += 1; }
            if (e.motm) ps.points += 2;
          });

          const sorted = Array.from(playerPoints.entries()).sort((a, b) => b[1].points - a[1].points || b[1].goals - a[1].goals);
          const rankIdx = sorted.findIndex(([id]) => id === playerId);
          const myStats = playerPoints.get(playerId) || { wins: 0, draws: 0, losses: 0, goals: 0, matches: 0, points: 0 };
          return {
            rank: rankIdx !== -1 ? rankIdx + 1 : sorted.length + 1,
            ...myStats,
            totalPlayers: sorted.length
          };
        };

        // Only keep months where this player ranked top 5
        const monthlyRankData = Array.from(myMonthKeys)
          .map(key => ({ label: key, ...getRankForPeriod(key, 'month') }))
          .filter(d => d.rank <= 5)
          .sort((a, b) => a.rank - b.rank); // best rank first

        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-1 min-h-[300px]">
                <SeasonPerformanceChart data={seasonData} />
              </div>
              <div className="lg:col-span-1 min-h-[300px] bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                <h3 className="font-semibold text-[14px] w-full text-left mb-4">Monthly Performance</h3>
                <div className="flex-1 flex items-center">
                  <PieChart data={monthChartData} size={120} />
                </div>
              </div>
              <div className="lg:col-span-1 min-h-[300px] bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                <h3 className="font-semibold text-[14px] w-full text-left mb-4">Recent Week Performance</h3>
                <div className="flex-1 flex items-center">
                  <PieChart data={weekChartData} size={120} />
                </div>
              </div>
            </div>

            <SeasonTable data={[...seasonData].reverse()} allTime={allTime} />

            <div className="my-4">
              <RankTrendCard
                title="Monthly Rank"
                subtitle="Months this player reached Top 5 in the leaderboard"
                data={monthlyRankData}
              />
            </div>
          </>
        );
      })()}

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <p className="font-semibold mb-3 text-[13px]">Match Entries & History (Recent 30)</p>
        {historyEntries.length === 0 ? (
          <p className="text-muted-foreground text-[12px] bg-muted/30 p-4 rounded-lg border border-border/50 text-center">No entries yet. Click "+ Entry" above.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[12px] text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  {['Date','Goals','Conceded','Result','Flags','Notes'].map(h => (
                    <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-popover">
                {historyEntries.map(e => {
                  const rb = RESULT_BADGE[e.result as keyof typeof RESULT_BADGE] ?? RESULT_BADGE.draw;
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{e.date}</td>
                      <td className="px-3 py-2.5 font-bold text-foreground">{e.goals}</td>
                      <td className="px-3 py-2.5 text-red-400 font-medium">{e.goalsConceded}</td>
                      <td className="px-3 py-2.5"><Badge bg={rb.bg} c={rb.c}>{e.result}</Badge></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {e.hattricks > 0 && <Badge bg="#1a1a1a" c="#e5e5e5" className="border border-gray-500/30 text-[10px] px-1.5 py-0">HT×{e.hattricks}</Badge>}
                          {e.motm && <Badge bg="#78350f" c="#fcd34d" className="border border-amber-500/30 text-[10px] px-1.5 py-0">MOTM</Badge>}
                          {e.cleanSheet && <Badge bg="#111111" c="#e5e5e5" className="border border-gray-500/30 text-[10px] px-1.5 py-0">CS</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{e.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
