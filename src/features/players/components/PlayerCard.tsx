import { useState } from 'react';
import { Player } from '../types';
import { Avatar, Badge, Button } from '@/shared/components';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { cn } from '@/shared/lib/cn';

interface PlayerCardProps {
  player: Player;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlayerCard({ player, onView, onEdit, onDelete }: PlayerCardProps) {
  const [hover, setHover] = useState(false);
  const stats = usePlayerStats(player.id);

  return (
    <div 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)}
      className={cn(
        "bg-card border rounded-xl p-4 transition-colors flex flex-col items-stretch",
        hover ? "border-primary" : "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-4 items-center">
          <Avatar name={player.name} size={80} src={player.profileImageUrl} />
          <div>
            <p className="font-semibold text-[16px]">{player.name}</p>
            <p className="text-muted-foreground text-[12px]">#{player.jerseyNumber || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'MP',   value: stats.totalMatches, color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
          { label: 'Goals',value: stats.totalGoals,   color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
          { label: 'MOTM', value: stats.totalMOTM,    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-lg p-2 text-center"
            style={{ background: bg, border: `1.5px solid ${color}33` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
            <p className="text-[17px] font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {(player.playerRoles ?? []).slice(0, 3).map(t => (
          <Badge key={t} bg="#1a1a1a" c="#e5e5e5">{t}</Badge>
        ))}
        {(player.customTags ?? []).slice(0, 2).map(t => (
          <Badge key={t} bg="#4b5563" c="#e5e7eb">{t}</Badge>
        ))}
      </div>

      {stats.seasonBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {stats.seasonBreakdown.map(sb => (
             <span key={sb.year} className="text-[10px] border border-border bg-popover px-1.5 rounded text-muted-foreground">
               {sb.year}: {sb.goals}g
             </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-between mt-auto pt-2">
        <Button size="sm" onClick={onView}>View →</Button>
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(); }}>✎</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</Button>
        </div>
      </div>
    </div>
  );
}
