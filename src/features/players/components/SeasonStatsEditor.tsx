import { Season, MonthlyStat, WeeklyStat } from '../types';
import { Button } from '@/shared/components';
import { WEEKLY_STAT_FIELDS } from '@/shared/lib/constants';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Empty generators
const emptyWeekRow = (week: number): WeeklyStat => ({
  week, matches: 0, win: 0, loss: 0, draw: 0, 
  goalsScored: 0, goalsConceded: 0, hattricks: 0, motm: 0, cleanSheet: 0
});
const emptyMonthRow = (month: number): MonthlyStat => ({
  month, weeklyStats: [emptyWeekRow(1)]
});

interface SeasonStatsEditorProps {
  season: Season;
  onChange: (updated: Season) => void;
  onRemove: () => void;
}

export function SeasonStatsEditor({ season, onChange, onRemove }: SeasonStatsEditorProps) {
  const months = season.monthlyStats ?? [];

  const setMonths = (fn: (ms: MonthlyStat[]) => MonthlyStat[]) => 
    onChange({ ...season, monthlyStats: fn(months) });

  const addMonth = () => setMonths(ms => [...ms, emptyMonthRow(ms.length + 1)]);
  
  const addWeek = (mi: number) => setMonths(ms => 
    ms.map((m, i) => i === mi ? { ...m, weeklyStats: [...m.weeklyStats, emptyWeekRow(m.weeklyStats.length + 1)] } : m)
  );

  const removeWeek = (mi: number, wi: number) => setMonths(ms => 
    ms.map((m, i) => i === mi ? { ...m, weeklyStats: m.weeklyStats.filter((_, j) => j !== wi) } : m)
  );

  const setW = (mi: number, wi: number, k: keyof WeeklyStat, v: number) => setMonths(ms => 
    ms.map((m, i) => i === mi ? {
      ...m, 
      weeklyStats: m.weeklyStats.map((w, j) => j === wi ? { ...w, [k]: Number(v) || 0 } : w)
    } : m)
  );

  return (
    <div className="bg-popover border border-border rounded-lg p-3 mb-3 relative group">
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="absolute top-2 right-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-6 px-2 text-[10px]"
      >
        remove
      </Button>
      
      <div className="flex items-center justify-between mb-3 pr-16">
        <span className="text-[13px] font-semibold text-slate-300">Season {season.year}</span>
        <Button size="sm" variant="secondary" onClick={addMonth} type="button">+ Month</Button>
      </div>
      
      {months.length === 0 && (
        <p className="text-[11px] text-muted-foreground mb-2">No monthly stats yet — click + Month to add</p>
      )}
      
      {months.map((mo, mi) => (
        <div key={mi} className="bg-muted rounded-md p-2.5 mb-2 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-muted-foreground">{MONTHS_SHORT[mo.month - 1] || ('Month ' + mo.month)}</span>
            <Button size="sm" variant="secondary" onClick={() => addWeek(mi)} type="button">+ Week</Button>
          </div>
          
          {mo.weeklyStats.map((w, wi) => (
            <div key={wi} className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground">Week {w.week}</span>
                {mo.weeklyStats.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeWeek(mi, wi)} 
                    className="text-destructive text-[10px] px-1 py-0.5 rounded border border-destructive/30 hover:bg-destructive/10"
                  >
                    remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-5 gap-1.5">
                {WEEKLY_STAT_FIELDS.map(f => (
                  <div key={f}>
                    <label className="text-[9px] text-muted-foreground block mb-0.5 whitespace-nowrap">
                      {f.replace('goals', 'g').replace('Scored', 'S').replace('Conceded', 'C').replace('clean', 'cl').replace('Sheet', 'Sh')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={w[f] as number}
                      onChange={e => setW(mi, wi, f as keyof WeeklyStat, parseInt(e.target.value))}
                      className="bg-input border border-border text-foreground px-1.5 py-0.5 rounded w-full text-[11px] h-7"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
