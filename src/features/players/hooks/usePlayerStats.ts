import { useMemo } from 'react';
import { useFootballStore } from '@/store/footballStore';

export function usePlayerStats(playerId: string) {
  const { playerSeasonStats } = useFootballStore();

  return useMemo(() => {
    // ── Source: playerSeasonStats (consolidated totals per player per season) ──
    const stats = playerSeasonStats.filter(s => s.playerId === playerId);

    const totalGoals         = stats.reduce((s, e) => s + (e.goals || 0), 0);
    const totalGoalsConceded = stats.reduce((s, e) => s + (e.goalsConceded || 0), 0);
    const totalMatches       = stats.reduce((s, e) => s + (e.appearances || 0), 0);
    const totalWins          = stats.reduce((s, e) => s + (e.wins || 0), 0);
    const totalLosses        = stats.reduce((s, e) => s + (e.losses || 0), 0);
    const totalDraws         = stats.reduce((s, e) => s + (e.draws || 0), 0);
    const totalMOTM          = stats.reduce((s, e) => s + (e.motmCount || 0), 0);
    const totalCleanSheets   = stats.reduce((s, e) => s + (e.cleansheets || 0), 0);
    const totalHattricks     = stats.reduce((s, e) => s + (e.hattricks || 0), 0);

    const seasonBreakdown = stats.map(s => {
      const yearMatch = (s.seasonName ?? '').match(/\d+/);
      const year = yearMatch ? Number(yearMatch[0]) : s.seasonId;
      return {
        year,
        goals: s.goals,
        matches: s.appearances,
      };
    }).sort((a, b) => b.year - a.year);

    return {
      totalGoals,
      totalGoalsConceded,
      totalMatches,
      totalWins,
      totalLosses,
      totalDraws,
      totalMOTM,
      totalCleanSheets,
      totalHattricks,
      seasonBreakdown,
      liveEntryBreakdown: [] as any[], // Keep as empty array for safety
    };
  }, [playerSeasonStats, playerId]);
}
