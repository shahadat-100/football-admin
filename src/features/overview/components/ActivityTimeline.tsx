import { useMemo } from 'react';
import { format, parseISO, subMonths } from 'date-fns';

interface ActivityTimelineProps {
  dates: string[];
}

export function ActivityTimeline({ dates }: ActivityTimelineProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const last12Months = Array.from({ length: 12 }).map((_, i) => {
      const d = subMonths(now, 11 - i);
      return {
        month: format(d, 'MMM'),
        year: format(d, 'yy'),
        key: format(d, 'yyyy-MM'),
        count: 0
      };
    });

    dates.forEach(dateStr => {
      if (!dateStr) return;
      try {
        const date = parseISO(dateStr);
        const key = format(date, 'yyyy-MM');
        const monthObj = last12Months.find(m => m.key === key);
        if (monthObj) {
          monthObj.count++;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    return last12Months;
  }, [dates]);

  const maxMatches = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <p className="font-semibold text-base text-foreground mb-1">Match Activity</p>
        <p className="text-xs text-muted-foreground mb-6">Matches played over the last 12 months</p>
      </div>

      <div className="flex items-end justify-between h-32 gap-1 sm:gap-2">
        {chartData.map(d => {
          const heightPct = (d.count / maxMatches) * 100;
          return (
            <div key={d.key} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full flex justify-center h-full items-end pb-2">
                <div 
                  className="w-full max-w-[24px] bg-primary/20 group-hover:bg-primary transition-colors rounded-t-sm"
                  style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? '4px' : '0px' }}
                />
                
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-10 border border-border">
                  {d.count} matches
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
