import { useMemo } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { StatCard } from '@/features/overview/components/StatCard';
import { Avatar, Badge } from '@/shared/components';
import { STATUS_BADGE } from '@/shared/lib/constants';

interface OverviewProps {
  setTab: (tab: string) => void;
}

export function Overview({ setTab }: OverviewProps) {
  const { players, matchEntries, matches, news } = useFootballStore();

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
      <h2 className="font-bold text-[22px] mb-1">The Enigmatic Elites — Overview</h2>
      <p className="text-muted-foreground text-[13px] mb-6">Complete club record — live &amp; all-time historical data combined</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map(c => (
          <StatCard key={c.label} label={c.label} value={c.value} accent={c.color} onClick={() => setTab(c.tab)} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="font-semibold text-[14px] mb-4">Top Scorers (All Time)</p>
          {topScorers.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">No data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topScorers.map(({ player, goals }, i) => (
                <div key={player.id} className="flex items-center gap-4 bg-muted/40 p-2.5 rounded-lg border border-border/40 hover:bg-muted/60 transition-colors">
                  <div className="font-bold text-muted-foreground w-4 text-[12px] text-center">{i + 1}</div>
                  <Avatar name={player.name} size={36} src={(player as any).profileImage} />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold">{player.name}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{(player as any).position}</p>
                  </div>
                  <span className="font-black text-gray-100 text-[18px] mr-2">{goals}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="font-semibold text-[14px] mb-4">Recent Matches</p>
          {matches.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">No matches yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {([...matches].reverse().slice(0, 5)).map(m => {
                const sb = STATUS_BADGE[m.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.finished;
                return (
                  <div key={m.id} className="p-3 bg-muted/40 rounded-lg border border-border/40 hover:bg-muted/60 transition-colors">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[13px] font-semibold">{m.homeTeam} vs {m.awayTeam}</span>
                      <Badge bg={sb.bg} c={sb.c}>{m.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{m.competition} · {m.date}</p>
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
