import { Badge } from '@/shared/components';

interface DataPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  subtitle: string;
  data: DataPoint[];
  bestRank?: number;
  yAxisLabel?: string;
}

export function TrendChart({ title, subtitle, data, bestRank, yAxisLabel = 'Rank' }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="font-bold text-[16px]">{title}</h3>
        <p className="text-muted-foreground text-[12px] mb-4">{subtitle}</p>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[12px]">
          No data available
        </div>
      </div>
    );
  }

  const height = 200;
  const width = 400; // Will scale via viewBox
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // We are plotting Win Rate %. Higher is better.
  const yMax = 100;
  const yMin = 0;
  
  const getY = (val: number) => {
    // Normal: 100 is top (0 in coordinates), 0 is bottom (innerHeight in coordinates)
    return padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  };

  const getX = (index: number) => {
    if (data.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // Create area path for the fill under the line
  const areaPath = `M ${getX(0)},${height - padding.bottom} ` +
    data.map((d, i) => `L ${getX(i)},${getY(d.value)}`).join(' ') +
    ` L ${getX(data.length - 1)},${height - padding.bottom} Z`;

  // Y-axis grid lines (0, 25, 50, 75, 100)
  const gridLines = [100, 75, 50, 25, 0];

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="font-bold text-[16px]">{title}</h3>
          <p className="text-muted-foreground text-[12px]">{subtitle}</p>
        </div>
        {bestRank !== undefined && (
          <Badge bg="#e0e7ff" c="#4338ca" className="font-bold px-3 py-1 text-[11px] border border-[#c7d2fe]">
            Top: {bestRank.toFixed(0)}%
          </Badge>
        )}
      </div>

      <div className="flex-1 w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis labels */}
          {gridLines.map((val, i) => {
            const y = getY(val);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-border" strokeDasharray="4 4" strokeWidth="1" />
                <text x={padding.left - 10} y={y} textAnchor="end" dominantBaseline="middle" className="text-[10px] fill-muted-foreground">
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}
          
          {/* Y Axis Label (Rotated) */}
          <text 
            x={10} 
            y={height / 2} 
            transform={`rotate(-90 10 ${height / 2})`} 
            textAnchor="middle" 
            className="text-[10px] fill-muted-foreground"
          >
            {yAxisLabel}
          </text>

          {/* Area fill */}
          <path d={areaPath} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r={4}
              fill="#4f46e5"
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            // Only show max 5 labels to avoid crowding
            if (data.length > 5 && i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={`lbl-${i}`}
                x={getX(i)}
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground"
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
      
      {/* Legend below the chart */}
      <div className="flex justify-center items-center gap-2 mt-2">
        <div className="w-3 h-3 rounded-full bg-[#4f46e5]"></div>
        <span className="text-[11px] text-muted-foreground">{yAxisLabel}</span>
      </div>
    </div>
  );
}
