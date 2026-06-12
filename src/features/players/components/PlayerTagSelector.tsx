import { useFootballStore } from '@/store/footballStore';

export interface PlayerTagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function PlayerTagSelector({ value = [], onChange }: PlayerTagSelectorProps) {
  const availableRoles = useFootballStore(s => s.availableRoles);

  const toggleTag = (tagValue: string) => {
    if (value.includes(tagValue)) {
      onChange(value.filter((t) => t !== tagValue));
    } else {
      onChange([...value, tagValue]);
    }
  };

  if (availableRoles.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground py-2">
        No roles found. Add roles in the <strong>player_role</strong> table in Supabase.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {availableRoles.map((role) => {
          const isSelected = value.includes(role.name);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleTag(role.name)}
              className={[
                'font-mono uppercase tracking-widest text-xs px-3 py-1.5 rounded-none transition-all active:translate-y-0.5 border-2',
                isSelected
                  ? 'bg-secondary text-secondary-foreground border-transparent shadow-retro-active translate-y-[2px]'
                  : 'bg-card text-foreground border-foreground shadow-retro hover:shadow-retro-active',
              ].join(' ')}
            >
              {role.name}
            </button>
          );
        })}
      </div>

      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-t border-dashed border-muted-foreground/30 pt-3 flex justify-between items-center">
        <span>Selected</span>
        <span className="bg-foreground text-background px-2 py-0.5 rounded-none">
          {value.length}
        </span>
      </div>
    </div>
  );
}
