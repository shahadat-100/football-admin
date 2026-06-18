import { Player } from '@/features/players/types';
import { Match } from '@/features/matches/types';
import { MatchEntry } from '@/features/match-entries/types';
import { HOME_TEAM } from '@/shared/lib/constants';

/**
 * Returns the date range for a given year, month, and week number.
 * Week mapping:
 * Week 1 = days 1 - 7
 * Week 2 = days 8 - 14
 * Week 3 = days 15 - 21
 * Week 4 = days 22 - 28
 * Week 5 = remaining days of the month
 */
export function getWeekDateRange(year: number, month: number, week: number) {
  const startDate = new Date(year, month - 1, (week - 1) * 7 + 1);
  let endDate: Date;

  if (week < 5) {
    endDate = new Date(year, month - 1, week * 7);
  } else {
    // Week 5 is the remaining days
    endDate = new Date(year, month, 0); // Last day of the month
  }

  return { start: startDate, end: endDate };
}

/**
 * Distributes a total value into N parts that sum up to the total.
 * Used for goals, hattricks, etc.
 */
function distributeValue(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total % count;
  const result = Array(count).fill(base);
  for (let i = 0; i < remainder; i++) {
    result[i]++;
  }
  return result;
}

/**
 * Generates Match and MatchEntry objects for a player's bulk seasonal data.
 */
export function generateBulkMatchesForPlayer(player: Player): { matches: Match[], entries: MatchEntry[] } {
  const generatedMatches: Match[] = [];
  const generatedEntries: MatchEntry[] = [];

  player.seasons.forEach(season => {
    season.monthlyStats.forEach(monthStat => {
      if (monthStat.matches <= 0) return;

      const year = season.year;
      const month = monthStat.month;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Distribute results: wins, losses, draws
      const results: ('win' | 'loss' | 'draw')[] = [
        ...Array(monthStat.win).fill('win'),
        ...Array(monthStat.loss).fill('loss'),
        ...Array(monthStat.draw).fill('draw'),
      ];
      
      while (results.length < monthStat.matches) results.push('draw');
      const finalResults = results.slice(0, monthStat.matches);

      // Distribute stats
      const goalsScoredDist = distributeValue(monthStat.goalsScored, monthStat.matches);
      const goalsConcededDist = distributeValue(monthStat.goalsConceded, monthStat.matches);
      const hattricksDist = distributeValue(monthStat.hattricks, monthStat.matches);
      const motmDist = distributeValue(monthStat.motm, monthStat.matches);
      const cleanSheetDist = distributeValue(monthStat.cleanSheet, monthStat.matches);

      finalResults.forEach((result, idx) => {
        const step = Math.max(1, Math.floor(daysInMonth / monthStat.matches));
        const day = Math.min(daysInMonth, 1 + idx * step + (idx % 2)); // slight jitter
        
        const y = year;
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const matchId = `bulk-m-${player.id}-${year}-${month}-${idx}`;
        const entryId = `bulk-e-${player.id}-${year}-${month}-${idx}`;

        let hScore = goalsScoredDist[idx];
        let aScore = goalsConcededDist[idx];

        if (result === 'win' && hScore <= aScore) {
          hScore = aScore + 1;
        } else if (result === 'loss' && hScore >= aScore) {
          aScore = hScore + 1;
        } else if (result === 'draw' && hScore !== aScore) {
          hScore = aScore;
        }

        generatedMatches.push({
          id: matchId,
          homeTeam: HOME_TEAM as any,
          awayTeam: 'Opponent',
          homeScore: hScore,
          awayScore: aScore,
          date: dateStr,
          competition: 'Bulk Season',
          status: 'finished'
        });

        generatedEntries.push({
          id: entryId,
          playerId: player.id,
          matchId: matchId,
          goals: hScore,
          goalsConceded: aScore,
          result: result,
          hattricks: hattricksDist[idx] > 0 ? hattricksDist[idx] : 0,
          cleanSheet: cleanSheetDist[idx] > 0,
          motm: motmDist[idx] > 0,
          date: dateStr,
          notes: `Generated from ${year} Month ${month}`
        });
      });
    });
  });

  return { matches: generatedMatches, entries: generatedEntries };
}

