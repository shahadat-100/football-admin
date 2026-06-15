
interface RankPeriod {
  label: string;
  rank: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  matches: number;
  totalPlayers: number;
}

interface RankTrendCardProps {
  title: string;
  subtitle: string;
  data: RankPeriod[];
}

const RANK_MEDAL: Record<number, { icon: string; color: string; bg: string }> = {
  1: { icon: '🥇', color: '#92400e', bg: '#fef3c7' },
  2: { icon: '🥈', color: '#374151', bg: '#f3f4f6' },
  3: { icon: '🥉', color: '#7c2d12', bg: '#ffedd5' },
};

export function RankTrendCard({ title, subtitle, data }: RankTrendCardProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="font-bold text-[16px]">{title}</h3>
        <p className="text-muted-foreground text-[12px] mb-4">{subtitle}</p>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[12px]">
          No match data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-[16px] text-foreground">{title}</h3>
        <p className="text-muted-foreground text-[12px]">{subtitle}</p>
      </div>

      {/* Period Cards */}
      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {data.map((period, i) => {
          const medal = RANK_MEDAL[period.rank];
          const isTop3 = period.rank <= 3;
          const winRate = period.matches > 0 ? Math.round((period.wins / period.matches) * 100) : 0;

          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              {/* Rank Badge */}
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-[15px] shadow-sm"
                style={
                  isTop3
                    ? { backgroundColor: medal.bg, color: medal.color }
                    : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
                }
              >
                {isTop3 ? medal.icon : `#${period.rank}`}
              </div>

              {/* Period Info */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[13px] font-bold text-foreground truncate leading-tight">{period.label}</span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {/* W/D/L pills */}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">{period.wins}W</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">{period.draws}D</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">{period.losses}L</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">⚽ {period.goals}</span>
                </div>
              </div>

              {/* Right: Rank text + win rate */}
              <div className="shrink-0 text-right">
                <div className="text-[11px] font-black text-foreground">
                  #{period.rank} <span className="font-normal text-muted-foreground text-[10px]">of {period.totalPlayers}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{winRate}% WR</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
