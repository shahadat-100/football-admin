import { useEffect, useState } from 'react';

interface SeasonData {
  season: string;
  goals: number;
  goalsConceded: number;
  winRate: number;
}

interface SeasonPerformanceChartProps {
  data: SeasonData[];
}

export function SeasonPerformanceChart({ data }: SeasonPerformanceChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm h-full flex flex-col backdrop-blur-md relative overflow-hidden">
        <h3 className="font-bold text-[18px] tracking-tight">Season Performance</h3>
        <p className="text-muted-foreground text-[13px] mb-4 font-medium">Goals, Conceded and Win Rate</p>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[13px]">
          No data available
        </div>
      </div>
    );
  }

  const height = 280;
  const width = 500;
  const padding = { top: 30, right: 25, bottom: 45, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Unified Y axis
  const maxStat = Math.max(10, ...data.map(d => Math.max(d.goals, d.goalsConceded)));
  const yMax = Math.ceil(maxStat * 1.2 / 10) * 10;

  const getY = (val: number, max: number) =>
    padding.top + innerHeight - (val / max) * innerHeight;
  const getH = (val: number, max: number) =>
    (val / max) * innerHeight;

  const step = innerWidth / data.length;
  const groupWidth = step * 0.7;
  const barW = groupWidth / 3;

  const getGroupX = (i: number) => padding.left + step * i + step * 0.15;

  const gridLines = 4;

  return (
    <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5 h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="mb-4 relative z-10">
        <h3 className="font-bold text-[18px] tracking-tight">Season Performance</h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground text-[12px] font-medium uppercase tracking-wider">Goals For · Goals Conceded · Win Rate %</p>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="spGF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="spGC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="spWR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const val = (yMax / gridLines) * i;
            const y = getY(val, yMax);
            return (
              <g key={`grid-${i}`} className="transition-opacity duration-1000 delay-300" style={{ opacity: mounted ? 1 : 0 }}>
                <line
                  x1={padding.left} y1={y}
                  x2={width - padding.right} y2={y}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text x={padding.left - 12} y={y} textAnchor="end" dominantBaseline="middle"
                  className="text-[10px] fill-muted-foreground font-medium">
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Win Rate secondary labels on right (0-100%) */}
          {[0, 25, 50, 75, 100].map((pct, i) => {
            const mappedVal = (pct / 100) * yMax;
            const y = getY(mappedVal, yMax);
            return (
              <text key={`wr-label-${i}`} x={width - padding.right + 12} y={y}
                textAnchor="start" dominantBaseline="middle"
                className="text-[10px] fill-[#10b981] font-bold transition-opacity duration-1000 delay-300"
                style={{ opacity: mounted ? 1 : 0 }}>
                {pct}%
              </text>
            );
          })}

          {/* Grouped Bars */}
          {data.map((d, i) => {
            const gx = getGroupX(i);
            const wrMapped = (d.winRate / 100) * yMax;
            const rx = barW / 2;

            return (
              <g key={`group-${i}`}>
                {/* Background tracks */}
                <rect x={gx}            y={getY(yMax, yMax)} width={barW} height={getH(yMax, yMax)} fill="currentColor" className="text-muted/20" rx={rx} />
                <rect x={gx + barW}     y={getY(yMax, yMax)} width={barW} height={getH(yMax, yMax)} fill="currentColor" className="text-muted/20" rx={rx} />
                <rect x={gx + barW * 2} y={getY(yMax, yMax)} width={barW} height={getH(yMax, yMax)} fill="currentColor" className="text-muted/20" rx={rx} />

                {/* Animated Bars */}
                <rect
                  x={gx} y={mounted ? getY(d.goals, yMax) : getY(0, yMax)}
                  width={barW} height={mounted ? getH(d.goals, yMax) : 0}
                  fill="url(#spGF)" rx={rx}
                  className="transition-all duration-1000 ease-out"
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
                <rect
                  x={gx + barW} y={mounted ? getY(d.goalsConceded, yMax) : getY(0, yMax)}
                  width={barW} height={mounted ? getH(d.goalsConceded, yMax) : 0}
                  fill="url(#spGC)" rx={rx}
                  className="transition-all duration-1000 ease-out"
                  style={{ transitionDelay: `${i * 100 + 100}ms` }}
                />
                <rect
                  x={gx + barW * 2} y={mounted ? getY(wrMapped, yMax) : getY(0, yMax)}
                  width={barW} height={mounted ? getH(wrMapped, yMax) : 0}
                  fill="url(#spWR)" rx={rx}
                  className="transition-all duration-1000 ease-out"
                  style={{ transitionDelay: `${i * 100 + 200}ms` }}
                />

                {/* Win Rate % label on top of bar */}
                {d.winRate > 0 && (
                  <text
                    x={gx + barW * 2.5} y={mounted ? getY(wrMapped, yMax) - 8 : getY(0, yMax)}
                    textAnchor="middle"
                    className="text-[10px] fill-[#10b981] font-black tracking-tight transition-all duration-1000 ease-out"
                    style={{ opacity: mounted ? 1 : 0, transitionDelay: `${i * 100 + 400}ms` }}
                  >
                    {d.winRate.toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            const gx = getGroupX(i);
            return (
              <text
                key={`x-${i}`}
                x={gx + (barW * 1.5)}
                y={height - 15}
                textAnchor="middle"
                className="text-[11px] fill-muted-foreground font-semibold tracking-wide transition-opacity duration-1000 delay-500"
                style={{ opacity: mounted ? 1 : 0 }}
              >
                {d.season.replace('eFootball ', '')}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-6 mt-2 relative z-10">
        {[
          { label: 'Goals For', color: '#3b82f6', bg: 'bg-blue-500' },
          { label: 'Conceded', color: '#f43f5e', bg: 'bg-rose-500' },
          { label: 'Win Rate %', color: '#10b981', bg: 'bg-emerald-500' }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 group cursor-default">
            <div className={`w-3 h-3 rounded-full ${item.bg} shadow-sm transition-transform duration-300 group-hover:scale-125`} style={{ boxShadow: `0 0 8px ${item.color}88` }} />
            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
