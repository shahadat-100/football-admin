import { useState, useEffect, useMemo } from 'react';
import { Player, PlayerSeasonStat, SeasonDb } from '@/features/players/types';
import { Avatar } from '@/shared/components';
import { cn } from '@/shared/lib/cn';
import { useFootballStore } from '@/store/footballStore';
import { Loader2 } from 'lucide-react';

interface PointsLeaderboardProps {
  players: Player[];
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

const today = new Date();
const currentMonthIndex = today.getMonth(); // 0-indexed
const currentYear = today.getFullYear();
const currentDay = today.getDate();

export function PointsLeaderboard({ players, seasons, playerSeasonStats }: PointsLeaderboardProps) {
  const { fetchPlayerStatsPeriod } = useFootballStore();

  // ── Monthly filters ──
  const [selectedMonthlySeasonId, setSelectedMonthlySeasonId] = useState<number | null>(null);
  const [selectedMonthlyMonth, setSelectedMonthlyMonth]       = useState<number>(currentMonthIndex);

  // ── Overall filter ──
  const [selectedOverallSeasonId, setSelectedOverallSeasonId] = useState<number | null>(null);

  // ── State for async DB fetch ──
  const [weeklyRanking, setWeeklyRanking] = useState<{ name: string, list: RankedPlayer[] }>({ name: 'Week', list: [] });
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);

  const [monthlyRankingList, setMonthlyRankingList] = useState<RankedPlayer[]>([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true);

  // 1. Fetch Weekly Data
  useEffect(() => {
    let activeWeekStart = 1, activeWeekEnd = 7, activeWeekName = 'Week 1';
    if (currentDay >= 8  && currentDay <= 14) { activeWeekStart = 8;  activeWeekEnd = 14; activeWeekName = 'Week 2'; }
    else if (currentDay >= 15 && currentDay <= 21) { activeWeekStart = 15; activeWeekEnd = 21; activeWeekName = 'Week 3'; }
    else if (currentDay >= 22) { activeWeekStart = 22; activeWeekEnd = 31; activeWeekName = 'Week 4'; }

    // Use current month/year for the week
    const pad = (n: number) => n.toString().padStart(2, '0');
    const startStr = `${currentYear}-${pad(currentMonthIndex + 1)}-${pad(activeWeekStart)}`;
    const endStr = `${currentYear}-${pad(currentMonthIndex + 1)}-${pad(activeWeekEnd)}`;

    setIsWeeklyLoading(true);
    fetchPlayerStatsPeriod(startStr, endStr, null).then(data => {
      const list = data
        .map(d => ({ player: players.find(p => p.id === d.playerid)!, points: Number(d.points) }))
        .filter(x => x.player)
        .sort((a, b) => b.points - a.points);
      
      setWeeklyRanking({ name: activeWeekName, list });
      setIsWeeklyLoading(false);
    });
  }, [fetchPlayerStatsPeriod, players]);

  // 2. Fetch Monthly Data
  useEffect(() => {
    // If a season is selected, we could use the season's year, but let's stick to currentYear if not specified
    // Note: If they pick a season, we pass the seasonId to the RPC.
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    // Find last day of the selected month
    const lastDay = new Date(currentYear, selectedMonthlyMonth + 1, 0).getDate();
    const startStr = `${currentYear}-${pad(selectedMonthlyMonth + 1)}-01`;
    const endStr = `${currentYear}-${pad(selectedMonthlyMonth + 1)}-${pad(lastDay)}`;

    setIsMonthlyLoading(true);
    fetchPlayerStatsPeriod(startStr, endStr, selectedMonthlySeasonId).then(data => {
      const list = data
        .map(d => ({ player: players.find(p => p.id === d.playerid)!, points: Number(d.points) }))
        .filter(x => x.player)
        .sort((a, b) => b.points - a.points);
        
      setMonthlyRankingList(list);
      setIsMonthlyLoading(false);
    });
  }, [fetchPlayerStatsPeriod, players, selectedMonthlyMonth, selectedMonthlySeasonId]);

  // 3. Compute Overall Data (Synchronous)
  const overallRanking = useMemo(() => {
    const overallMap = new Map<string, number>();
    players.forEach(p => {
      const stats = playerSeasonStats.filter(s =>
        s.playerId === p.id &&
        (selectedOverallSeasonId === null || s.seasonId === selectedOverallSeasonId)
      );
      overallMap.set(p.id, calcSeasonPoints(stats));
    });

    const list = Array.from(overallMap.entries())
      .map(([id, points]) => ({ player: players.find(p => p.id === id)!, points }))
      .filter(x => x.player)
      .sort((a, b) => b.points - a.points);

    const name = selectedOverallSeasonId
      ? (seasons.find(s => s.id === selectedOverallSeasonId)?.name ?? 'Overall')
      : 'All Time';

    return { name, list };
  }, [players, playerSeasonStats, seasons, selectedOverallSeasonId]);

  const monthlySeasonLabel = selectedMonthlySeasonId
    ? seasons.find(s => s.id === selectedMonthlySeasonId)?.name ?? ''
    : currentYear.toString();
  const monthlyLabel = `${MONTHS[selectedMonthlyMonth]} · ${monthlySeasonLabel}`;


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

      {/* ── Weekly ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col h-[420px] relative">
        <div className="mb-4 border-b border-border pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-base text-foreground">Weekly Points</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {weeklyRanking.name}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
          {isWeeklyLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : weeklyRanking.list.length === 0 || weeklyRanking.list.every(r => r.points === 0) ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No points yet</p>
            </div>
          ) : (
            weeklyRanking.list.slice(0, 15).map((r, i) => renderRow(r, i))
          )}
        </div>
      </div>

      {/* ── Monthly ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col h-[420px] relative">
        <div className="mb-4 border-b border-border pb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base text-foreground">Monthly Points</h3>
            <span className="text-[11px] text-muted-foreground">{monthlyLabel}</span>
          </div>
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
          {isMonthlyLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : monthlyRankingList.length === 0 || monthlyRankingList.every(r => r.points === 0) ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No points for this period</p>
            </div>
          ) : (
            monthlyRankingList.slice(0, 15).map((r, i) => renderRow(r, i))
          )}
        </div>
      </div>

      {/* ── Overall ── */}
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
