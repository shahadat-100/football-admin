import { useState, useMemo, useEffect } from 'react';
import { Player, MonthlyStat } from '../types';
import { Badge, Button, Modal, DeleteConfirm, PieChart } from '@/shared/components';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useFootballStore } from '@/store/footballStore';
import { supabase } from '@/lib/supabase';
import { PlayerForm } from './PlayerForm';
import { MatchEntryForm } from '@/features/match-entries/components/MatchEntryForm';
import { RESULT_BADGE } from '@/shared/lib/constants';
import { SeasonPerformanceChart } from './SeasonPerformanceChart';
import { RankTrendCard } from './RankTrendCard';
import { SeasonTable } from './SeasonTable';
import { PlayerHeroCard } from './PlayerHeroCard';

interface PlayerDetailProps {
  playerId: string;
  onBack: () => void;
}
export function PlayerDetail({ playerId, onBack }: PlayerDetailProps) {
  const { players, matchEntries, matches, playerSeasonStats, seasons, updatePlayer, removePlayer, addMatchEntry, repairPlayerMonthlyStats, recheckMilestones } = useFootballStore();
  const player = players.find(p => p.id === playerId);
  const stats = usePlayerStats(playerId);
  
  if (!player) {
    onBack();
    return null;
  }
  
  const [modal, setModal] = useState<'edit' | 'addEntry' | 'delete' | 'repairStats' | null>(null);
  const [repairSaving, setRepairSaving] = useState(false);
  const [repairValues, setRepairValues] = useState<Record<string, Record<string, any>>>({});
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [recheckResult, setRecheckResult] = useState<string | null>(null);

  const [playerAllEntries, setPlayerAllEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    let active = true;
    const fetchAllPlayerEntries = async () => {
      setLoadingEntries(true);
      try {
        const { data, error } = await supabase
          .from('match_entries')
          .select('*')
          .eq('playerid', playerId);
        if (error) throw error;
        if (active && data) {
          // Map database columns to MatchEntry format
          const mapped = data.map(e => ({
            id: e.id,
            playerId: e.playerid,
            matchId: e.matchid || '',
            goals: e.goals || 0,
            goalsConceded: e.goalsconceded || 0,
            result: e.result,
            hattricks: e.hattricks || 0,
            cleanSheet: e.cleansheet || false,
            motm: e.motm || false,
            date: e.date || '',
            time: e.time || null,
            notes: e.notes || '',
            seasonId: e.season_id,
          }));
          setPlayerAllEntries(mapped);
        }
      } catch (err) {
        console.error('Error fetching all player entries:', err);
      } finally {
        if (active) setLoadingEntries(false);
      }
    };
    fetchAllPlayerEntries();
    return () => {
      active = false;
    };
  }, [playerId, matchEntries]);

  const entries = playerAllEntries;

  // Group player months from match entries
  const playerMonths = useMemo(() => {
    const result: {
      seasonId: number;
      seasonName: string;
      year: number;
      months: {
        month: number;
        monthName: string;
        matches: number;
        win: number;
        draw: number;
        loss: number;
        goalsScored: number;
        goalsConceded: number;
        cleanSheet: number;
        motm: number;
        hattricks: number;
        matchDates: string[];
      }[];
    }[] = [];

    for (const season of seasons) {
      const seasonEntries = entries.filter(e => e.seasonId === season.id);
      const hasSeasonStats = playerSeasonStats.some(s => s.playerId === playerId && s.seasonId === season.id);
      if (seasonEntries.length === 0 && !hasSeasonStats) continue;

      let year = new Date(season.start_date).getFullYear();
      if (isNaN(year)) {
        const match = season.name.match(/\d{4}/);
        year = match ? parseInt(match[0]) : new Date().getFullYear();
      }

      const monthsList = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const mEntries = seasonEntries.filter(e => {
          if (!e.date) return false;
          const monthPart = parseInt(e.date.split('-')[1]);
          return monthPart === m;
        });

        const win = mEntries.filter(e => e.result === 'win').length;
        const draw = mEntries.filter(e => e.result === 'draw').length;
        const loss = mEntries.filter(e => e.result === 'loss').length;
        const goalsScored = mEntries.reduce((sum, e) => sum + (e.goals || 0), 0);
        const goalsConceded = mEntries.reduce((sum, e) => sum + (e.goalsConceded || 0), 0);
        const cleanSheet = mEntries.filter(e => e.cleanSheet).length;
        const motm = mEntries.filter(e => e.motm).length;
        const hattricks = mEntries.reduce((sum, e) => sum + (e.hattricks || 0), 0);
        const matchDates = mEntries.map(e => e.date).filter(Boolean).sort();

        const monthNames = [
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
        ];

        return {
          month: m,
          monthName: monthNames[m - 1],
          matches: mEntries.length,
          win,
          draw,
          loss,
          goalsScored,
          goalsConceded,
          cleanSheet,
          motm,
          hattricks,
          matchDates
        };
      });

      result.push({
        seasonId: season.id,
        seasonName: season.name,
        year,
        months: monthsList
      });
    }
    return result;
  }, [entries, seasons, playerSeasonStats, playerId]);

  // ── Repair Stats: initialize editable values from current DB stats ──
  const getRepairVal = (seasonId: number, month: number, field: string, fallback: any) => {
    const key = `${seasonId}_${month}`;
    return repairValues[key]?.[field] ?? fallback;
  };
  const setRepairVal = (seasonId: number, month: number, field: string, val: any) => {
    const key = `${seasonId}_${month}`;
    setRepairValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? {}),
        [field]: val
      }
    }));
  };

  const handleRepairSave = async () => {
    setRepairSaving(true);
    try {
      for (const key of Object.keys(repairValues)) {
        const [seasonIdStr, monthStr] = key.split('_');
        const seasonId = parseInt(seasonIdStr);
        const month = parseInt(monthStr);
        if (isNaN(seasonId) || isNaN(month)) continue;

        const sObj = playerMonths.find(s => s.seasonId === seasonId);
        const mObj = sObj?.months.find(m => m.month === month);
        if (!mObj || !sObj) continue;

        const target: MonthlyStat = {
          month,
          matches: getRepairVal(seasonId, month, 'matches', mObj.matches),
          win: getRepairVal(seasonId, month, 'win', mObj.win),
          draw: getRepairVal(seasonId, month, 'draw', mObj.draw),
          loss: getRepairVal(seasonId, month, 'loss', mObj.loss),
          goalsScored: getRepairVal(seasonId, month, 'goalsScored', mObj.goalsScored),
          goalsConceded: getRepairVal(seasonId, month, 'goalsConceded', mObj.goalsConceded),
          cleanSheet: getRepairVal(seasonId, month, 'cleanSheet', mObj.cleanSheet),
          motm: getRepairVal(seasonId, month, 'motm', mObj.motm),
          hattricks: getRepairVal(seasonId, month, 'hattricks', mObj.hattricks),
          matchDates: getRepairVal(seasonId, month, 'matchDates', mObj.matchDates)
        };

        if (target.matches > 0 && (target.win + target.draw + target.loss) !== target.matches) {
          const monthName = mObj.monthName;
          alert(`Season ${sObj.seasonName} - ${monthName}:\nWins, Draws, and Losses (${target.win + target.draw + target.loss}) must exactly equal the number of matches (${target.matches}).`);
          setRepairSaving(false);
          return;
        }

        await repairPlayerMonthlyStats(playerId, seasonId, sObj.year, month, target);
      }
      setRepairValues({});
      setModal(null);
    } catch (e) {
      alert('Error saving: ' + (e as any)?.message);
    } finally {
      setRepairSaving(false);
    }
  };

  const allSortedEntries = [...entries]
    .sort((a, b) => {
      const dateTimeA = a.time ? `${a.date}T${a.time}` : (a.date ? `${a.date}T00:00:00` : '');
      const dateTimeB = b.time ? `${b.date}T${b.time}` : (b.date ? `${b.date}T00:00:00` : '');
      const dateA = new Date(dateTimeA).getTime();
      const dateB = new Date(dateTimeB).getTime();
      const validA = isNaN(dateA) ? 0 : dateA;
      const validB = isNaN(dateB) ? 0 : dateB;
      if (validA !== validB) return validB - validA;
      const numA = Number(a.id);
      const numB = Number(b.id);
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
      return String(b.id).localeCompare(String(a.id));
    });

  const totalPages = Math.max(1, Math.ceil(allSortedEntries.length / ITEMS_PER_PAGE));
  const historyEntries = allSortedEntries.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);




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

  // Points calculation helper (matching PointsLeaderboard)
  const calcSeasonPoints = (s: any) => 
    (s.wins * 10) + (s.draws * 5) - (s.losses * 3) + s.goals - s.goalsConceded + (s.motmCount * 4) + s.hattricks;

  // Compute Leaderboard Rank based on total points
  const currentRank = useMemo(() => {
    const playerRanks = players.map(p => {
      let totalPoints = 0;
      for (const s of playerSeasonStats) {
        if (s.playerId === p.id) {
          totalPoints += calcSeasonPoints(s);
        }
      }
      return { id: p.id, points: totalPoints };
    }).sort((a, b) => b.points - a.points);
    const rankIndex = playerRanks.findIndex(r => r.id === player.id);
    return rankIndex !== -1 ? rankIndex + 1 : undefined;
  }, [players, playerSeasonStats, player.id]);

  // Compute Current Season Rank
  const currentSeason = useMemo(() => seasons.find(s => s.is_current) || seasons[seasons.length - 1], [seasons]);
  const currentSeasonRank = useMemo(() => {
    if (!currentSeason) return undefined;
    const seasonRanks = players.map(p => {
      const pStats = playerSeasonStats.find(s => s.playerId === p.id && s.seasonId === currentSeason.id);
      return { id: p.id, points: pStats ? calcSeasonPoints(pStats) : 0 };
    }).sort((a, b) => b.points - a.points);
    const sRankIndex = seasonRanks.findIndex(r => r.id === player.id);
    return sRankIndex !== -1 ? sRankIndex + 1 : undefined;
  }, [players, playerSeasonStats, currentSeason, player.id]);

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

      {modal === 'repairStats' && (
        <Modal title={`🔧 Repair Monthly Stats — ${player.name}`} onClose={() => setModal(null)} isOpen wide>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <p className="text-[12px] text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              ⚠️ This will update or recreate the underlying match entries for the chosen month(s). Ensure Wins + Draws + Losses exactly equals Matches.
            </p>

            {playerMonths.length === 0 && (
              <p className="text-muted-foreground text-[13px] text-center py-6">No monthly stats found for this player.</p>
            )}

            {playerMonths.map(s => (
              <div key={s.seasonId} className="space-y-3">
                <h4 className="font-bold text-[14px] text-foreground border-b border-border pb-1 mt-2">
                  {s.seasonName}
                </h4>
                {s.months.map(m => (
                  <div key={`${s.seasonId}_${m.month}`} className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="bg-muted/50 px-4 py-2 border-b border-border flex justify-between items-center">
                      <span className="text-[12px] font-bold text-foreground">{m.monthName} {s.year}</span>
                      <span className="text-[10px] text-muted-foreground">({m.matches} matches)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-4">
                      {([
                        { key: 'matches',       label: 'Matches',        current: m.matches,       icon: '🎮' },
                        { key: 'win',           label: 'Wins',           current: m.win,           icon: '🏆' },
                        { key: 'draw',          label: 'Draws',          current: m.draw,          icon: '🤝' },
                        { key: 'loss',          label: 'Losses',         current: m.loss,          icon: '❌' },
                        { key: 'goalsScored',   label: 'Goals Scored',   current: m.goalsScored,   icon: '⚽' },
                        { key: 'goalsConceded', label: 'Goals Conceded', current: m.goalsConceded, icon: '🥅' },
                        { key: 'cleanSheet',    label: 'Clean Sheets',   current: m.cleanSheet,    icon: '🧤' },
                        { key: 'motm',          label: 'MOTM',           current: m.motm,          icon: '🏅' },
                        { key: 'hattricks',     label: 'Hat-tricks',     current: m.hattricks,     icon: '🎩' },
                      ] as const).map(({ key, label, current, icon }) => {
                        const val = getRepairVal(s.seasonId, m.month, key, current);
                        const isDirty = val !== current;
                        return (
                          <div key={key} className={`rounded-lg p-2 border transition-colors ${
                            isDirty ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-muted/30'
                          }`}>
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                              {icon} {label}
                              {isDirty && <span className="ml-1 text-amber-400">(changed)</span>}
                            </label>
                            <div className="text-[10px] text-muted-foreground mb-1">Current: <span className="font-bold text-foreground">{current}</span></div>
                            <input
                              type="number"
                              min={0}
                              value={val}
                              onChange={e => setRepairVal(s.seasonId, m.month, key, parseInt(e.target.value) || 0)}
                              className="bg-input border border-border text-foreground px-2 py-1 rounded w-full text-[12px] font-bold"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setRepairValues({}); setModal(null); }}>Cancel</Button>
              <Button
                onClick={handleRepairSave}
                disabled={repairSaving || Object.keys(repairValues).length === 0}
              >
                {repairSaving ? 'Saving…' : '💾 Save Changes'}
              </Button>
            </div>
          </div>
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

      {/* ── Player Overview Hero Card ─────────────────────────── */}
      <PlayerHeroCard
        player={player}
        stats={stats}
        historyEntries={historyEntries}
        currentRank={currentRank}
        currentSeasonRank={currentSeasonRank}
        currentSeason={currentSeason}
        onEdit={() => setModal('edit')}
        onAddEntry={() => setModal('addEntry')}
        onRepair={() => { setRepairValues({}); setModal('repairStats'); }}
        onMilestones={async () => {
          setRecheckLoading(true);
          setRecheckResult(null);
          try {
            const { fired } = await recheckMilestones(player.id);
            setRecheckResult(fired ? '✅ New milestones fired! Check News.' : '✅ Done — no new milestones.');
          } catch (e) {
            setRecheckResult('❌ Error: ' + (e as any)?.message);
          } finally {
            setRecheckLoading(false);
            setTimeout(() => setRecheckResult(null), 5000);
          }
        }}
        onDelete={() => setModal('delete')}
        recheckLoading={recheckLoading}
        recheckResult={recheckResult}
      />

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
        const myMonthKeys = new Set<string>();
        entries.forEach(e => {
          if (!e.date) return;
          const d = new Date(e.date);
          if (isNaN(d.getTime())) return;
          myMonthKeys.add(d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
        });

        // Rank Trend Card removed to prioritize performance (avoiding 10k+ local match_entries dependency)
        const monthlyRankData: any[] = [];

        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1 min-h-[320px]">
                <SeasonPerformanceChart data={seasonData} />
              </div>
              <div className="lg:col-span-1 min-h-[320px] bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3" />
                <h3 className="font-bold text-[18px] tracking-tight w-full text-left mb-6">Monthly Performance</h3>
                <div className="flex-1 flex items-center justify-center">
                  <PieChart data={monthChartData} size={140} />
                </div>
              </div>
              <div className="lg:col-span-1 min-h-[320px] bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3" />
                <h3 className="font-bold text-[18px] tracking-tight w-full text-left mb-6">Recent Week</h3>
                <div className="flex-1 flex items-center justify-center">
                  <PieChart data={weekChartData} size={140} />
                </div>
              </div>
            </div>

            <SeasonTable data={[...seasonData].reverse()} allTime={allTime} />

            {monthlyRankData.length > 0 && (
              <div className="my-4">
                <RankTrendCard
                  title="Monthly Rank"
                  subtitle="Months this player reached Top 5 in the leaderboard"
                  data={monthlyRankData}
                />
              </div>
            )}
          </>
        );
      })()}

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div>
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-[13px]">Match Entries & History</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-50 text-[11px] rounded"
              >
                Prev
              </button>
              <span className="text-[11px] text-muted-foreground">Page {historyPage} of {totalPages}</span>
              <button
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
                className="px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-50 text-[11px] rounded"
              >
                Next
              </button>
            </div>
          )}
        </div>
        {loadingEntries ? (
          <p className="text-muted-foreground text-[12px] bg-muted/30 p-4 rounded-lg border border-border/50 text-center animate-pulse">Loading history entries...</p>
        ) : historyEntries.length === 0 ? (
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
    </div>
  );
}
