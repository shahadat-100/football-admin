import React from 'react';

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
  const padding = { top: 20, right: 50, bottom: 40, left: 50 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Max Stats for left axis (Goals)
  const maxGoals = Math.max(
    10, // minimum max stat
    ...data.map(d => Math.max(d.goals, d.goalsConceded))
  );
  // Round up maxGoals to nice number
  const yGoalMax = Math.ceil(maxGoals * 1.2 / 10) * 10;

  // Win Rate (0-100)
  const yWinRateMax = 100;

  const getGoalY = (stat: number) => padding.top + innerHeight - (stat / yGoalMax) * innerHeight;
  const getGoalHeight = (stat: number) => (stat / yGoalMax) * innerHeight;
  const getWinRateY = (rate: number) => padding.top + innerHeight - (rate / yWinRateMax) * innerHeight;

  const getX = (index: number) => {
    const step = innerWidth / data.length;
    return padding.left + (step * index) + step / 2;
  };

  const linePoints = data.map((d, i) => `${getX(i)},${getWinRateY(d.winRate)}`).join(' ');

  const gridLinesGoals = [0, yGoalMax * 0.25, yGoalMax * 0.5, yGoalMax * 0.75, yGoalMax].map(Math.round);
  const gridLinesWinRate = [0, 25, 50, 75, 100];

  // Bar configs
  const barWidth = Math.min(24, (innerWidth / data.length) / 3);
  const barGap = 2;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col relative overflow-hidden">
      <div className="mb-2 relative z-10">
        <h3 className="font-bold text-[16px]">Season Performance</h3>
        <p className="text-muted-foreground text-[12px]">Goals (GF/GC) and Win Rate</p>
      </div>

      <div className="flex-1 w-full relative mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="gcGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.1" />
            </filter>
          </defs>
          
          {/* Grid lines (using goals axis) */}
          {gridLinesGoals.map((val, i) => {
            const y = getGoalY(val);
            return (
              <g key={`grid-${i}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-border" strokeDasharray="3 3" strokeWidth="1" />
              </g>
            );
          })}

          {/* Left Axis Labels (Goals) */}
          {gridLinesGoals.map((val, i) => {
            const y = getGoalY(val);
            return (
              <text key={`l-axis-${i}`} x={padding.left - 10} y={y} textAnchor="end" dominantBaseline="middle" className="text-[10px] font-medium fill-muted-foreground">
                {val}
              </text>
            );
          })}
          <text x={12} y={height / 2} transform={`rotate(-90 12 ${height / 2})`} textAnchor="middle" className="text-[10px] font-bold fill-muted-foreground uppercase tracking-widest">Goals</text>

          {/* Right Axis Labels (Win Rate %) */}
          {gridLinesWinRate.map((val, i) => {
            const y = getWinRateY(val);
            return (
              <text key={`r-axis-${i}`} x={width - padding.right + 10} y={y} textAnchor="start" dominantBaseline="middle" className="text-[10px] font-medium fill-muted-foreground">
                {val}%
              </text>
            );
          })}
          <text x={width - 12} y={height / 2} transform={`rotate(90 ${width - 12} ${height / 2})`} textAnchor="middle" className="text-[10px] font-bold fill-muted-foreground uppercase tracking-widest">Win Rate</text>

          {/* Bars */}
          {data.map((d, i) => {
            const cx = getX(i);
            const gfH = getGoalHeight(d.goals);
            const gcH = getGoalHeight(d.goalsConceded);

            const gfY = getGoalY(d.goals);
            const gcY = getGoalY(d.goalsConceded);

            return (
              <g key={`bars-${i}`}>
                {/* Background track for bars */}
                <rect x={cx - barWidth - barGap/2} y={getGoalY(yGoalMax)} width={barWidth} height={getGoalHeight(yGoalMax)} fill="currentColor" className="text-muted/10" rx={4} />
                <rect x={cx + barGap/2} y={getGoalY(yGoalMax)} width={barWidth} height={getGoalHeight(yGoalMax)} fill="currentColor" className="text-muted/10" rx={4} />

                {/* Goals For */}
                <rect x={cx - barWidth - barGap/2} y={gfY} width={barWidth} height={gfH} fill="url(#gfGradient)" rx={4} filter="url(#shadow)" />
                {/* Goals Conceded */}
                <rect x={cx + barGap/2} y={gcY} width={barWidth} height={gcH} fill="url(#gcGradient)" rx={4} filter="url(#shadow)" />
              </g>
            );
          })}

          {/* Line (Win Rate) */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#shadow)"
          />

          {/* Line Dots */}
          {data.map((d, i) => (
            <circle
              key={`dot-${i}`}
              cx={getX(i)}
              cy={getWinRateY(d.winRate)}
              r={4}
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}

          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text
              key={`x-axis-${i}`}
              x={getX(i)}
              y={height - 15}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground font-medium"
            >
              {d.season.replace('eFootball ', '')}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend below the chart */}
      <div className="flex justify-center items-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#3b82f6] opacity-90"></div>
          <span className="text-[11px] text-muted-foreground">GF</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#ef4444] opacity-70"></div>
          <span className="text-[11px] text-muted-foreground">GC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
          <span className="text-[11px] text-muted-foreground">Win Rate %</span>
        </div>
      </div>
    </div>
  );
}
