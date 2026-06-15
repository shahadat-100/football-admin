import { useEffect, useState } from 'react';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function PieChart({ data, size = 130 }: PieChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = Math.max(12, size * 0.1);
  const r = (size - strokeWidth) / 2 - 4; // radius
  
  // Calculate circumference
  const circumference = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] text-muted-foreground font-medium">No Data</span>
          </div>
        </div>
      </div>
    );
  }

  let currentOffset = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += pct * circumference;
    // Add small gap for visual separation if there are multiple segments
    const gap = data.filter(x => x.value > 0).length > 1 && d.value > 0 ? 3 : 0;
    
    return {
      ...d,
      pct,
      strokeDasharray: d.value > 0 ? `${(pct * circumference) - gap} ${circumference}` : `0 ${circumference}`,
      strokeDashoffset
    };
  });

  const topItem = [...data].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}></div>
        <svg width={size} height={size} className="transform -rotate-90 overflow-visible" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
          {/* Track */}
          <circle 
            cx={cx} cy={cy} r={r} 
            fill="none" 
            stroke="var(--muted)" 
            strokeWidth={strokeWidth} 
            opacity={0.3}
          />
          {segments.map((s, i) => (
             <circle
               key={i}
               cx={cx} cy={cy} r={r}
               fill="none"
               stroke={s.color}
               strokeWidth={strokeWidth}
               strokeLinecap="round"
               strokeDasharray={s.strokeDasharray}
               strokeDashoffset={s.strokeDashoffset}
               className="transition-all duration-1000 ease-out"
               style={{
                 strokeDasharray: mounted ? s.strokeDasharray : `0 ${circumference}`,
                 opacity: s.value > 0 ? 1 : 0
               }}
             />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[24px] font-black text-foreground leading-none tracking-tight">{total}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 flex-1 w-full min-w-0 py-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const isTop = d.label === topItem?.label && d.value > 0;
          return (
            <div key={d.label} className="group relative">
              <div className="flex justify-between items-end mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full transition-transform duration-300 group-hover:scale-125"
                    style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}99` }}
                  />
                  <span className={`text-[12px] font-semibold tracking-wide ${isTop ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {d.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[14px] font-black leading-none" style={{ color: d.color }}>
                    {d.value}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground/70 w-8 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
              {/* Progress bar line */}
              <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ 
                    width: mounted ? `${pct}%` : '0%', 
                    backgroundColor: d.color,
                    boxShadow: `0 0 10px ${d.color}66`
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
