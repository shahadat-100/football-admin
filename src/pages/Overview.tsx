import { useMemo } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { StatCard } from '@/features/overview/components/StatCard';
import { Avatar, Badge } from '@/shared/components';
import { STATUS_BADGE } from '@/shared/lib/constants';

interface OverviewProps {
  setTab: (tab: string) => void;
}

export function Overview({ setTab }: OverviewProps) {
  const { players, matchEntries, matches } = useFootballStore();

  // ── Club-wide totals: live match entries ─────────────────────────
  const liveGoals   = matchEntries.reduce((s, e) => s + e.goals, 0);
  const liveMatches = matchEntries.length;
  const liveWins    = matchEntries.filter(e => e.result === 'win').length;
  const liveLosses  = matchEntries.filter(e => e.result === 'loss').length;
  const liveDraws   = matchEntries.filter(e => e.result === 'draw').length;

  // ── Club-wide totals: historical season data across all players ──
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

  // ── All-time club totals ─────────────────────────────────────────
  const totalGoals   = liveGoals   + histGoals;
  const totalMatches = liveMatches + histMatches;
  const totalWins    = liveWins    + histWins;
  const totalLosses  = liveLosses  + histLosses;
  const totalDraws   = liveDraws   + histDraws;

  // ── All-time top scorers per player (live + historical) ──────────
  const topScorers = useMemo(() => {
    return players.map(p => {
      const liveG = matchEntries
        .filter(me => me.playerId === p.id)
        .reduce((s, e) => s + e.goals, 0);
      const histG = (p.seasons ?? [])
        .flatMap(s => s.monthlyStats.flatMap(m => m.weeklyStats))
        .reduce((s, w) => s + w.goalsScored, 0);
      return { player: p, goals: liveG + histG };
    }).sort((a, b) => b.goals - a.goals).slice(0, 5);
  }, [players, matchEntries]);

  const cards = [
    { label: 'Total Goals', value: totalGoals, tab: 'entries', color: '#c8102e' },
    { label: 'Total Matches', value: totalMatches, tab: 'matches', color: '#1a1a1a' },
    { label: 'Total Wins', value: totalWins, tab: 'entries', color: '#10b981' },
    { label: 'Total Losses', value: totalLosses, tab: 'entries', color: '#ef4444' },
    { label: 'Total Draws', value: totalDraws, tab: 'entries', color: '#f59e0b' },
    { label: 'Players', value: players.length, tab: 'players', color: '#333333' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-10">
        <h2 className="font-semibold text-2xl tracking-tight text-foreground mb-2">The Enigmatic Elites — Overview</h2>
        <p className="text-muted-foreground text-sm">Complete club record — live &amp; all-time historical data combined</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
        {cards.map(c => (
          <StatCard key={c.label} label={c.label} value={c.value} accent={c.color} onClick={() => setTab(c.tab)} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
          <p className="font-semibold text-base mb-6 text-foreground">Top Scorers (All Time)</p>
          {topScorers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topScorers.map(({ player, goals }, i) => (
                <div key={player.id} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group transition-colors">
                  <div className="font-medium text-muted-foreground/70 w-5 text-xs text-center">{i + 1}</div>
                  <Avatar name={player.name} size={40} src={(player as any).profileImageUrl} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{player.name}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">{player.playerRoles?.[0]}</p>
                  </div>
                  <span className="font-semibold text-foreground text-lg mr-2">{goals}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
          <p className="font-semibold text-base mb-6 text-foreground">Recent Matches</p>
          {matches.length === 0 ? (
            <p className="text-muted-foreground text-sm">No matches yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {([...matches].reverse().slice(0, 5)).map(m => {
                const sb = STATUS_BADGE[m.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.finished;
                return (
                  <div key={m.id} className="py-4 border-b border-border/50 last:border-0 group transition-colors">
                    <div className="flex justify-between items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-foreground">{m.homeTeam} vs {m.awayTeam}</span>
                      <Badge bg={sb.bg} c={sb.c}>{m.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.competition} · {m.date}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
