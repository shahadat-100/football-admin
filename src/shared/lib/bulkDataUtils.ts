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
      monthStat.weeklyStats.forEach(weekStat => {
        if (weekStat.matches <= 0) return;

        const { start, end } = getWeekDateRange(season.year, monthStat.month, weekStat.week);
        const daysInWeek = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
        
        // Distribute results: wins, losses, draws
        const results: ('win' | 'loss' | 'draw')[] = [
          ...Array(weekStat.win).fill('win'),
          ...Array(weekStat.loss).fill('loss'),
          ...Array(weekStat.draw).fill('draw'),
        ];
        
        // If results don't match matches count, pad with draws or trim
        while (results.length < weekStat.matches) results.push('draw');
        const finalResults = results.slice(0, weekStat.matches);

        // Distribute stats
        const goalsScoredDist = distributeValue(weekStat.goalsScored, weekStat.matches);
        const goalsConcededDist = distributeValue(weekStat.goalsConceded, weekStat.matches);
        const hattricksDist = distributeValue(weekStat.hattricks, weekStat.matches);
        const motmDist = distributeValue(weekStat.motm, weekStat.matches);
        const cleanSheetDist = distributeValue(weekStat.cleanSheet, weekStat.matches);

        finalResults.forEach((result, idx) => {
          // Generate a deterministic but distributed date within the week
          const dateOffset = (idx % daysInWeek);
          const matchDate = new Date(start);
          matchDate.setDate(start.getDate() + dateOffset);
          
          const y = matchDate.getFullYear();
          const m = String(matchDate.getMonth() + 1).padStart(2, '0');
          const d = String(matchDate.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;

          const matchId = `bulk-m-${player.id}-${season.year}-${monthStat.month}-${weekStat.week}-${idx}`;
          const entryId = `bulk-e-${player.id}-${season.year}-${monthStat.month}-${weekStat.week}-${idx}`;

          // Adjust scores to match result if necessary
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
            notes: `Generated from ${season.year} Month ${monthStat.month} Week ${weekStat.week}`
          });
        });
      });
    });
  });

  return { matches: generatedMatches, entries: generatedEntries };
}
