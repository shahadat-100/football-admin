// No imports needed

interface WinRateDonutProps {
  wins: number;
  draws: number;
  losses: number;
}

export function WinRateDonut({ wins, draws, losses }: WinRateDonutProps) {
  const total = wins + draws + losses;
  
  const winPercentage = total > 0 ? (wins / total) * 100 : 0;
  const drawPercentage = total > 0 ? (draws / total) * 100 : 0;
  const lossPercentage = total > 0 ? (losses / total) * 100 : 0;

  // SVG circle math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  const winStroke = (winPercentage / 100) * circumference;
  const drawStroke = (drawPercentage / 100) * circumference;
  const lossStroke = (lossPercentage / 100) * circumference;

  const winOffset = 0;
  const drawOffset = -winStroke;
  const lossOffset = drawOffset - drawStroke;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
      <p className="font-semibold text-base mb-4 text-foreground w-full text-left">Win / Draw / Loss</p>
      
      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No match data</p>
        </div>
      ) : (
        <div className="relative flex items-center justify-center w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth="12"
              className="dark:stroke-gray-800"
            />
            {/* Wins */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#10b981" // emerald-500
              strokeWidth="12"
              strokeDasharray={`${winStroke} ${circumference}`}
              strokeDashoffset={winOffset}
              className="transition-all duration-1000 ease-out"
            />
            {/* Draws */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f59e0b" // amber-500
              strokeWidth="12"
              strokeDasharray={`${drawStroke} ${circumference}`}
              strokeDashoffset={drawOffset}
              className="transition-all duration-1000 ease-out"
            />
            {/* Losses */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#ef4444" // red-500
              strokeWidth="12"
              strokeDasharray={`${lossStroke} ${circumference}`}
              strokeDashoffset={lossOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{total}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Matches</span>
          </div>
        </div>
      )}
      
      {total > 0 && (
        <div className="flex items-center justify-center gap-4 mt-6 w-full">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">{wins} W</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm font-medium">{draws} D</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium">{losses} L</span>
          </div>
        </div>
      )}
    </div>
  );
}
