interface PlayerRadarChartProps {
  stats: {
    goals: number;
    cleanSheets: number;
    motm: number;
    wins: number;
    matches: number;
  };
  maxStats?: {
    goals: number;
    cleanSheets: number;
    motm: number;
    wins: number;
    matches: number;
  };
}

export function PlayerRadarChart({ stats, maxStats }: PlayerRadarChartProps) {
  const defaultMax = {
    goals: 50,
    cleanSheets: 20,
    motm: 10,
    wins: 50,
    matches: 100,
  };

  const max = maxStats || defaultMax;

  const winPct = stats.matches > 0
    ? Math.round((stats.wins / stats.matches) * 100)
    : 0;

  const data = [
    {
      label: 'Goals',
      value: Math.min((stats.goals / Math.max(max.goals, 1)) * 100, 100),
      display: `${stats.goals}`,
    },
    {
      label: 'MOTM',
      value: Math.min((stats.motm / Math.max(max.motm, 1)) * 100, 100),
      display: `${stats.motm}`,
    },
    {
      label: 'Win %',
      value: winPct,
      display: `${winPct}%`,
    },
    {
      label: 'Matches',
      value: Math.min((stats.matches / Math.max(max.matches, 1)) * 100, 100),
      display: `${stats.matches}`,
    },
    {
      label: 'Clean Sheets',
      value: Math.min((stats.cleanSheets / Math.max(max.cleanSheets, 1)) * 100, 100),
      display: `${stats.cleanSheets}`,
    },
  ];

  const size   = 250;
  const center = size / 2;
  const radius = size / 2.6;

  const getCoord = (angle: number, length: number) => ({
    x: center + length * Math.cos(angle - Math.PI / 2),
    y: center + length * Math.sin(angle - Math.PI / 2),
  });

  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length;
    return getCoord(angle, (d.value / 100) * radius);
  });

  const polygonString = points.map(p => `${p.x},${p.y}`).join(' ');

  const axes = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length;
    return {
      ...d,
      tip:        getCoord(angle, radius),
      labelPos:   getCoord(angle, radius + 26),
      displayPos: getCoord(angle, radius + 38),
    };
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg width={size} height={size} className="overflow-visible">

        {/* Background rings */}
        {[0.2, 0.4, 0.6, 0.8, 1].map(scale => {
          const bg = data
            .map((_, i) => {
              const a = (Math.PI * 2 * i) / data.length;
              const p = getCoord(a, radius * scale);
              return `${p.x},${p.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={scale}
              points={bg}
              fill="none"
              stroke="currentColor"
              className="text-border"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {axes.map((a, i) => (
          <line
            key={i}
            x1={center} y1={center}
            x2={a.tip.x} y2={a.tip.y}
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
          />
        ))}

        {/* Filled polygon */}
        <polygon
          points={polygonString}
          fill="currentColor"
          className="text-primary/30"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Dot on each axis point */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={3}
            fill="currentColor"
            className="text-primary"
          />
        ))}

        {/* Labels: stat name + actual value */}
        {axes.map((a, i) => (
          <g key={i}>
            {/* Stat name */}
            <text
              x={a.labelPos.x}
              y={a.labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-semibold fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {a.label}
            </text>
            {/* Actual value — highlighted */}
            <text
              x={a.displayPos.x}
              y={a.displayPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-bold fill-foreground"
              style={{ fontSize: 11 }}
            >
              {a.display}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
