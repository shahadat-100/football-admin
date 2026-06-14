import React from 'react';

interface SeasonData {
  season: string;
  rank: number;
  appearances: number;
  wins: number;
  goals: number;
}

interface SeasonPerformanceChartProps {
  data: SeasonData[];
}

export function SeasonPerformanceChart({ data }: SeasonPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="font-bold text-[16px]">Season Performance Trend</h3>
        <p className="text-muted-foreground text-[12px] mb-4">Rank, appearances, wins and goals by season</p>
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

  // Max Stats for right axis (bars)
  const maxStat = Math.max(
    10, // minimum max stat
    ...data.map(d => Math.max(d.appearances, d.wins, d.goals))
  );
  // Round up maxStat to nice number
  const yStatMax = Math.ceil(maxStat * 1.2 / 50) * 50;

  // Max Rank for left axis (line) - inverted (lower is better)
  const maxRankData = Math.max(10, ...data.map(d => d.rank));
  const yRankMax = Math.ceil(maxRankData * 1.2 / 500) * 500;

  const getRankY = (rank: number) => padding.top + ((rank - 1) / (yRankMax - 1)) * innerHeight;
  const getStatY = (stat: number) => padding.top + innerHeight - (stat / yStatMax) * innerHeight;
  const getStatHeight = (stat: number) => (stat / yStatMax) * innerHeight;

  const getX = (index: number) => {
    const step = innerWidth / data.length;
    return padding.left + (step * index) + step / 2;
  };

  const linePoints = data.map((d, i) => `${getX(i)},${getRankY(d.rank)}`).join(' ');

  const gridLinesStats = [0, yStatMax * 0.25, yStatMax * 0.5, yStatMax * 0.75, yStatMax];
  const gridLinesRank = [yRankMax, yRankMax * 0.75, yRankMax * 0.5, yRankMax * 0.25, 1].map(Math.floor);

  // Bar configs
  const barWidth = Math.min(24, (innerWidth / data.length) / 4);
  const barGap = 4;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col relative overflow-hidden">
      <div className="mb-2 relative z-10">
        <h3 className="font-bold text-[16px]">Season Performance Trend</h3>
        <p className="text-muted-foreground text-[12px]">Rank, appearances, wins and goals by season</p>
      </div>

      <div className="flex-1 w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          
          {/* Grid lines */}
          {gridLinesStats.map((val, i) => {
            const y = getStatY(val);
            return (
              <g key={`grid-${i}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-border" strokeWidth="1" />
              </g>
            );
          })}

          {/* Left Axis Labels (Rank) */}
          {gridLinesRank.map((val, i) => {
            const y = getRankY(val);
            return (
              <text key={`l-axis-${i}`} x={padding.left - 10} y={y} textAnchor="end" dominantBaseline="middle" className="text-[10px] fill-muted-foreground">
                {val.toLocaleString()}
              </text>
            );
          })}
          <text x={10} y={height / 2} transform={`rotate(-90 10 ${height / 2})`} textAnchor="middle" className="text-[10px] fill-muted-foreground">Rank</text>

          {/* Right Axis Labels (Stats) */}
          {gridLinesStats.map((val, i) => {
            const y = getStatY(val);
            return (
              <text key={`r-axis-${i}`} x={width - padding.right + 10} y={y} textAnchor="start" dominantBaseline="middle" className="text-[10px] fill-muted-foreground">
                {val}
              </text>
            );
          })}
          <text x={width - 10} y={height / 2} transform={`rotate(90 ${width - 10} ${height / 2})`} textAnchor="middle" className="text-[10px] fill-muted-foreground">Stats</text>

          {/* Bars */}
          {data.map((d, i) => {
            const cx = getX(i);
            const appH = getStatHeight(d.appearances);
            const winH = getStatHeight(d.wins);
            const golH = getStatHeight(d.goals);

            const appY = getStatY(d.appearances);
            const winY = getStatY(d.wins);
            const golY = getStatY(d.goals);

            return (
              <g key={`bars-${i}`}>
                {/* Appearances */}
                <rect x={cx - barWidth*1.5 - barGap} y={appY} width={barWidth} height={appH} fill="#e5e7eb" rx={2} />
                {/* Wins */}
                <rect x={cx - barWidth/2} y={winY} width={barWidth} height={winH} fill="#d1fae5" rx={2} />
                {/* Goals */}
                <rect x={cx + barWidth/2 + barGap} y={golY} width={barWidth} height={golH} fill="#dbeafe" rx={2} />
              </g>
            );
          })}

          {/* Line (Rank) */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Line Dots */}
          {data.map((d, i) => (
            <circle
              key={`dot-${i}`}
              cx={getX(i)}
              cy={getRankY(d.rank)}
              r={4}
              fill="#4f46e5"
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
              className="text-[10px] fill-muted-foreground"
            >
              {d.season}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend below the chart */}
      <div className="flex justify-center items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#4f46e5]"></div>
          <span className="text-[11px] text-muted-foreground">Rank</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#e5e7eb]"></div>
          <span className="text-[11px] text-muted-foreground">Appearances</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#d1fae5]"></div>
          <span className="text-[11px] text-muted-foreground">Wins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#dbeafe]"></div>
          <span className="text-[11px] text-muted-foreground">Goals For</span>
        </div>
      </div>
    </div>
  );
}
