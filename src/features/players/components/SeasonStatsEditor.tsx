import { useState } from 'react';
import { Season, MonthlyStat } from '../types';
import { Button } from '@/shared/components';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// Generate realistic random match dates within a calendar month
function generateMatchDatesForMonth(year: number, month: number, count: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const availableDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) availableDays.push(d);

  const picked: number[] = [];
  const step = Math.max(1, Math.floor(daysInMonth / count));
  
  for (let i = 0; i < count; i++) {
    const day = Math.min(daysInMonth, 1 + i * step + (i % 2));
    picked.push(day);
  }

  return picked
    .sort((a, b) => a - b)
    .map(day => {
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    });
}

const emptyMonthRow = (month: number): MonthlyStat => ({
  month,
  matches: 0,
  matchDates: [],
  win: 0,
  loss: 0,
  draw: 0,
  goalsScored: 0,
  goalsConceded: 0,
  hattricks: 0,
  motm: 0,
  cleanSheet: 0
});

interface SeasonStatsEditorProps {
  season: Season;
  onChange: (updated: Season) => void;
  onRemove: () => void;
}

const STAT_LABELS: { key: keyof Omit<MonthlyStat, 'month' | 'matchDates'>; label: string; short: string }[] = [
  { key: 'matches', label: 'Matches', short: 'M' },
  { key: 'win', label: 'Wins', short: 'W' },
  { key: 'loss', label: 'Losses', short: 'L' },
  { key: 'draw', label: 'Draws', short: 'D' },
  { key: 'goalsScored', label: 'Goals Scored', short: 'GS' },
  { key: 'goalsConceded', label: 'Goals Conceded', short: 'GC' },
  { key: 'motm', label: 'MOTM', short: 'MOTM' },
  { key: 'hattricks', label: 'Hattricks', short: 'HT' },
];

export function SeasonStatsEditor({ season, onChange, onRemove }: SeasonStatsEditorProps) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(0);
  const months = season.monthlyStats ?? [];

  const setMonths = (fn: (ms: MonthlyStat[]) => MonthlyStat[]) =>
    onChange({ ...season, monthlyStats: fn(months) });

  const addMonth = () => {
    const usedMonths = new Set(months.map(m => m.month));
    for (let m = 1; m <= 12; m++) {
      if (!usedMonths.has(m)) {
        const newIndex = months.length;
        setMonths(ms => [...ms, emptyMonthRow(m)].sort((a,b) => a.month - b.month));
        setExpandedMonth(newIndex);
        return;
      }
    }
  };

  const removeMonth = (mi: number) => setMonths(ms => ms.filter((_, i) => i !== mi));

  const setM = (mi: number, k: keyof MonthlyStat, v: any) => setMonths(ms =>
    ms.map((m, i) => i === mi ? { ...m, [k]: v } : m)
  );

  const handleGenerateDates = (mi: number, month: MonthlyStat) => {
    if (month.matches === 0) return;
    const dates = generateMatchDatesForMonth(season.year, month.month, month.matches);
    setM(mi, 'matchDates', dates);
  };

  const handleMatchCountChange = (mi: number, val: number) => {
    setMonths(ms =>
      ms.map((m, i) => i === mi ? {
        ...m,
        matches: val,
        matchDates: val > 0
          ? generateMatchDatesForMonth(season.year, m.month, val)
          : []
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
          const totalMatches = mo.matches ?? 0;
          const totalGoals = mo.goalsScored ?? 0;
          const mm = String(mo.month).padStart(2, '0');

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
                <div className="bg-background px-4 pb-4 space-y-4">
                  <div className="flex items-center justify-between mb-1 pt-3">
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Month Setup</span>
                    <button
                      type="button" onClick={() => removeMonth(mi)}
                      className="text-[10px] text-destructive px-2 py-1 rounded border border-destructive/30 hover:bg-destructive/10"
                    >
                      Remove Month
                    </button>
                  </div>

                  {/* Matches + Date Generator */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-primary block mb-1">
                          📅 Number of Matches ({range})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={mo.matches}
                          onChange={e => handleMatchCountChange(mi, parseInt(e.target.value) || 0)}
                          className="bg-input border border-border text-foreground px-3 py-1.5 rounded-md w-full text-[13px] font-semibold"
                          placeholder="0"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Changing this auto-generates random match dates spread across {MONTHS[mo.month - 1]}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGenerateDates(mi, mo)}
                        disabled={mo.matches === 0}
                      >
                        🔀 Regenerate Dates
                      </Button>
                    </div>

                    {/* Generated Match Dates */}
                    {mo.matchDates.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Match Dates (editable):</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {mo.matchDates.map((date, di) => (
                            <div key={di} className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground w-12">Match {di + 1}</span>
                              <input
                                type="date"
                                value={date}
                                min={`${season.year}-${mm}-01`}
                                max={`${season.year}-${mm}-${String(new Date(season.year, mo.month, 0).getDate()).padStart(2, '0')}`}
                                onChange={e => {
                                  const newDates = [...mo.matchDates];
                                  newDates[di] = e.target.value;
                                  setM(mi, 'matchDates', newDates.sort());
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
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Month Stats</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {STAT_LABELS.filter(f => f.key !== 'matches').map(f => (
                        <div key={f.key} className="bg-muted/30 rounded-lg p-2">
                          <label className="text-[10px] text-muted-foreground block mb-1">{f.label}</label>
                          <input
                            type="number"
                            min={0}
                            value={mo[f.key] as number}
                            onChange={e => setM(mi, f.key, parseInt(e.target.value) || 0)}
                            className="bg-input border border-border text-foreground px-2 py-1 rounded w-full text-[12px] font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                    {/* W+L+D validation hint */}
                    {(mo.win || 0) + (mo.loss || 0) + (mo.draw || 0) !== mo.matches && mo.matches > 0 && (
                      <p className="text-[11px] text-amber-500 mt-1">
                        ⚠️ W+L+D ({(mo.win || 0) + (mo.loss || 0) + (mo.draw || 0)}) doesn't match Matches ({mo.matches})
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
  );
}
