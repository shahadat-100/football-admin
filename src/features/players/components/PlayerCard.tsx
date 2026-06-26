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
        "bg-card border rounded-xl transition-colors flex flex-col items-stretch overflow-hidden relative",
        hover ? "border-primary" : "border-border"
      )}
    >
      {/* Cover Image Banner */}
      {player.coverImageUrl ? (
        <div 
          className="h-24 w-full bg-cover bg-center" 
          style={{ backgroundImage: `url(${player.coverImageUrl})` }}
        />
      ) : (
        <div className="h-16 w-full bg-muted" />
      )}

      <div className="px-4 pb-4 pt-0 flex flex-col flex-1">
        <div className="flex items-end justify-between mb-3 -mt-10 relative z-10">
          <div className="flex gap-3 items-end">
            <div className="rounded-full border-4 border-card bg-card overflow-hidden">
              <Avatar name={player.name} size={72} src={player.profileImageUrl} />
            </div>
            <div className="pb-2">
              <p className="font-semibold text-[16px]">{player.name}</p>
              <p className="text-muted-foreground text-[12px]">#{player.jerseyNumber || '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 mt-1">
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
          {(player.customStringTags ?? []).slice(0, 2).map(t => (
            <Badge key={`str-${t}`} bg="#1e3a5f" c="#93c5fd">{t}</Badge>
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
    </div>
  );
}
