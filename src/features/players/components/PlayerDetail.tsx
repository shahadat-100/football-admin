import { useState } from 'react';
import { Player } from '../types';
import { Avatar, Badge, Button, Modal, DeleteConfirm } from '@/shared/components';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useFootballStore } from '@/store/footballStore';
import { PlayerForm } from './PlayerForm';
import { MatchEntryForm } from '@/features/match-entries/components/MatchEntryForm';
import { RESULT_BADGE } from '@/shared/lib/constants';
import { PlayerRadarChart } from './PlayerRadarChart';
import { PlayerFormHistory } from './PlayerFormHistory';
import { SeasonPerformanceChart } from './SeasonPerformanceChart';
import { TrendChart } from './TrendChart';
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
    .slice(0, 50);

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
                        <span className="font-bold">{allTime.winRate.toFixed(0)}%</span>
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
        <h3 className="font-semibold text-[14px] mb-3 border-b border-border pb-2">Career Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[
            ['Matches', stats.totalMatches],
            ['Goals', stats.totalGoals],
            ['Goals Conceded', stats.totalGoalsConceded],
            ['Wins', stats.totalWins],
            ['Draws', stats.totalDraws],
            ['Losses', stats.totalLosses],
            ['MOTM', stats.totalMOTM],
            ['Clean Sheets', stats.totalCleanSheets],
            ['Hat-tricks', stats.totalHattricks]
          ].map(([l, v]) => (
            <div key={l as string} className="bg-popover border border-border rounded-lg p-3 shadow-inner">
              <p className="text-muted-foreground text-[11px] mb-1">{l}</p>
              <p className="text-[20px] font-bold text-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <PlayerFormHistory entries={entries} />

      {/* New Visualizations Section */}
      {(() => {
        // Prepare Data for SeasonPerformanceChart & SeasonTable
        const seasonData = stats.seasonBreakdown.map((sb, i) => {
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

        // Prepare Data for Monthly Trend (Using last 6 months of entries)
        const monthlyData: { label: string; value: number }[] = [];
        const weeklyData: { label: string; value: number }[] = [];
        if (historyEntries.length > 0) {
          // Group by Month
          const monthsMap = new Map<string, { points: number; count: number }>();
          const weeksMap = new Map<string, { points: number; count: number }>();
          
          [...historyEntries].reverse().forEach(e => {
            if (!e.date) return;
            const d = new Date(e.date);
            if (isNaN(d.getTime())) return;
            
            const monthKey = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
            if (!monthsMap.has(monthKey)) monthsMap.set(monthKey, { points: 0, count: 0 });
            monthsMap.get(monthKey)!.points += (e.result === 'win' ? 1 : 0);
            monthsMap.get(monthKey)!.count += 1;

            // Week logic
            const weekNum = Math.ceil(d.getDate() / 7);
            const weekKey = `W${weekNum} ${monthKey}`;
            if (!weeksMap.has(weekKey)) weeksMap.set(weekKey, { points: 0, count: 0 });
            weeksMap.get(weekKey)!.points += (e.result === 'win' ? 1 : 0);
            weeksMap.get(weekKey)!.count += 1;
          });

          // Convert to true win rate %
          Array.from(monthsMap.entries()).slice(-6).forEach(([label, data]) => {
            const winR = (data.points / data.count) * 100;
            monthlyData.push({ label, value: Math.round(winR) });
          });

          Array.from(weeksMap.entries()).slice(-8).forEach(([label, data]) => {
            const winR = (data.points / data.count) * 100;
            weeklyData.push({ label, value: Math.round(winR) });
          });
        }

        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-1 min-h-[300px]">
                <SeasonPerformanceChart data={seasonData} />
              </div>
              <div className="lg:col-span-1 min-h-[300px]">
                <TrendChart 
                  title="Monthly Trend" 
                  subtitle="Win rate % per month" 
                  data={monthlyData} 
                  currentRank={currentRank}
                  yAxisLabel="Win Rate %"
                />
              </div>
              <div className="lg:col-span-1 min-h-[300px]">
                <TrendChart 
                  title="Weekly Trend" 
                  subtitle="Win rate % per week" 
                  data={weeklyData} 
                  currentRank={currentRank}
                  yAxisLabel="Win Rate %"
                />
              </div>
            </div>

            <SeasonTable data={[...seasonData].reverse()} allTime={allTime} />
          </>
        );
      })()}



      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <p className="font-semibold mb-3 text-[13px]">Match Entries & History (Recent 50)</p>
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
