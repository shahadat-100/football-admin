import { useMemo } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { sumField } from '@/shared/lib/utils';
import { StatCard } from '@/features/overview/components/StatCard';
import { Avatar, Badge } from '@/shared/components';
import { STATUS_BADGE } from '@/shared/lib/constants';

interface OverviewProps {
  setTab: (tab: string) => void;
}

export function Overview({ setTab }: OverviewProps) {
  const { players, matchEntries, matches, news } = useFootballStore();
  
  const totalGoals = sumField(matchEntries, 'goals');
  const totalWins = matchEntries.filter(e => e.result === 'win').length;

  const topScorers = useMemo(() => {
    return players.map(p => ({
      player: p,
      goals: sumField(matchEntries.filter(me => me.playerId === p.id), 'goals')
    })).sort((a, b) => b.goals - a.goals).slice(0, 5);
  }, [players, matchEntries]);

  const cards = [
    { label: 'Players', value: players.length, tab: 'players', color: '#6366f1' },
    { label: 'Match entries', value: matchEntries.length, tab: 'entries', color: '#8b5cf6' },
    { label: 'Matches', value: matches.length, tab: 'matches', color: '#3b82f6' },
    { label: 'Total live goals', value: totalGoals, tab: 'entries', color: '#10b981' },
    { label: 'Live wins', value: totalWins, tab: 'entries', color: '#f59e0b' },
    { label: 'News articles', value: news.length, tab: 'news', color: '#ec4899' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="font-bold text-[22px] mb-1">Overview</h2>
      <p className="text-muted-foreground text-[13px] mb-6">Quick summary of all data in the system</p>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map(c => (
          <StatCard key={c.label} label={c.label} value={c.value} accent={c.color} onClick={() => setTab(c.tab)} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="font-semibold text-[14px] mb-4">Top Scorers (Live Entries)</p>
          {topScorers.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">No data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topScorers.map(({ player, goals }, i) => (
                <div key={player.id} className="flex items-center gap-4 bg-muted/40 p-2.5 rounded-lg border border-border/40 hover:bg-muted/60 transition-colors">
                  <div className="font-bold text-muted-foreground w-4 text-[12px] text-center">{i + 1}</div>
                  <Avatar name={player.name} size={36} src={player.profileImage} />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold">{player.name}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{player.position}</p>
                  </div>
                  <span className="font-black text-cyan-400 text-[18px] mr-2">{goals}</span>
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
