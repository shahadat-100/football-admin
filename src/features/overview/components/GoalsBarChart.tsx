import { useState, useEffect } from 'react';
import { Player } from '@/features/players/types';

interface GoalsData {
  player: Player;
  goals: number;
  conceded: number;
}

interface GoalsBarChartProps {
  data: GoalsData[];
  onBarClick?: (playerId: string) => void;
}

export function GoalsBarChart({ data, onBarClick }: GoalsBarChartProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const validData = data.filter(d => d.goals > 0 || d.conceded > 0)
    .sort((a, b) => (b.goals + b.conceded) - (a.goals + a.conceded))
    .slice(0, 15); // Show top 15 most active players by goal involvement

  const maxVal = Math.max(...validData.flatMap(d => [d.goals, d.conceded]), 1);

  if (validData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col col-span-full">
         <p className="font-semibold text-base mb-6 text-foreground">Goals Scored vs Conceded</p>
         <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground text-sm">No goal data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col col-span-full overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <p className="font-semibold text-base text-foreground">Goals Scored vs Conceded (Top 15)</p>
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Goals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span>Conceded</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 w-full flex items-end justify-around gap-2 px-2 pb-8 mt-4 border-b border-border">
        {/* Y-axis rough markers */}
        <div className="absolute left-0 top-0 bottom-8 border-r border-border/50 flex flex-col justify-between text-[10px] text-muted-foreground pr-2 pb-1">
            <span>{maxVal}</span>
            <span>{Math.round(maxVal / 2)}</span>
            <span>0</span>
        </div>
        
        {validData.map((d) => {
          const goalsHeight = (d.goals / maxVal) * 100;
          const concededHeight = (d.conceded / maxVal) * 100;
          
          return (
            <div 
              key={d.player.id} 
              className="relative flex flex-col items-center justify-end h-full w-full max-w-[40px] group cursor-pointer"
              onClick={() => onBarClick?.(d.player.id)}
            >
              <div className="flex w-full h-full items-end justify-center gap-0.5">
                {/* Goals Bar */}
                <div 
                  className="w-1/2 bg-primary rounded-t-sm transition-all duration-1000 ease-out"
                  style={{ height: animate ? `${goalsHeight}%` : '0%' }}
                />
                {/* Conceded Bar */}
                <div 
                  className="w-1/2 bg-red-500 rounded-t-sm transition-all duration-1000 ease-out"
                  style={{ height: animate ? `${concededHeight}%` : '0%' }}
                />
              </div>
              
              {/* X-axis label (player name) */}
              <div className="absolute -bottom-7 w-full flex justify-center">
                 <span className="text-[10px] text-muted-foreground truncate w-16 text-center transform -rotate-45 origin-top-left ml-2">{d.player.name.split(' ')[0]}</span>
              </div>

              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-10 border border-border">
                <div className="font-medium mb-1 border-b border-border/50 pb-0.5">{d.player.name}</div>
                <div>G: <span className="font-bold text-primary">{d.goals}</span></div>
                <div>C: <span className="font-bold text-red-500">{d.conceded}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
