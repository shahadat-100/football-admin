import { useEffect, useState, useMemo } from 'react';
import { Avatar } from '@/shared/components';
import { Player, PlayerSeasonStat, SeasonDb } from '@/features/players/types';
import { MatchEntry } from '@/features/match-entries/types';
import { PlayerFormDots } from './PlayerFormDots';

interface TopScorersBarsProps {
  players: Player[];
  playerSeasonStats: PlayerSeasonStat[];
  seasons: SeasonDb[];
  matchEntries: MatchEntry[];
}

export function TopScorersBars({ players, playerSeasonStats, seasons, matchEntries }: TopScorersBarsProps) {
  const [animate, setAnimate] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  // Re-animate bars whenever season changes
  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 60);
    return () => clearTimeout(timer);
  }, [selectedSeasonId]);

  const scorers = useMemo(() => {
    return players
      .map(p => {
        const stats = playerSeasonStats.filter(s =>
          s.playerId === p.id &&
          (selectedSeasonId === null || s.seasonId === selectedSeasonId)
        );
        const goals = stats.reduce((acc, s) => acc + (s.goals || 0), 0);

        // Form dots always show last 5 results regardless of season filter
        const form = matchEntries
          .filter(e => e.playerId === p.id && e.result)
          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
          .slice(0, 5)
          .map(e => e.result!)
          .reverse();

        return { player: p, goals, form };
      })
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)
      .filter(s => s.goals > 0);
  }, [players, playerSeasonStats, matchEntries, selectedSeasonId]);

  const maxGoals = Math.max(...scorers.map(s => s.goals), 1);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="font-semibold text-base text-foreground">Top Scorers</p>
        <select
          value={selectedSeasonId ?? ''}
          onChange={e => setSelectedSeasonId(e.target.value === '' ? null : Number(e.target.value))}
          className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="">All Seasons</option>
          {seasons.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {scorers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No goal data yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {scorers.map(({ player, goals, form }, i) => {
            const widthPercent = (goals / maxGoals) * 100;
            return (
              <div key={player.id} className="flex items-center gap-3 group">
                <div className="font-medium text-muted-foreground/70 w-4 text-xs text-right shrink-0">{i + 1}</div>
                <Avatar name={player.name} size={32} src={(player as any).profileImageUrl} />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm font-medium text-foreground truncate">{player.name}</span>
                      {form.length > 0 && <PlayerFormDots results={form} />}
                    </div>
                    <span className="text-sm font-bold text-foreground">{goals}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: animate ? `${widthPercent}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
