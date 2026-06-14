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
  wins: number;
  goals: number;
  motm: number;
}

// 4-3-3 formation positions on a half-pitch
// x: 0-100 (left to right), y: 0-100 (top = center line, bottom = GK/Goal)
const FORMATION_POSITIONS = [
  // GK
  { x: 50, y: 92, role: 'GK' },
  // DEF (4)
  { x: 18, y: 75, role: 'LB' },
  { x: 37, y: 75, role: 'CB' },
  { x: 63, y: 75, role: 'CB' },
  { x: 82, y: 75, role: 'RB' },
  // MID (3)
  { x: 25, y: 45, role: 'LM' },
  { x: 50, y: 45, role: 'CM' },
  { x: 75, y: 45, role: 'RM' },
  // FWD (3)
  { x: 20, y: 15, role: 'LW' },
  { x: 50, y: 10, role: 'ST' },
  { x: 80, y: 15, role: 'RW' },
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
    // Filter entries for the target month
    const monthEntries = matchEntries.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Group by player and compute points
    const pointsMap = new Map<string, PlayerPoints>();

    for (const entry of monthEntries) {
      const player = players.find(p => p.id === entry.playerId);
      if (!player) continue;

      if (!pointsMap.has(player.id)) {
        pointsMap.set(player.id, { player, points: 0, wins: 0, goals: 0, motm: 0 });
      }
      const data = pointsMap.get(player.id)!;
      if (entry.result === 'win') { data.points += 3; data.wins += 1; }
      else if (entry.result === 'draw') { data.points += 1; }
      data.goals += entry.goals || 0;
      if (entry.motm) { data.points += 2; data.motm += 1; } // bonus for MOTM
    }

    return Array.from(pointsMap.values())
      .sort((a, b) => b.points - a.points || b.goals - a.goals)
      .slice(0, 11);
  }, [players, matchEntries, currentMonth, currentYear]);

  const isEmpty = topXI.length === 0;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex justify-between items-start border-b border-border bg-gradient-to-r from-card to-muted/20">
        <div>
          <h3 className="font-bold text-[18px] tracking-tight">Team of the Month</h3>
          <p className="text-muted-foreground text-[13px] mt-0.5">Top performing XI — <span className="font-semibold text-foreground">{monthName}</span></p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full font-semibold shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block"></span>
          Latest
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center flex-1 h-64 text-muted-foreground text-[13px] bg-muted/10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <span className="text-xl">📅</span>
          </div>
          No match data found yet.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-0 flex-1">
          {/* Pitch Visualization (Half-Pitch) */}
          <div className="relative flex-1 min-h-[420px] lg:min-h-[500px] bg-gradient-to-b from-[#115e59] via-[#064e3b] to-[#022c22] overflow-hidden">
            {/* Lawn stripes effect */}
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, #000 10%, #000 20%)' }}></div>
            
            {/* Pitch markings SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Outer border (left, right, bottom) */}
              <polyline points="4,0 4,96 96,96 96,0" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              
              {/* Center line (top) */}
              <line x1="4" y1="0" x2="96" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              {/* Center circle half (top) */}
              <path d="M 35 0 A 15 15 0 0 0 65 0" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              <circle cx="50" cy="0" r="0.6" fill="rgba(255,255,255,0.5)"/>
              
              {/* Penalty Box (bottom) */}
              <rect x="20" y="80" width="60" height="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              {/* 6-Yard Box (bottom) */}
              <rect x="35" y="92" width="30" height="4" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              {/* Penalty Arc */}
              <path d="M 38 80 A 12 12 0 0 1 62 80" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              {/* Penalty Spot */}
              <circle cx="50" cy="88" r="0.6" fill="rgba(255,255,255,0.5)"/>
              
              {/* Corner arcs */}
              <path d="M 4 92 A 4 4 0 0 0 8 96" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              <path d="M 96 92 A 4 4 0 0 1 92 96" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
            </svg>

            {/* Player dots */}
            {FORMATION_POSITIONS.map((pos, idx) => {
              const playerData = topXI[idx];
              if (!playerData) return null;

              const initials = playerData.player.name
                .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div
                  key={playerData.player.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 group cursor-default"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {/* Avatar circle with glow effect on hover */}
                  <div className="relative transition-transform duration-300 group-hover:scale-110">
                    <div className="absolute inset-0 bg-white rounded-full blur-[6px] opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    {playerData.player.profileImageUrl ? (
                      <img
                        src={playerData.player.profileImageUrl}
                        alt={playerData.player.name}
                        className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-10"
                      />
                    ) : (
                      <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-white font-bold text-[12px] z-10">
                        {initials}
                      </div>
                    )}
                    {/* Position badge */}
                    <span className="absolute -bottom-1 -right-2 text-[9px] font-bold bg-gradient-to-b from-amber-300 to-amber-500 text-black rounded-sm px-1.5 py-0.5 shadow-md z-20">
                      {pos.role}
                    </span>
                  </div>

                  {/* Name tag with glassmorphism */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md whitespace-nowrap max-w-[76px] truncate text-center shadow-sm">
                    {playerData.player.name.split(' ')[0]}
                  </div>

                  {/* Advanced Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-14 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] border border-border px-3 py-1.5 rounded-lg whitespace-nowrap z-30 transition-all duration-200 pointer-events-none shadow-xl flex items-center gap-3 font-medium scale-95 group-hover:scale-100">
                    <div className="flex flex-col items-center">
                      <span className="text-primary font-bold text-[13px] leading-none">{playerData.points}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">Pts</span>
                    </div>
                    <div className="w-px h-6 bg-border"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-[13px] leading-none">{playerData.goals}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">Gls</span>
                    </div>
                    {playerData.motm > 0 && (
                      <>
                        <div className="w-px h-6 bg-border"></div>
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-[13px] text-amber-500 leading-none">{playerData.motm}</span>
                          <span className="text-[9px] text-muted-foreground uppercase">MOTM</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard sidebar */}
          <div className="lg:w-[260px] border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-card/50">
            <div className="px-5 py-3 bg-muted/40 border-b border-border">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Top Points</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {topXI.map((pd, i) => (
                <div key={pd.player.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group">
                  <span className={`text-[12px] font-black w-4 text-center shrink-0 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-muted-foreground/60'}`}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-background shadow-sm group-hover:border-primary/30 transition-colors">
                    {pd.player.profileImageUrl ? (
                      <img src={pd.player.profileImageUrl} alt={pd.player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {pd.player.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[13px] font-semibold truncate leading-tight">{pd.player.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{pd.goals} Goals • {pd.motm} MOTM</span>
                  </div>
                  <span className="text-[14px] font-black text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded-md">{pd.points}</span>
                </div>
              ))}
              {topXI.length < 11 && (
                <div className="px-5 py-4 text-center">
                  <span className="inline-block bg-muted text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full">
                    +{11 - topXI.length} players needed to complete XI
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
