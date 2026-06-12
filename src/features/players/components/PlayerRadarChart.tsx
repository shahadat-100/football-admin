// No imports needed

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

  // Calculate percentages (cap at 100)
  const data = [
    { label: 'Attacking', value: Math.min((stats.goals / Math.max(max.goals, 1)) * 100, 100) },
    { label: 'Impact', value: Math.min((stats.motm / Math.max(max.motm, 1)) * 100, 100) },
    { label: 'Form', value: Math.min((stats.wins / Math.max(stats.matches, 1)) * 100, 100) }, // win percentage
    { label: 'Experience', value: Math.min((stats.matches / Math.max(max.matches, 1)) * 100, 100) },
    { label: 'Defending', value: Math.min((stats.cleanSheets / Math.max(max.cleanSheets, 1)) * 100, 100) },
  ];

  const size = 250;
  const center = size / 2;
  const radius = size / 2.5;

  const getCoordinatesForAngle = (angle: number, length: number) => {
    const x = center + length * Math.cos(angle - Math.PI / 2);
    const y = center + length * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length;
    return getCoordinatesForAngle(angle, (d.value / 100) * radius);
  });

  const polygonString = points.map(p => `${p.x},${p.y}`).join(' ');

  const axes = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length;
    return {
      label: d.label,
      ...getCoordinatesForAngle(angle, radius),
      labelCoord: getCoordinatesForAngle(angle, radius + 20),
    };
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background grids */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => {
          const bgPoints = data.map((_, i) => {
            const angle = (Math.PI * 2 * i) / data.length;
            const p = getCoordinatesForAngle(angle, radius * scale);
            return `${p.x},${p.y}`;
          }).join(' ');
          
          return (
            <polygon
              key={scale}
              points={bgPoints}
              fill="none"
              stroke="currentColor"
              className="text-border"
              strokeWidth="1"
            />
          );
        })}

        {/* Axes lines */}
        {axes.map((axis, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={axis.x}
            y2={axis.y}
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={polygonString}
          fill="currentColor"
          className="text-primary/30"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Labels */}
        {axes.map((axis, i) => (
          <text
            key={i}
            x={axis.labelCoord.x}
            y={axis.labelCoord.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] font-semibold fill-muted-foreground"
          >
            {axis.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
