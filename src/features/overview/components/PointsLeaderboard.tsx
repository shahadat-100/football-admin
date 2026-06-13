import { useMemo, useState } from 'react';
import { Player, PlayerSeasonStat, SeasonDb } from '@/features/players/types';
import { MatchEntry } from '@/features/match-entries/types';
import { Avatar } from '@/shared/components';
import { cn } from '@/shared/lib/cn';

interface PointsLeaderboardProps {
  players: Player[];
  matchEntries: MatchEntry[];
  seasons: SeasonDb[];
  playerSeasonStats: PlayerSeasonStat[];
}

interface RankedPlayer {
  player: Player;
  points: number;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// Points from aggregated season stats (for Overall)
const calcSeasonPoints = (stats: PlayerSeasonStat[]): number =>
  stats.reduce((total, s) =>
    total + (s.wins * 3) + s.draws - s.losses + s.goals - s.goalsConceded + (s.motmCount * 2) + s.hattricks
  , 0);

// Points from individual match entries (for Weekly / Monthly)
const calcEntryPoints = (entries: MatchEntry[]): number =>
  entries.reduce((total, e) => {
    let pts = 0;
    if (e.result === 'win') pts += 3;
    else if (e.result === 'draw') pts += 1;
    else if (e.result === 'loss') pts -= 1;
    pts += (e.goals || 0);
    pts -= (e.goalsConceded || 0);
    pts += (e.motm ? 2 : 0);
    pts += (e.hattricks || 0);
    return total + pts;
  }, 0);

const today = new Date();
const currentMonthIndex = today.getMonth(); // 0-indexed
const currentYear = today.getFullYear();
const currentDay = today.getDate();

export function PointsLeaderboard({ players, matchEntries, seasons, playerSeasonStats }: PointsLeaderboardProps) {
  // ── Monthly filters ──
  const [selectedMonthlySeasonId, setSelectedMonthlySeasonId] = useState<number | null>(null);
  const [selectedMonthlyMonth, setSelectedMonthlyMonth]       = useState<number>(currentMonthIndex); // 0-indexed

  // ── Overall filter ──
  const [selectedOverallSeasonId, setSelectedOverallSeasonId] = useState<number | null>(null);

  const { weeklyRanking, monthlyRanking, overallRanking } = useMemo(() => {
    // Current week bucket
    let activeWeekStart = 1, activeWeekEnd = 7, activeWeekName = 'Week 1';
    if (currentDay >= 8  && currentDay <= 14) { activeWeekStart = 8;  activeWeekEnd = 14; activeWeekName = 'Week 2'; }
    else if (currentDay >= 15 && currentDay <= 21) { activeWeekStart = 15; activeWeekEnd = 21; activeWeekName = 'Week 3'; }
    else if (currentDay >= 22) { activeWeekStart = 22; activeWeekEnd = 31; activeWeekName = 'Week 4'; }

    const weeklyMap  = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const overallMap = new Map<string, number>();

    players.forEach(p => {
      weeklyMap.set(p.id, 0);
      monthlyMap.set(p.id, 0);
      overallMap.set(p.id, 0);
    });

    matchEntries.forEach(entry => {
      if (!entry.date) return;
      const d = new Date(entry.date);
      const pts = calcEntryPoints([entry]);

      // ── Weekly: always current week of current year ──
      const isCurrentWeek =
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonthIndex &&
        d.getDate() >= activeWeekStart &&
        d.getDate() <= activeWeekEnd;

      if (isCurrentWeek && weeklyMap.has(entry.playerId)) {
        weeklyMap.set(entry.playerId, weeklyMap.get(entry.playerId)! + pts);
      }

      // ── Monthly: filtered by season + month ──
      const isMonthMatch = d.getMonth() === selectedMonthlyMonth;
      const isSeasonOrYearMatch = selectedMonthlySeasonId !== null
        ? entry.seasonId === selectedMonthlySeasonId
        : d.getFullYear() === currentYear; // default: current year

      if (isMonthMatch && isSeasonOrYearMatch && monthlyMap.has(entry.playerId)) {
        monthlyMap.set(entry.playerId, monthlyMap.get(entry.playerId)! + pts);
      }
    });

    // ── Overall: from playerSeasonStats (includes historical) ──
    players.forEach(p => {
      const stats = playerSeasonStats.filter(s =>
        s.playerId === p.id &&
        (selectedOverallSeasonId === null || s.seasonId === selectedOverallSeasonId)
      );
      overallMap.set(p.id, calcSeasonPoints(stats));
    });

    const toSortedList = (map: Map<string, number>): RankedPlayer[] =>
      Array.from(map.entries())
        .map(([id, points]) => ({ player: players.find(p => p.id === id)!, points }))
        .filter(x => x.player)
        .sort((a, b) => b.points - a.points);

    const monthlySeasonLabel = selectedMonthlySeasonId
      ? seasons.find(s => s.id === selectedMonthlySeasonId)?.name ?? ''
      : currentYear.toString();

    return {
      weeklyRanking:  { name: activeWeekName, list: toSortedList(weeklyMap) },
      monthlyRanking: { label: `${MONTHS[selectedMonthlyMonth]} · ${monthlySeasonLabel}`, list: toSortedList(monthlyMap) },
      overallRanking: {
        name: selectedOverallSeasonId
          ? (seasons.find(s => s.id === selectedOverallSeasonId)?.name ?? 'Overall')
          : 'All Time',
        list: toSortedList(overallMap)
      },
    };
  }, [players, matchEntries, playerSeasonStats, seasons, selectedMonthlySeasonId, selectedMonthlyMonth, selectedOverallSeasonId]);

  const renderRow = (r: RankedPlayer, i: number) => (
    <div key={r.player.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
      <div className={cn(
        'font-bold w-5 text-center text-sm',
        i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground/50'
      )}>
        {i + 1}
      </div>
      <Avatar name={r.player.name} size={32} src={(r.player as any).profileImageUrl} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{r.player.name}</p>
      </div>
      <div className="font-bold text-sm bg-background px-2.5 py-1 rounded-md border border-border">
        {r.points > 0 ? `+${r.points}` : r.points}
      </div>
    </div>
  );

  const selectCls = "text-[11px] bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">

      {/* ── Weekly: no filter, always current week ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
        <div className="mb-4 border-b border-border pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-base text-foreground">Weekly Points</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {weeklyRanking.name}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
          {weeklyRanking.list.length === 0 || weeklyRanking.list.every(r => r.points === 0) ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No points yet</p>
            </div>
          ) : (
            weeklyRanking.list.slice(0, 15).map((r, i) => renderRow(r, i))
          )}
        </div>
      </div>

      {/* ── Monthly: season + month filters ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
        <div className="mb-4 border-b border-border pb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base text-foreground">Monthly Points</h3>
            <span className="text-[11px] text-muted-foreground">{monthlyRanking.label}</span>
          </div>
          {/* Two filter dropdowns */}
          <div className="flex gap-2">
            <select
              value={selectedMonthlySeasonId ?? ''}
              onChange={e => setSelectedMonthlySeasonId(e.target.value === '' ? null : Number(e.target.value))}
              className={selectCls + ' flex-1'}
            >
              <option value="">{currentYear} (Current)</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedMonthlyMonth}
              onChange={e => setSelectedMonthlyMonth(Number(e.target.value))}
              className={selectCls + ' flex-1'}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
          {monthlyRanking.list.length === 0 || monthlyRanking.list.every(r => r.points === 0) ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No points for this period</p>
            </div>
          ) : (
            monthlyRanking.list.slice(0, 15).map((r, i) => renderRow(r, i))
          )}
        </div>
      </div>

      {/* ── Overall: season filter ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
        <div className="mb-4 border-b border-border pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-base text-foreground">Overall Points</h3>
          <select
            value={selectedOverallSeasonId ?? ''}
            onChange={e => setSelectedOverallSeasonId(e.target.value === '' ? null : Number(e.target.value))}
            className={selectCls}
          >
            <option value="">All Time</option>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
          {overallRanking.list.length === 0 || overallRanking.list.every(r => r.points === 0) ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No points yet</p>
            </div>
          ) : (
            overallRanking.list.slice(0, 15).map((r, i) => renderRow(r, i))
          )}
        </div>
      </div>

    </div>
  );
}
