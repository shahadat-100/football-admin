import { useMemo } from 'react';
import { Player } from '@/features/players/types';
import { MatchEntry } from '@/features/match-entries/types';

interface MonthlyTopXIProps {
  players: Player[];
  matchEntries: MatchEntry[];
}

interface PlayerPoints {
  player: Player;
  points: number;
  matches: number;
  wins: number;
  goals: number;
  motm: number;
}

// 4-3-3 formation positions on a vertical half-pitch
// x: 0-100 (left to right), y: 0-100 (top = center line, bottom = GK)
const FORMATION_POSITIONS = [
  // GK
  { x: 50, y: 88, role: 'GK' },
  // DEF (4)
  { x: 15, y: 70, role: 'LB' },
  { x: 38, y: 70, role: 'CB' },
  { x: 62, y: 70, role: 'CB' },
  { x: 85, y: 70, role: 'RB' },
  // MID (3)
  { x: 25, y: 45, role: 'LM' },
  { x: 50, y: 45, role: 'CM' },
  { x: 75, y: 45, role: 'RM' },
  // FWD (3)
  { x: 22, y: 22, role: 'LW' },
  { x: 50, y: 15, role: 'ST' },
  { x: 78, y: 22, role: 'RW' },
];

export function MonthlyTopXI({ players, matchEntries }: MonthlyTopXIProps) {
  // Find the most recent month with actual data to display
  const mostRecentEntry = matchEntries
    .map(e => e.date ? new Date(e.date) : null)
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const targetDate = mostRecentEntry || new Date();
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  const monthName = targetDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const topXI = useMemo<PlayerPoints[]>(() => {
    const monthEntries = matchEntries.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const pointsMap = new Map<string, PlayerPoints>();

    for (const entry of monthEntries) {
      const player = players.find(p => p.id === entry.playerId);
      if (!player) continue;

      if (!pointsMap.has(player.id)) {
        pointsMap.set(player.id, { player, points: 0, matches: 0, wins: 0, goals: 0, motm: 0 });
      }
      const data = pointsMap.get(player.id)!;
      data.matches += 1;
      if (entry.result === 'win') { data.points += 3; data.wins += 1; }
      else if (entry.result === 'draw') { data.points += 1; }
      data.goals += entry.goals || 0;
      if (entry.motm) { data.points += 2; data.motm += 1; }
    }

    return Array.from(pointsMap.values())
      .sort((a, b) => b.points - a.points || b.goals - a.goals)
      .slice(0, 11);
  }, [players, matchEntries, currentMonth, currentYear]);

  const isEmpty = topXI.length === 0;

  return (
    <div className="bg-card border border-border rounded-[24px] shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex justify-between items-start border-b border-border bg-card">
        <div>
          <h3 className="font-bold text-[18px] tracking-tight text-foreground">Team of the Month</h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">Top performing XI — <span className="font-semibold text-foreground">{monthName}</span></p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-semibold shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block"></span>
          Latest
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center flex-1 h-64 text-muted-foreground text-[13px] bg-muted/30">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <span className="text-xl">📅</span>
          </div>
          No match data found yet.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-0 flex-1">
          {/* Light Pitch Visualization */}
          <div className="relative flex-1 min-h-[500px] lg:min-h-[600px] bg-[#f4f5f7] overflow-hidden">
            {/* Pitch markings SVG (Grey Lines) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points="4,0 4,96 96,96 96,0" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <line x1="4" y1="0" x2="96" y2="0" stroke="#d1d5db" strokeWidth="0.5"/>
              <path d="M 35 0 A 15 15 0 0 0 65 0" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <circle cx="50" cy="0" r="0.6" fill="#9ca3af"/>
              <rect x="20" y="80" width="60" height="16" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <rect x="35" y="92" width="30" height="4" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <path d="M 38 80 A 12 12 0 0 1 62 80" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <circle cx="50" cy="88" r="0.6" fill="#9ca3af"/>
              <path d="M 4 92 A 4 4 0 0 0 8 96" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <path d="M 96 92 A 4 4 0 0 1 92 96" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
            </svg>

            {/* Player dots */}
            {FORMATION_POSITIONS.map((pos, idx) => {
              const pd = topXI[idx];
              if (!pd) return null;

              const rating = (pd.points / Math.max(1, pd.matches)).toFixed(1);
              const ratingNum = parseFloat(rating);
              
              // Color mapping for score bubbles
              const bubbleColor = ratingNum >= 2.5 ? 'bg-amber-500 text-white' : 
                                  ratingNum >= 2.0 ? 'bg-[#f43f5e] text-white' : 
                                  'bg-[#fb7185] text-white'; // light pink for lower

              return (
                <div
                  key={pd.player.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group cursor-default z-10"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="relative">
                    {/* Dark Purple thick border around the avatar */}
                    <div className="w-[60px] h-[60px] lg:w-[68px] lg:h-[68px] rounded-full border-[3px] border-[#31103f] bg-white overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.15)] flex items-center justify-center">
                      {pd.player.profileImageUrl ? (
                        <img src={pd.player.profileImageUrl} alt={pd.player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-[#31103f] text-lg">{pd.player.name.charAt(0)}</span>
                      )}
                    </div>

                    {/* Top Right Score Bubble */}
                    <div className={`absolute -top-1 -right-2 px-2 py-0.5 rounded-full font-black text-[12px] lg:text-[13px] shadow-md border-2 border-white ${bubbleColor} z-20`}>
                      {rating}
                    </div>

                    {/* Bottom Badges */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                      <div className="bg-[#1a1a1a] text-white flex items-center gap-1 px-2 py-0.5 rounded-full shadow-md">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-80"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        <span className="text-[10px] font-bold">{pd.matches}</span>
                      </div>
                      <div className="bg-[#1a1a1a] text-white flex items-center gap-1 px-2 py-0.5 rounded-full shadow-md">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-80"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                        <span className="text-[10px] font-bold">{pd.points}</span>
                      </div>
                    </div>
                  </div>

                  {/* Player Name */}
                  <div className="text-foreground text-[11px] lg:text-[12px] font-bold whitespace-nowrap max-w-[80px] truncate text-center mt-3 drop-shadow-sm">
                    {pd.player.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard sidebar */}
          <div className="lg:w-[260px] border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-card">
            <div className="px-5 py-3 bg-muted/40 border-b border-border">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Top Ratings</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {topXI.map((pd, i) => (
                <div key={pd.player.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <span className={`text-[12px] font-black w-4 text-center shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-500' : i === 2 ? 'text-orange-600' : 'text-muted-foreground/60'}`}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border">
                    {pd.player.profileImageUrl ? (
                      <img src={pd.player.profileImageUrl} alt={pd.player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {pd.player.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-foreground truncate leading-tight">{pd.player.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{pd.matches} M • {pd.points} Pts</span>
                  </div>
                  <span className="text-[14px] font-black text-foreground shrink-0 bg-muted px-2 py-0.5 rounded-md">
                    {(pd.points / Math.max(1, pd.matches)).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
