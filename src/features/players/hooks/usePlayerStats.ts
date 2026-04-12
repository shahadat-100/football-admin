import { useMemo } from 'react';
import { useFootballStore } from '@/store/footballStore';

export function usePlayerStats(playerId: string) {
  const { players, matchEntries } = useFootballStore();
  const player = players.find(p => p.id === playerId);

  return useMemo(() => {
    // ── Source 1: Old Season Bulk Stats ──────────────────────────
    const allWeeklyStats = player?.seasons?.flatMap(season =>
      season.monthlyStats.flatMap(month => month.weeklyStats)
    ) ?? [];

    const oldGoals         = allWeeklyStats.reduce((s, w) => s + w.goalsScored, 0);
    const oldGoalsConceded = allWeeklyStats.reduce((s, w) => s + w.goalsConceded, 0);
    const oldMatches       = allWeeklyStats.reduce((s, w) => s + w.matches, 0);
    const oldWins          = allWeeklyStats.reduce((s, w) => s + w.win, 0);
    const oldLosses        = allWeeklyStats.reduce((s, w) => s + w.loss, 0);
    const oldDraws         = allWeeklyStats.reduce((s, w) => s + w.draw, 0);
    const oldMOTM          = allWeeklyStats.reduce((s, w) => s + w.motm, 0);
    const oldCleanSheets   = allWeeklyStats.reduce((s, w) => s + w.cleanSheet, 0);
    const oldHattricks     = allWeeklyStats.reduce((s, w) => s + w.hattricks, 0);

    // ── Source 2: Live Match Entries ──────────────────────────────
    const entries = matchEntries.filter(me => me.playerId === playerId);

    const liveGoals         = entries.reduce((s, e) => s + e.goals, 0);
    const liveGoalsConceded = entries.reduce((s, e) => s + e.goalsConceded, 0);
    const liveMatches       = entries.length;
    const liveWins          = entries.filter(e => e.result === 'win').length;
    const liveLosses        = entries.filter(e => e.result === 'loss').length;
    const liveDraws         = entries.filter(e => e.result === 'draw').length;
    const liveMOTM          = entries.filter(e => e.motm).length;
    const liveCleanSheets   = entries.filter(e => e.cleanSheet).length;
    const liveHattricks     = entries.reduce((s, e) => s + e.hattricks, 0);

    // ── Merged Career Totals ──────────────────────────────────────
    return {
      totalGoals:         oldGoals         + liveGoals,
      totalGoalsConceded: oldGoalsConceded + liveGoalsConceded,
      totalMatches:       oldMatches       + liveMatches,
      totalWins:          oldWins          + liveWins,
      totalLosses:        oldLosses        + liveLosses,
      totalDraws:         oldDraws         + liveDraws,
      totalMOTM:          oldMOTM          + liveMOTM,
      totalCleanSheets:   oldCleanSheets   + liveCleanSheets,
      totalHattricks:     oldHattricks     + liveHattricks,

      // Season breakdown for display (old bulk seasons only)
      seasonBreakdown: (player?.seasons ?? []).map(season => ({
        year: season.year,
        goals: season.monthlyStats
          .flatMap(m => m.weeklyStats)
          .reduce((s, w) => s + w.goalsScored, 0),
        matches: season.monthlyStats
          .flatMap(m => m.weeklyStats)
          .reduce((s, w) => s + w.matches, 0),
      })),

      // Live entries grouped by year (for season breakdown display)
      liveEntryBreakdown: Object.entries(
        entries.reduce((acc, e) => {
          const year = new Date(e.date).getFullYear();
          if (!acc[year]) acc[year] = { goals: 0, matches: 0 };
          acc[year].goals   += e.goals;
          acc[year].matches += 1;
          return acc;
        }, {} as Record<number, { goals: number; matches: number }>)
      ).map(([year, stats]) => ({ year: Number(year), ...stats })),
    };
  }, [player, matchEntries, playerId]);
}
