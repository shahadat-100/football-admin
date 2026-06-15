

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function PieChart({ data, size = 120 }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <div 
          className="rounded-full bg-muted/50 border border-border flex items-center justify-center text-[10px] text-muted-foreground"
          style={{ width: size, height: size }}
        >
          No Data
        </div>
      </div>
    );
  }

  let currentAngle = 0;
  const gradientStops = data.map(d => {
    const percentage = (d.value / total) * 100;
    const stop = `${d.color} ${currentAngle}% ${currentAngle + percentage}%`;
    currentAngle += percentage;
    return stop;
  }).join(', ');

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div 
        className="rounded-full shadow-sm border border-border" 
        style={{ 
          width: size, 
          height: size, 
          background: `conic-gradient(${gradientStops})` 
        }}
      />
      <div className="flex flex-col gap-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-[12px]">
            <span className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: d.color }}></span>
            <span className="text-muted-foreground">{d.label}:</span>
            <span className="font-semibold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
