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
    { label: 'Goals',        short: 'G',    value: Math.min((stats.goals / Math.max(max.goals, 1)) * 100, 100),       display: `${stats.goals}` },
    { label: 'MOTM',         short: 'MOTM', value: Math.min((stats.motm / Math.max(max.motm, 1)) * 100, 100),         display: `${stats.motm}` },
    { label: 'Win %',        short: 'W%',   value: winPct,                                                            display: `${winPct}%` },
    { label: 'Matches',      short: 'M',    value: Math.min((stats.matches / Math.max(max.matches, 1)) * 100, 100),   display: `${stats.matches}` },
    { label: 'Clean Sheets', short: 'CS',   value: Math.min((stats.cleanSheets / Math.max(max.cleanSheets, 1)) * 100, 100), display: `${stats.cleanSheets}` },
  ];

  const size   = 220;
  const center = size / 2;
  const radius = 72;

  const getCoord = (angle: number, length: number) => ({
    x: center + length * Math.cos(angle - Math.PI / 2),
    y: center + length * Math.sin(angle - Math.PI / 2),
  });

  // Smart text-anchor based on x component of direction
  const getAnchor = (angle: number): 'start' | 'middle' | 'end' => {
    const x = Math.cos(angle - Math.PI / 2);
    if (x >  0.15) return 'start';
    if (x < -0.15) return 'end';
    return 'middle';
  };

  // Smart baseline based on y component
  const getBaseline = (angle: number): 'auto' | 'hanging' | 'middle' => {
    const y = Math.sin(angle - Math.PI / 2);
    if (y < -0.15) return 'auto';
    if (y >  0.15) return 'hanging';
    return 'middle';
  };

  // Label offset: push further from axis tip based on direction
  const getLabelOffset = (angle: number): number => {
    const y = Math.sin(angle - Math.PI / 2);
    // Top/bottom axes need more push
    return Math.abs(y) > 0.7 ? radius + 30 : radius + 24;
  };

  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length;
    return getCoord(angle, (d.value / 100) * radius);
  });

  const polygonString = points.map(p => `${p.x},${p.y}`).join(' ');

  const axes = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length;
    return {
      ...d,
      tip:      getCoord(angle, radius),
      labelPos: getCoord(angle, getLabelOffset(angle)),
      anchor:   getAnchor(angle),
      baseline: getBaseline(angle),
    };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Radar SVG — labels removed from SVG to avoid overlap */}
      <svg width={size} height={size} className="overflow-visible">

        {/* Background rings */}
        {[0.2, 0.4, 0.6, 0.8, 1].map(scale => {
          const bg = data.map((_, i) => {
            const a = (Math.PI * 2 * i) / data.length;
            const p = getCoord(a, radius * scale);
            return `${p.x},${p.y}`;
          }).join(' ');
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
          className="text-primary/25"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Vertex dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="currentColor" className="text-primary" />
        ))}

        {/* Smart-positioned short axis labels (no overlap) */}
        {axes.map((a, i) => (
          <text
            key={i}
            x={a.labelPos.x}
            y={a.labelPos.y}
            textAnchor={a.anchor}
            dominantBaseline={a.baseline}
            className="text-[10px] font-bold fill-muted-foreground"
            style={{ fontSize: 10 }}
          >
            {a.short}
          </text>
        ))}
      </svg>

      {/* Stat legend below the chart — no overlap possible */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 w-full max-w-[220px]">
        {data.map(d => (
          <div key={d.label} className="flex flex-col items-center bg-muted/40 rounded-lg px-2 py-1.5">
            <span className="text-[9px] text-muted-foreground leading-none mb-0.5">{d.label}</span>
            <span className="text-[13px] font-bold text-foreground leading-none">{d.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
