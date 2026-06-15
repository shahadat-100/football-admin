
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
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="font-bold text-[16px]">Season Performance</h3>
        <p className="text-muted-foreground text-[12px] mb-4">Goals, Conceded and Win Rate</p>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[12px]">
          No data available
        </div>
      </div>
    );
  }

  const height = 250;
  const width = 500;
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Unified Y axis — scale everything 0-100 using percentages
  // GF and GC are scaled to 100 as max, win rate is already 0-100
  const maxStat = Math.max(10, ...data.map(d => Math.max(d.goals, d.goalsConceded)));
  const yMax = Math.ceil(maxStat * 1.2 / 10) * 10; // e.g. 30, 40, etc.

  const getY = (val: number, max: number) =>
    padding.top + innerHeight - (val / max) * innerHeight;
  const getH = (val: number, max: number) =>
    (val / max) * innerHeight;

  const step = innerWidth / data.length;
  const groupWidth = step * 0.75;
  const barW = groupWidth / 3;

  const getGroupX = (i: number) => padding.left + step * i + step * 0.125;

  const gridLines = 5;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col relative overflow-hidden">
      <div className="mb-2 relative z-10">
        <h3 className="font-bold text-[16px]">Season Performance</h3>
        <p className="text-muted-foreground text-[12px]">Goals For · Goals Conceded · Win Rate %</p>
      </div>

      <div className="flex-1 w-full relative mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="spGF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="spGC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="spWR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
            </linearGradient>
            <filter id="spShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const val = (yMax / gridLines) * i;
            const y = getY(val, yMax);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left} y1={y}
                  x2={width - padding.right} y2={y}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle"
                  className="text-[9px] fill-muted-foreground">
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Win Rate secondary labels on right (0-100%) */}
          {[0, 25, 50, 75, 100].map((pct, i) => {
            // Map 0-100% onto the goal axis scale for visual alignment
            const mappedVal = (pct / 100) * yMax;
            const y = getY(mappedVal, yMax);
            return (
              <text key={`wr-label-${i}`} x={width - padding.right + 6} y={y}
                textAnchor="start" dominantBaseline="middle"
                className="text-[9px] fill-[#10b981] font-medium">
                {pct}%
              </text>
            );
          })}

          {/* Grouped Bars */}
          {data.map((d, i) => {
            const gx = getGroupX(i);

            // Win Rate bar: scale 0-100% onto goal axis
            const wrMapped = (d.winRate / 100) * yMax;

            return (
              <g key={`group-${i}`}>
                {/* Background tracks */}
                <rect x={gx}            y={getY(yMax, yMax)} width={barW} height={getH(yMax, yMax)} fill="currentColor" className="text-muted/10" rx={3} />
                <rect x={gx + barW}     y={getY(yMax, yMax)} width={barW} height={getH(yMax, yMax)} fill="currentColor" className="text-muted/10" rx={3} />
                <rect x={gx + barW * 2} y={getY(yMax, yMax)} width={barW} height={getH(yMax, yMax)} fill="currentColor" className="text-muted/10" rx={3} />

                {/* GF bar */}
                <rect
                  x={gx} y={getY(d.goals, yMax)}
                  width={barW} height={getH(d.goals, yMax)}
                  fill="url(#spGF)" rx={3} filter="url(#spShadow)"
                />
                {/* GC bar */}
                <rect
                  x={gx + barW} y={getY(d.goalsConceded, yMax)}
                  width={barW} height={getH(d.goalsConceded, yMax)}
                  fill="url(#spGC)" rx={3} filter="url(#spShadow)"
                />
                {/* Win Rate bar */}
                <rect
                  x={gx + barW * 2} y={getY(wrMapped, yMax)}
                  width={barW} height={getH(wrMapped, yMax)}
                  fill="url(#spWR)" rx={3} filter="url(#spShadow)"
                />

                {/* Win Rate % label on top of bar */}
                {d.winRate > 0 && (
                  <text
                    x={gx + barW * 2.5} y={getY(wrMapped, yMax) - 4}
                    textAnchor="middle"
                    className="text-[9px] fill-[#10b981] font-bold"
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
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground font-medium"
              >
                {d.season.replace('eFootball ', '')}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#3b82f6]"></div>
          <span className="text-[11px] text-muted-foreground">GF</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#ef4444]"></div>
          <span className="text-[11px] text-muted-foreground">GC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#10b981]"></div>
          <span className="text-[11px] text-muted-foreground">Win Rate %</span>
        </div>
      </div>
    </div>
  );
}
