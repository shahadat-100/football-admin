import { useMemo } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { StatCard } from '@/features/overview/components/StatCard';
import { Badge } from '@/shared/components';
import { STATUS_BADGE } from '@/shared/lib/constants';

// New visual components
import { WinRateDonut } from '@/features/overview/components/WinRateDonut';
import { TopScorersBars } from '@/features/overview/components/TopScorersBars';
import { AwardsLeaderboard } from '@/features/overview/components/AwardsLeaderboard';
import { ActivityTimeline } from '@/features/overview/components/ActivityTimeline';
import { PointsLeaderboard } from '@/features/overview/components/PointsLeaderboard';
import { MonthlyTopXI } from '@/features/overview/components/MonthlyTopXI';

interface OverviewProps {
  setTab: (tab: string) => void;
}

export function Overview({ setTab }: OverviewProps) {
  const { players, matchEntries, matches, playerSeasonStats, seasons } = useFootballStore();

  // ── 1. Stat Cards Data ──
  const liveGoals   = matchEntries.reduce((s, e) => s + e.goals, 0);
  const liveMatches = matchEntries.length;
  const liveWins    = matchEntries.filter(e => e.result === 'win').length;
  const liveLosses  = matchEntries.filter(e => e.result === 'loss').length;
  const liveDraws   = matchEntries.filter(e => e.result === 'draw').length;

  const histGoals = players.reduce((sum, p) =>
    sum + (p.seasons ?? [])
      .flatMap(s => s.monthlyStats.flatMap(m => m.weeklyStats))
      .reduce((s, w) => s + w.goalsScored, 0), 0);
  const histMatches = players.reduce((sum, p) =>
    sum + (p.seasons ?? [])
      .flatMap(s => s.monthlyStats.flatMap(m => m.weeklyStats))
      .reduce((s, w) => s + w.matches, 0), 0);
  const histWins = players.reduce((sum, p) =>
    sum + (p.seasons ?? [])
      .flatMap(s => s.monthlyStats.flatMap(m => m.weeklyStats))
      .reduce((s, w) => s + w.win, 0), 0);
  const histLosses = players.reduce((sum, p) =>
    sum + (p.seasons ?? [])
      .flatMap(s => s.monthlyStats.flatMap(m => m.weeklyStats))
      .reduce((s, w) => s + w.loss, 0), 0);
  const histDraws = players.reduce((sum, p) =>
    sum + (p.seasons ?? [])
      .flatMap(s => s.monthlyStats.flatMap(m => m.weeklyStats))
      .reduce((s, w) => s + w.draw, 0), 0);

  const totalGoals   = liveGoals   + histGoals;
  const totalMatches = liveMatches + histMatches;
  const totalWins    = liveWins    + histWins;
  const totalLosses  = liveLosses  + histLosses;
  const totalDraws   = liveDraws   + histDraws;

  const cards = [
    { label: 'Total Goals', value: totalGoals, tab: 'entries', color: '#c8102e' },
    { label: 'Total Matches', value: totalMatches, tab: 'matches', color: '#1a1a1a' },
    { label: 'Total Wins', value: totalWins, tab: 'entries', color: '#10b981' },
    { label: 'Total Losses', value: totalLosses, tab: 'entries', color: '#ef4444' },
    { label: 'Total Draws', value: totalDraws, tab: 'entries', color: '#f59e0b' },
    { label: 'Players', value: players.length, tab: 'players', color: '#333333' },
  ];

  // ── 2. Win / Draw / Loss Data ──
  // Use unique match IDs to calculate actual team W/D/L, not per-player entries
  const uniqueMatchesResults = useMemo(() => {
    // If we have actual match result status we would use `matches`, 
    // but right now matches table doesn't store outcome explicitly in the schema shown.
    // Instead we derive team win/draw/loss from matchEntries. 
    // Just looking at one player's result per match gives the team result.
    const matchResultsMap = new Map();
    matchEntries.forEach(e => {
      if (e.matchId && !matchResultsMap.has(e.matchId) && e.result) {
        matchResultsMap.set(e.matchId, e.result);
      }
    });
    
    let w = 0, d = 0, l = 0;
    matchResultsMap.forEach(res => {
      if (res === 'win') w++;
      if (res === 'draw') d++;
      if (res === 'loss') l++;
    });
    return { wins: w, draws: d, losses: l, matchResultsMap };
  }, [matchEntries]);

  // ── 3. Awards Data (MOTM / Clean Sheets / Hat-tricks) ──
  // topScorers is now computed inside TopScorersBars with season filter support
  const awardsData = useMemo(() => {
    return players.map(p => {
      const stats = playerSeasonStats.filter(s => s.playerId === p.id);
      return {
        player: p,
        goals: stats.reduce((acc, s) => acc + (s.goals || 0), 0),
        conceded: stats.reduce((acc, s) => acc + (s.goalsConceded || 0), 0),
        motm: stats.reduce((acc, s) => acc + (s.motmCount || 0), 0),
        cleanSheets: stats.reduce((acc, s) => acc + (s.cleansheets || 0), 0),
        hattricks: stats.reduce((acc, s) => acc + (s.hattricks || 0), 0),
        form: [] as string[],
      };
    });
  }, [players, playerSeasonStats]);

  // ── 4. Activity Timeline Data ──
  const matchDates = useMemo(() => {
    return matches.map(m => m.date).filter(Boolean) as string[];
  }, [matches]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-10">
        <h2 className="font-semibold text-2xl tracking-tight text-foreground mb-2">The Enigmatic Elites — Overview</h2>
        <p className="text-muted-foreground text-sm">Complete club record — live &amp; all-time historical data combined</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {cards.map(c => (
          <StatCard key={c.label} label={c.label} value={c.value} accent={c.color} onClick={() => setTab(c.tab)} />
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Row 1 */}
        <div className="lg:col-span-1 h-full">
          <WinRateDonut 
            wins={uniqueMatchesResults.wins || totalWins} 
            draws={uniqueMatchesResults.draws || totalDraws} 
            losses={uniqueMatchesResults.losses || totalLosses} 
          />
        </div>
        <div className="lg:col-span-2 h-full">
          <TopScorersBars
            players={players}
            playerSeasonStats={playerSeasonStats}
            seasons={seasons}
            matchEntries={matchEntries}
          />
        </div>

        {/* Row 3 */}
        <div className="lg:col-span-2 h-full">
          <AwardsLeaderboard data={awardsData} />
        </div>
        <div className="lg:col-span-1 h-full">
          <ActivityTimeline dates={matchDates} />
        </div>
      </div>

      {/* Points Leaderboards */}
      <div className="mb-8">
        <PointsLeaderboard
          players={players}
          matchEntries={matchEntries}
          seasons={seasons}
          playerSeasonStats={playerSeasonStats}
        />
      </div>

      {/* Monthly Top XI & Recent Matches Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 flex w-full min-w-0">
          <MonthlyTopXI players={players} matchEntries={matchEntries} />
        </div>
        
        <div className="xl:col-span-1 flex">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col w-full h-full max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="font-semibold text-base text-foreground tracking-tight">Recent Matches</p>
              <Badge bg="#1a1a1a" c="#e5e5e5">Live</Badge>
            </div>
            {matches.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center my-auto">No matches yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {([...matches].reverse().slice(0, 8)).map(m => {
                  const sb = STATUS_BADGE[m.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.finished;
                  const result = uniqueMatchesResults.matchResultsMap.get(m.id);
                  
                  return (
                    <div key={m.id} className="py-4 border-b border-border/50 last:border-0 group transition-colors">
                      <div className="flex justify-between items-center gap-4 mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[13px] font-bold text-foreground leading-tight">{m.homeTeam} <span className="text-muted-foreground font-normal mx-1">vs</span> {m.awayTeam}</span>
                          {m.status === 'finished' && result && (
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-sm tracking-wider ${
                              result === 'win' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                              result === 'draw' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {result === 'loss' ? 'lost' : result}
                            </span>
                          )}
                        </div>
                        <Badge bg={sb.bg} c={sb.c}>{m.status}</Badge>
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground">{m.competition} · {m.date}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
