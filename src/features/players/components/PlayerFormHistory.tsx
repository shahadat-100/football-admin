import { MatchEntry } from '@/features/match-entries/types';
import { RESULT_BADGE } from '@/shared/lib/constants';

interface PlayerFormHistoryProps {
  entries: MatchEntry[];
}

export function PlayerFormHistory({ entries }: PlayerFormHistoryProps) {
  const recentEntries = [...entries]
    .sort((a, b) => {
      const dateTimeA = a.time ? `${a.date}T${a.time}` : (a.date ? `${a.date}T00:00:00` : 0);
      const dateTimeB = b.time ? `${b.date}T${b.time}` : (b.date ? `${b.date}T00:00:00` : 0);
      const dateA = new Date(dateTimeA).getTime();
      const dateB = new Date(dateTimeB).getTime();
      const validA = isNaN(dateA) ? 0 : dateA;
      const validB = isNaN(dateB) ? 0 : dateB;
      if (validA !== validB) return validB - validA;
      // Fallback to string comparison of ID to keep sort stable if dates are identical
      return String(b.id).localeCompare(String(a.id));
    })
    .slice(0, 10)
    .reverse();

  if (recentEntries.length === 0) return null;

  const wins = recentEntries.filter(e => e.result === 'win').length;
  const draws = recentEntries.filter(e => e.result === 'draw').length;
  const losses = recentEntries.filter(e => e.result === 'loss').length;
  const goals = recentEntries.reduce((s, e) => s + (e.goals || 0), 0);
  const motm = recentEntries.filter(e => e.motm).length;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
      <h3 className="font-semibold text-[14px] mb-3">Recent Form (Last 10 Matches)</h3>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap">
          {recentEntries.map((e, i) => {
            const result = e.result || 'draw';
            const bg = RESULT_BADGE[result as keyof typeof RESULT_BADGE]?.bg || '#333';
            const c = RESULT_BADGE[result as keyof typeof RESULT_BADGE]?.c || '#fff';
            return (
              <div 
                key={e.id || i}
                className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: bg, color: c }}
                title={`${e.date}: ${e.goals} Goals`}
              >
                {result.charAt(0).toUpperCase()}
              </div>
            );
          })}
          {/* Fill empty spots if less than 10 matches */}
          {Array.from({ length: Math.max(0, 10 - recentEntries.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground/30 text-xs">
              -
            </div>
          ))}
        </div>

        {/* Mini Stats */}
        <div className="flex items-center gap-4 text-sm bg-muted/50 px-4 py-2 rounded-lg border border-border">
          <div className="flex flex-col items-center">
            <span className="font-bold">{wins}W - {draws}D - {losses}L</span>
            <span className="text-[10px] text-muted-foreground uppercase">Record</span>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-primary">{goals}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Goals</span>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-amber-500">{motm}</span>
            <span className="text-[10px] text-muted-foreground uppercase">MOTM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
