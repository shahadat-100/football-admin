import { useState } from 'react';
import { Season, MonthlyStat, WeeklyStat } from '../types';
import { Button } from '@/shared/components';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Get the day range for a given week within a month
function getWeekRange(year: number, month: number, week: number): { start: number; end: number } {
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based
  const start = (week - 1) * 7 + 1;
  const end = week === 5 ? daysInMonth : Math.min(week * 7, daysInMonth);
  return { start, end };
}

// Generate realistic random match dates within a week range
function generateMatchDates(year: number, month: number, week: number, count: number): string[] {
  const { start, end } = getWeekRange(year, month, week);
  const availableDays: number[] = [];
  for (let d = start; d <= end; d++) availableDays.push(d);

  // Spread matches across different days (football is usually not every day)
  const picked: number[] = [];
  const shuffled = [...availableDays].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(count, availableDays.length); i++) {
    picked.push(shuffled[i]);
  }
  // If more matches than days, allow repeated days
  for (let i = picked.length; i < count; i++) {
    picked.push(availableDays[Math.floor(Math.random() * availableDays.length)]);
  }

  return picked
    .sort((a, b) => a - b)
    .map(day => {
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    });
}

const emptyWeekRow = (week: number): WeeklyStat => ({
  week, matchDates: [], matches: 0, win: 0, loss: 0, draw: 0,
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

const STAT_LABELS: { key: keyof WeeklyStat; label: string; short: string }[] = [
  { key: 'matches', label: 'Matches', short: 'M' },
  { key: 'win', label: 'Wins', short: 'W' },
  { key: 'loss', label: 'Losses', short: 'L' },
  { key: 'draw', label: 'Draws', short: 'D' },
  { key: 'goalsScored', label: 'Goals Scored', short: 'GS' },
  { key: 'goalsConceded', label: 'Goals Conceded', short: 'GC' },
  { key: 'hattricks', label: 'Hat-tricks', short: 'HT' },
  { key: 'motm', label: 'MOTM', short: 'MOTM' },
  { key: 'cleanSheet', label: 'Clean Sheets', short: 'CS' },
];

export function SeasonStatsEditor({ season, onChange, onRemove }: SeasonStatsEditorProps) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(0);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const months = season.monthlyStats ?? [];

  const setMonths = (fn: (ms: MonthlyStat[]) => MonthlyStat[]) =>
    onChange({ ...season, monthlyStats: fn(months) });

  const addMonth = () => {
    // Find the next month not yet added
    const usedMonths = new Set(months.map(m => m.month));
    for (let m = 1; m <= 12; m++) {
      if (!usedMonths.has(m)) {
        const newIndex = months.length; // capture index BEFORE setMonths to avoid off-by-one
        setMonths(ms => [...ms, emptyMonthRow(m)].sort((a,b) => a.month - b.month));
        setExpandedMonth(newIndex);
        return;
      }
    }
  };

  const removeMonth = (mi: number) => setMonths(ms => ms.filter((_, i) => i !== mi));

  const addWeek = (mi: number) => setMonths(ms =>
    ms.map((m, i) => i === mi
      ? { ...m, weeklyStats: [...m.weeklyStats, emptyWeekRow(m.weeklyStats.length + 1)].sort((a,b) => a.week - b.week) }
      : m)
  );

  const removeWeek = (mi: number, wi: number) => setMonths(ms =>
    ms.map((m, i) => i === mi
      ? { ...m, weeklyStats: m.weeklyStats.filter((_, j) => j !== wi) }
      : m)
  );

  const setW = (mi: number, wi: number, k: keyof WeeklyStat, v: number | string[]) => setMonths(ms =>
    ms.map((m, i) => i === mi ? {
      ...m,
      weeklyStats: m.weeklyStats.map((w, j) => j === wi ? { ...w, [k]: v } : w)
    } : m)
  );

  const handleGenerateDates = (mi: number, wi: number, week: WeeklyStat, month: MonthlyStat) => {
    if (week.matches === 0) return;
    const dates = generateMatchDates(season.year, month.month, week.week, week.matches);
    setW(mi, wi, 'matchDates', dates);
  };

  const handleMatchCountChange = (mi: number, wi: number, val: number) => {
    setMonths(ms =>
      ms.map((m, i) => i === mi ? {
        ...m,
        weeklyStats: m.weeklyStats.map((w, j) => j === wi ? {
          ...w,
          matches: val,
          matchDates: val > 0
            ? generateMatchDates(season.year, m.month, w.week, val)
            : []
        } : w)
      } : m)
    );
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-4">
      {/* Season Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-foreground">📅 Season {season.year}</span>
          <span className="text-[11px] text-muted-foreground">({months.length} month{months.length !== 1 ? 's' : ''})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={addMonth} type="button"
            disabled={months.length >= 12}>
            + Month
          </Button>
          <button
            type="button" onClick={onRemove}
            className="text-[11px] text-destructive px-2 py-1 rounded border border-destructive/30 hover:bg-destructive/10"
          >
            Remove
          </button>
        </div>
      </div>

      {months.length === 0 && (
        <p className="text-[12px] text-muted-foreground text-center py-4">
          No months added — click "+ Month" to start entering stats
        </p>
      )}

      {/* Months */}
      <div className="divide-y divide-border">
        {months.map((mo, mi) => {
          const isMonthOpen = expandedMonth === mi;
          const range = `${MONTHS[mo.month - 1]} ${season.year}`;
          const totalMatches = mo.weeklyStats.reduce((s, w) => s + w.matches, 0);
          const totalGoals = mo.weeklyStats.reduce((s, w) => s + w.goalsScored, 0);

          return (
            <div key={mi}>
              {/* Month Header */}
              <button
                type="button"
                onClick={() => setExpandedMonth(isMonthOpen ? null : mi)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold text-foreground">{range}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {totalMatches} match{totalMatches !== 1 ? 'es' : ''} · {totalGoals} goals
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{isMonthOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Month Content */}
              {isMonthOpen && (
                <div className="bg-background px-4 pb-4">
                  <div className="flex items-center justify-between mb-3 pt-3">
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Weeks</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => addWeek(mi)} type="button"
                        disabled={mo.weeklyStats.length >= 5}>
                        + Week
                      </Button>
                      <button
                        type="button" onClick={() => removeMonth(mi)}
                        className="text-[10px] text-destructive px-2 py-1 rounded border border-destructive/30 hover:bg-destructive/10"
                      >
                        Remove Month
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {mo.weeklyStats.map((w, wi) => {
                      const { start, end } = getWeekRange(season.year, mo.month, w.week);
                      const mm = String(mo.month).padStart(2, '0');
                      const dateRange = `${MONTHS_SHORT[mo.month - 1]} ${start}–${end}`;
                      const weekKey = `${mi}-${wi}`;
                      const isWeekOpen = expandedWeek === weekKey;

                      return (
                        <div key={wi} className="border border-border rounded-lg overflow-hidden">
                          {/* Week Header */}
                          <button
                            type="button"
                            onClick={() => setExpandedWeek(isWeekOpen ? null : weekKey)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] font-semibold">Week {w.week}</span>
                              <span className="text-[11px] text-muted-foreground">{dateRange}</span>
                              {w.matches > 0 && (
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {w.matches} matches · {w.win}W {w.loss}L {w.draw}D
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {mo.weeklyStats.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeWeek(mi, wi); }}
                                  className="text-[10px] text-destructive px-1.5 py-0.5 rounded border border-destructive/30 hover:bg-destructive/10"
                                >
                                  ✕
                                </button>
                              )}
                              <span className="text-[10px] text-muted-foreground">{isWeekOpen ? '▲' : '▼'}</span>
                            </div>
                          </button>

                          {/* Week Content */}
                          {isWeekOpen && (
                            <div className="p-3 space-y-4">
                              {/* Matches + Date Generator */}
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                <div className="flex items-end gap-3">
                                  <div className="flex-1">
                                    <label className="text-[11px] font-semibold text-primary block mb-1">
                                      📅 Number of Matches (Week {w.week} · {dateRange})
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={20}
                                      value={w.matches}
                                      onChange={e => handleMatchCountChange(mi, wi, parseInt(e.target.value) || 0)}
                                      className="bg-input border border-border text-foreground px-3 py-1.5 rounded-md w-full text-[13px] font-semibold"
                                      placeholder="0"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      Changing this auto-generates random match dates within {dateRange}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleGenerateDates(mi, wi, w, mo)}
                                    disabled={w.matches === 0}
                                  >
                                    🔀 Regenerate Dates
                                  </Button>
                                </div>

                                {/* Generated Match Dates */}
                                {w.matchDates.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">Match Dates (editable):</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                      {w.matchDates.map((date, di) => (
                                        <div key={di} className="flex items-center gap-1">
                                          <span className="text-[10px] text-muted-foreground w-12">Match {di + 1}</span>
                                          <input
                                            type="date"
                                            value={date}
                                            min={`${season.year}-${mm}-${String(start).padStart(2,'0')}`}
                                            max={`${season.year}-${mm}-${String(end).padStart(2,'0')}`}
                                            onChange={e => {
                                              const newDates = [...w.matchDates];
                                              newDates[di] = e.target.value;
                                              setW(mi, wi, 'matchDates', newDates.sort());
                                            }}
                                            className="bg-input border border-border text-foreground px-2 py-1 rounded text-[11px] flex-1 w-full"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Stats Grid */}
                              <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Week Stats</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {STAT_LABELS.filter(f => f.key !== 'matches').map(f => (
                                    <div key={f.key} className="bg-muted/30 rounded-lg p-2">
                                      <label className="text-[10px] text-muted-foreground block mb-1">{f.label}</label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={w[f.key] as number}
                                        onChange={e => setW(mi, wi, f.key, parseInt(e.target.value) || 0)}
                                        className="bg-input border border-border text-foreground px-2 py-1 rounded w-full text-[12px] font-semibold"
                                      />
                                    </div>
                                  ))}
                                </div>
                                {/* W+L+D validation hint */}
                                {w.win + w.loss + w.draw !== w.matches && w.matches > 0 && (
                                  <p className="text-[11px] text-amber-500 mt-1">
                                    ⚠️ W+L+D ({w.win + w.loss + w.draw}) doesn't match Matches ({w.matches})
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
