import { Player } from '@/features/players/types';
import { Avatar } from '@/shared/components';

interface AwardData {
  player: Player;
  motm: number;
  cleanSheets: number;
  hattricks: number;
}

interface AwardsLeaderboardProps {
  data: AwardData[];
}

export function AwardsLeaderboard({ data }: AwardsLeaderboardProps) {
  const topMotm = [...data].sort((a, b) => b.motm - a.motm).slice(0, 3).filter(d => d.motm > 0);
  const topCleanSheets = [...data].sort((a, b) => b.cleanSheets - a.cleanSheets).slice(0, 3).filter(d => d.cleanSheets > 0);
  const topHattricks = [...data].sort((a, b) => b.hattricks - a.hattricks).slice(0, 3).filter(d => d.hattricks > 0);

  const Column = ({ title, icon, items, valueKey }: { title: string, icon: string, items: AwardData[], valueKey: keyof AwardData }) => (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-4 bg-muted/50 p-2 rounded-lg">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-2">No awards yet</p>
        ) : (
          items.map((item, i) => (
            <div key={item.player.id} className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground w-3">{i + 1}</span>
                <Avatar name={item.player.name} size={24} src={(item.player as any).profileImageUrl} />
                <span className="text-sm truncate w-20">{item.player.name.split(' ')[0]}</span>
              </div>
              <span className="font-bold text-sm bg-background border border-border px-2 py-0.5 rounded-full">{item[valueKey] as number}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
      <p className="font-semibold text-base mb-6 text-foreground">Awards Leaderboard</p>
      <div className="flex flex-col md:flex-row gap-6 md:gap-4 flex-1">
        <Column title="MOTM" icon="⭐" items={topMotm} valueKey="motm" />
        <Column title="Clean Sheets" icon="🧤" items={topCleanSheets} valueKey="cleanSheets" />
        <Column title="Hat-tricks" icon="🎩" items={topHattricks} valueKey="hattricks" />
      </div>
    </div>
  );
}
