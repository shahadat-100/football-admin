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

// 4-3-3 formation positions on a vertical pitch
// x: 0-100 (left to right), y: 0-100 (top = attack, bottom = GK)
const FORMATION_POSITIONS = [
  // GK
  { x: 50, y: 90, role: 'GK' },
  // DEF (4)
  { x: 18, y: 72, role: 'LB' },
  { x: 37, y: 72, role: 'CB' },
  { x: 63, y: 72, role: 'CB' },
  { x: 82, y: 72, role: 'RB' },
  // MID (3)
  { x: 25, y: 48, role: 'LM' },
  { x: 50, y: 48, role: 'CM' },
  { x: 75, y: 48, role: 'RM' },
  // FWD (3)
  { x: 20, y: 22, role: 'LW' },
  { x: 50, y: 18, role: 'ST' },
  { x: 80, y: 22, role: 'RW' },
];

export function MonthlyTopXI({ players, matchEntries }: MonthlyTopXIProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const topXI = useMemo<PlayerPoints[]>(() => {
    // Filter entries for this month only
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
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex justify-between items-start border-b border-border">
        <div>
          <h3 className="font-bold text-[17px] tracking-tight">Monthly XI</h3>
          <p className="text-muted-foreground text-[12px] mt-0.5">Top 11 players by points — {monthName}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
          Live
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-[13px]">
          No match data for {monthName} yet.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-0">
          {/* Pitch Visualization */}
          <div className="relative flex-1 min-h-[420px] lg:min-h-[480px] bg-gradient-to-b from-[#064e3b] via-[#065f46] to-[#064e3b] overflow-hidden">
            {/* Pitch markings SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Outer border */}
              <rect x="4" y="2" width="92" height="96" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
              {/* Center circle */}
              <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.3)"/>
              {/* Center line */}
              <line x1="4" y1="50" x2="96" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
              {/* Top penalty box */}
              <rect x="24" y="2" width="52" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
              {/* Top 6-yard box */}
              <rect x="36" y="2" width="28" height="7" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
              {/* Bottom penalty box */}
              <rect x="24" y="80" width="52" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
              {/* Bottom 6-yard box */}
              <rect x="36" y="91" width="28" height="7" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
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
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {/* Avatar circle */}
                  <div className="relative">
                    {playerData.player.profileImageUrl ? (
                      <img
                        src={playerData.player.profileImageUrl}
                        alt={playerData.player.name}
                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-white/80 shadow-lg"
                      />
                    ) : (
                      <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/20 border-2 border-white/80 shadow-lg flex items-center justify-center text-white font-bold text-[11px]">
                        {initials}
                      </div>
                    )}
                    {/* Position badge */}
                    <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-amber-400 text-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {pos.role}
                    </span>
                  </div>

                  {/* Name tag */}
                  <div className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[64px] truncate text-center leading-tight">
                    {playerData.player.name.split(' ')[0]}
                  </div>

                  {/* Points tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap z-20 transition-opacity pointer-events-none shadow-xl">
                    {playerData.points} pts · {playerData.goals}G · {playerData.motm}M
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard sidebar */}
          <div className="lg:w-[220px] border-t lg:border-t-0 lg:border-l border-border divide-y divide-border/60">
            <div className="px-4 py-2.5 bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Points Table</p>
            </div>
            {topXI.map((pd, i) => (
              <div key={pd.player.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                <span className={`text-[11px] font-bold w-4 text-center shrink-0 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-border">
                  {pd.player.profileImageUrl ? (
                    <img src={pd.player.profileImageUrl} alt={pd.player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      {pd.player.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-[12px] font-medium flex-1 truncate">{pd.player.name}</span>
                <span className="text-[12px] font-bold text-primary shrink-0">{pd.points}</span>
              </div>
            ))}
            {topXI.length < 11 && (
              <div className="px-4 py-3 text-center text-muted-foreground text-[11px]">
                +{11 - topXI.length} more needed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
