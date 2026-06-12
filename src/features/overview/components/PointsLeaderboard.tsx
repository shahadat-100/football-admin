import { useMemo } from 'react';
import { Player } from '@/features/players/types';
import { MatchEntry } from '@/features/match-entries/types';
import { Avatar } from '@/shared/components';
import { cn } from '@/shared/lib/cn';

interface PointsLeaderboardProps {
  players: Player[];
  matchEntries: MatchEntry[];
}

interface RankedPlayer {
  player: Player;
  points: number;
}

export function PointsLeaderboard({ players, matchEntries }: PointsLeaderboardProps) {
  const { weeklyRanking, monthlyRanking, overallRanking } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Determine current active week bucket
    let activeWeekStart = 1;
    let activeWeekEnd = 7;
    let activeWeekName = 'Week 1';
    
    if (currentDay >= 8 && currentDay <= 14) {
      activeWeekStart = 8;
      activeWeekEnd = 14;
      activeWeekName = 'Week 2';
    } else if (currentDay >= 15 && currentDay <= 21) {
      activeWeekStart = 15;
      activeWeekEnd = 21;
      activeWeekName = 'Week 3';
    } else if (currentDay >= 22) {
      activeWeekStart = 22;
      activeWeekEnd = 31;
      activeWeekName = 'Week 4';
    }

    // Helper to calculate points for an array of entries
    const calcPoints = (entries: MatchEntry[]) => {
      return entries.reduce((total, e) => {
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
    };

    const overallMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const weeklyMap = new Map<string, number>();

    // Initialize maps
    players.forEach(p => {
      overallMap.set(p.id, 0);
      monthlyMap.set(p.id, 0);
      weeklyMap.set(p.id, 0);
    });

    matchEntries.forEach(entry => {
      if (!entry.date) return;
      const d = new Date(entry.date);
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isCurrentWeek = isCurrentMonth && d.getDate() >= activeWeekStart && d.getDate() <= activeWeekEnd;

      const pts = calcPoints([entry]);

      if (overallMap.has(entry.playerId)) {
        overallMap.set(entry.playerId, overallMap.get(entry.playerId)! + pts);
      }
      if (isCurrentMonth && monthlyMap.has(entry.playerId)) {
        monthlyMap.set(entry.playerId, monthlyMap.get(entry.playerId)! + pts);
      }
      if (isCurrentWeek && weeklyMap.has(entry.playerId)) {
        weeklyMap.set(entry.playerId, weeklyMap.get(entry.playerId)! + pts);
      }
    });

    const toSortedList = (map: Map<string, number>): RankedPlayer[] => {
      return Array.from(map.entries())
        .map(([id, points]) => ({
          player: players.find(p => p.id === id)!,
          points
        }))
        .filter(x => x.player) // safety
        .sort((a, b) => b.points - a.points);
    };

    return {
      weeklyRanking: { name: activeWeekName, list: toSortedList(weeklyMap) },
      monthlyRanking: { name: today.toLocaleString('default', { month: 'long' }), list: toSortedList(monthlyMap) },
      overallRanking: { name: 'Overall', list: toSortedList(overallMap) }
    };
  }, [players, matchEntries]);

  const renderColumn = (title: string, subtitle: string, ranking: RankedPlayer[]) => (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
        <h3 className="font-semibold text-base text-foreground">{title}</h3>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{subtitle}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {ranking.length === 0 || ranking.every(r => r.points === 0) ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No points yet</p>
          </div>
        ) : (
          ranking.slice(0, 15).map((r, i) => {
            if (r.points === 0 && i >= 5) return null; // Only show top 5 if 0 points
            return (
              <div key={r.player.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                <div className={cn(
                  "font-bold w-5 text-center text-sm",
                  i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground/50"
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
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      {renderColumn('Weekly Points', weeklyRanking.name, weeklyRanking.list)}
      {renderColumn('Monthly Points', monthlyRanking.name, monthlyRanking.list)}
      {renderColumn('Overall Points', overallRanking.name, overallRanking.list)}
    </div>
  );
}
