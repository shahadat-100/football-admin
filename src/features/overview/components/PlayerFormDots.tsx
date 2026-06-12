import { RESULT_BADGE } from '@/shared/lib/constants';

interface PlayerFormDotsProps {
  results: string[]; // array of 'win', 'draw', 'loss'
}

export function PlayerFormDots({ results }: PlayerFormDotsProps) {
  // Take up to the last 5 matches
  const recentResults = [...results].slice(-5);

  return (
    <div className="flex items-center gap-1">
      {recentResults.map((r, i) => {
        const color = RESULT_BADGE[r as keyof typeof RESULT_BADGE]?.c || '#aaa';
        return (
          <div 
            key={i} 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: color }}
            title={r}
          />
        );
      })}
      {recentResults.length === 0 && (
        <span className="text-[10px] text-muted-foreground italic">No form</span>
      )}
    </div>
  );
}
