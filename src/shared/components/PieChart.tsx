
interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function PieChart({ data, size = 130 }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.52; // donut hole

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--border)" strokeWidth={outerR - innerR} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground">No Data</span>
          </div>
        </div>
      </div>
    );
  }

  // Build SVG arc slices
  const slices: { path: string; color: string; label: string; value: number; pct: number }[] = [];
  let startAngle = -90; // start from top

  data.forEach(d => {
    if (d.value === 0) return;
    const pct = d.value / total;
    const sweep = pct * 360;
    const endAngle = startAngle + sweep;

    const toRad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + outerR * Math.cos(toRad(startAngle));
    const y1 = cy + outerR * Math.sin(toRad(startAngle));
    const x2 = cx + outerR * Math.cos(toRad(endAngle));
    const y2 = cy + outerR * Math.sin(toRad(endAngle));
    const xi1 = cx + innerR * Math.cos(toRad(startAngle));
    const yi1 = cy + innerR * Math.sin(toRad(startAngle));
    const xi2 = cx + innerR * Math.cos(toRad(endAngle));
    const yi2 = cy + innerR * Math.sin(toRad(endAngle));
    const largeArc = sweep > 180 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi2} ${yi2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1}`,
      'Z'
    ].join(' ');

    slices.push({ path, color: d.color, label: d.label, value: d.value, pct: Math.round(pct * 100) });
    startAngle = endAngle;
  });

  const topItem = [...data].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.25))' }}>
          <defs>
            {slices.map((s, i) => (
              <radialGradient key={i} id={`grad-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity="1" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.7" />
              </radialGradient>
            ))}
          </defs>
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="var(--muted)" strokeWidth={outerR - innerR + 2} />
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={`url(#grad-${i})`}
              stroke="var(--card)"
              strokeWidth={2}
              style={{ transition: 'opacity 0.2s' }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[18px] font-black text-foreground leading-none">{total}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const isTop = d.label === topItem?.label && d.value > 0;
          return (
            <div key={d.label} className="flex items-center gap-2.5">
              <div
                className="shrink-0 w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}88` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[11px] font-semibold truncate ${isTop ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {d.label}
                  </span>
                  <span className="text-[11px] font-black ml-2 shrink-0" style={{ color: d.color }}>
                    {d.value} <span className="text-[9px] font-normal text-muted-foreground">({pct}%)</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: d.color, boxShadow: `0 0 4px ${d.color}` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
