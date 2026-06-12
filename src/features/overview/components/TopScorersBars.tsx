import { useEffect, useState } from 'react';
import { Avatar } from '@/shared/components';
import { Player } from '@/features/players/types';
import { PlayerFormDots } from './PlayerFormDots';

interface TopScorer {
  player: Player;
  goals: number;
  form?: string[];
}

interface TopScorersBarsProps {
  scorers: TopScorer[];
}

export function TopScorersBars({ scorers }: TopScorersBarsProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation shortly after mount
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const maxGoals = Math.max(...scorers.map(s => s.goals), 1); // Avoid division by zero

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <p className="font-semibold text-base mb-6 text-foreground">Top Scorers (All Time)</p>
      
      {scorers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No goal data yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {scorers.map(({ player, goals, form }, i) => {
            const widthPercent = (goals / maxGoals) * 100;
            return (
              <div key={player.id} className="flex items-center gap-3 group">
                <div className="font-medium text-muted-foreground/70 w-4 text-xs text-right shrink-0">{i + 1}</div>
                <Avatar name={player.name} size={32} src={(player as any).profileImageUrl} />
                
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm font-medium text-foreground truncate">{player.name}</span>
                      {form && <PlayerFormDots results={form} />}
                    </div>
                    <span className="text-sm font-bold text-foreground">{goals}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: animate ? `${widthPercent}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
